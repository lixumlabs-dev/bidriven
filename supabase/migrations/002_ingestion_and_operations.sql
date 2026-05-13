-- ============================================================
-- BiDriven — Migration 002: Ingestão + Operação
-- Cobre: fontes de dados, jobs de sync, formulários dinâmicos,
--        lançamentos dos Operadores e audit trail completo
-- ============================================================

-- ─────────────────────────────────────────────
-- HELPER: retorna todos os company_ids do usuário logado
-- Usado nas policies RLS (sem recursão)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.my_company_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid();
$$;

-- ─────────────────────────────────────────────
-- 1. DATA SOURCES — conectores configurados
-- ─────────────────────────────────────────────
CREATE TABLE public.data_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
                'google_sheets','rest_api','postgresql','mysql','csv','manual'
              )),
  config      JSONB NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'inactive'
                CHECK (status IN ('active','inactive','error')),
  last_sync_at TIMESTAMPTZ,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. INGESTION JOBS — agendamentos de sync
-- ─────────────────────────────────────────────
CREATE TABLE public.ingestion_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id   UUID NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  schedule    TEXT,           -- cron expression; NULL = manual only
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','paused')),
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. INGESTION RUNS — histórico de execuções
-- ─────────────────────────────────────────────
CREATE TABLE public.ingestion_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          UUID NOT NULL REFERENCES public.ingestion_jobs(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES public.companies(id),
  status          TEXT NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running','success','failed')),
  rows_processed  INTEGER NOT NULL DEFAULT 0,
  rows_failed     INTEGER NOT NULL DEFAULT 0,
  error_log       JSONB,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 4. RAW RECORDS — dados brutos chegando (JSONB)
-- ─────────────────────────────────────────────
CREATE TABLE public.raw_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  source_id    UUID NOT NULL REFERENCES public.data_sources(id),
  run_id       UUID REFERENCES public.ingestion_runs(id),
  payload      JSONB NOT NULL,
  ingested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raw_records_company   ON public.raw_records (company_id);
CREATE INDEX idx_raw_records_source    ON public.raw_records (source_id);
CREATE INDEX idx_raw_records_ingested  ON public.raw_records (ingested_at DESC);

-- ─────────────────────────────────────────────
-- 5. FORM TEMPLATES — Analista cria formulários dinâmicos
-- ─────────────────────────────────────────────
CREATE TABLE public.form_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','active','archived')),
  version     INTEGER NOT NULL DEFAULT 1,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. FORM FIELDS — campos dinâmicos de cada template
-- ─────────────────────────────────────────────
CREATE TABLE public.form_fields (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,   -- chave interna (snake_case)
  label         TEXT NOT NULL,   -- rótulo exibido ao Operador
  field_type    TEXT NOT NULL CHECK (field_type IN (
                  'text','number','date','datetime',
                  'select','multiselect','boolean','currency','percentage'
                )),
  required      BOOLEAN NOT NULL DEFAULT FALSE,
  order_index   INTEGER NOT NULL DEFAULT 0,
  options       JSONB,           -- [{label, value}] para select/multiselect
  validations   JSONB,           -- {min, max, pattern, message}
  default_value TEXT,
  help_text     TEXT,
  UNIQUE (template_id, name)
);

-- ─────────────────────────────────────────────
-- 7. DATA ENTRIES — lançamentos dos Operadores
-- ─────────────────────────────────────────────
CREATE TABLE public.data_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id   UUID NOT NULL REFERENCES public.form_templates(id),
  values        JSONB NOT NULL DEFAULT '{}',  -- {field_name: value}
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','flagged')),
  submitted_by  UUID NOT NULL REFERENCES public.profiles(id),
  reviewed_by   UUID REFERENCES public.profiles(id),
  reviewed_at   TIMESTAMPTZ,
  review_notes  TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_data_entries_company  ON public.data_entries (company_id);
CREATE INDEX idx_data_entries_template ON public.data_entries (template_id);
CREATE INDEX idx_data_entries_status   ON public.data_entries (status);
CREATE INDEX idx_data_entries_submitted_by ON public.data_entries (submitted_by);

-- ─────────────────────────────────────────────
-- 8. AUDIT LOG — rastreio de toda escrita
-- ─────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id),
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  actor_id    UUID REFERENCES public.profiles(id),
  diff        JSONB,            -- {before: {}, after: {}}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_company    ON public.audit_log (company_id);
CREATE INDEX idx_audit_log_table      ON public.audit_log (table_name, record_id);
CREATE INDEX idx_audit_log_actor      ON public.audit_log (actor_id);
CREATE INDEX idx_audit_log_created    ON public.audit_log (created_at DESC);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.data_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_jobs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log       ENABLE ROW LEVEL SECURITY;

-- Padrão: membro da empresa vê os dados da empresa
CREATE POLICY "data_sources: member read"
  ON public.data_sources FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "data_sources: analista write"
  ON public.data_sources FOR ALL
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "ingestion_jobs: member read"
  ON public.ingestion_jobs FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "ingestion_jobs: analista write"
  ON public.ingestion_jobs FOR ALL
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "ingestion_runs: member read"
  ON public.ingestion_runs FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "ingestion_runs: write"
  ON public.ingestion_runs FOR INSERT
  WITH CHECK (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "raw_records: member read"
  ON public.raw_records FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "raw_records: write"
  ON public.raw_records FOR INSERT
  WITH CHECK (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "form_templates: member read"
  ON public.form_templates FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "form_templates: analista write"
  ON public.form_templates FOR ALL
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "form_fields: member read"
  ON public.form_fields FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM public.form_templates
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

CREATE POLICY "form_fields: analista write"
  ON public.form_fields FOR ALL
  USING (
    template_id IN (
      SELECT id FROM public.form_templates
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

-- Operador lança; Analista/Gestor revisam
CREATE POLICY "data_entries: member read"
  ON public.data_entries FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "data_entries: operador insert"
  ON public.data_entries FOR INSERT
  WITH CHECK (
    company_id IN (SELECT public.my_company_ids())
    AND submitted_by = auth.uid()
  );

CREATE POLICY "data_entries: analista update"
  ON public.data_entries FOR UPDATE
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "audit_log: member read"
  ON public.audit_log FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "audit_log: insert"
  ON public.audit_log FOR INSERT
  WITH CHECK (company_id IN (SELECT public.my_company_ids()));

-- ─────────────────────────────────────────────
-- TRIGGER: audit automático em data_entries
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.audit_data_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (company_id, table_name, record_id, action, actor_id, diff)
    VALUES (NEW.company_id, 'data_entries', NEW.id, 'insert', NEW.submitted_by,
            jsonb_build_object('after', row_to_json(NEW)));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (company_id, table_name, record_id, action, actor_id, diff)
    VALUES (NEW.company_id, 'data_entries', NEW.id, 'update', auth.uid(),
            jsonb_build_object('before', row_to_json(OLD), 'after', row_to_json(NEW)));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_data_entries
  AFTER INSERT OR UPDATE ON public.data_entries
  FOR EACH ROW EXECUTE FUNCTION public.audit_data_entry();

-- TRIGGER: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_data_sources_updated_at
  BEFORE UPDATE ON public.data_sources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
