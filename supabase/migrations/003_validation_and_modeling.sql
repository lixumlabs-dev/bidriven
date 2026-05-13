-- ============================================================
-- BiDriven — Migration 003: Validação + Modelagem
-- Cobre: regras de negócio, fila de validação,
--        modelos certificados e seus registros
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. BUSINESS RULES — regras definidas pelo Analista
-- ─────────────────────────────────────────────
CREATE TABLE public.business_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_id  UUID REFERENCES public.form_templates(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  rule_type    TEXT NOT NULL CHECK (rule_type IN (
                 'validation',     -- bloqueia entrada inválida
                 'transformation', -- converte/normaliza valor
                 'flag'            -- sinaliza para revisão humana
               )),
  -- condition: {field, operator, value} ou expressão composta
  -- ex: {"field": "valor_venda", "operator": "gt", "value": 0}
  condition    JSONB NOT NULL,
  -- action: o que fazer quando condition=true
  -- ex: {"reject": true, "message": "Valor deve ser positivo"}
  action       JSONB NOT NULL,
  severity     TEXT NOT NULL DEFAULT 'warning'
                 CHECK (severity IN ('info','warning','error')),
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive')),
  version      INTEGER NOT NULL DEFAULT 1,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_business_rules_company  ON public.business_rules (company_id);
CREATE INDEX idx_business_rules_template ON public.business_rules (template_id);

-- ─────────────────────────────────────────────
-- 2. RULE VALIDATIONS — resultado por entry + regra
-- ─────────────────────────────────────────────
CREATE TABLE public.rule_validations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     UUID NOT NULL REFERENCES public.data_entries(id) ON DELETE CASCADE,
  rule_id      UUID NOT NULL REFERENCES public.business_rules(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES public.companies(id),
  passed       BOOLEAN NOT NULL,
  message      TEXT,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_id, rule_id)
);

CREATE INDEX idx_rule_validations_entry ON public.rule_validations (entry_id);
CREATE INDEX idx_rule_validations_rule  ON public.rule_validations (rule_id);

-- ─────────────────────────────────────────────
-- 3. DATA MODELS — datasets certificados pelo Analista
-- ─────────────────────────────────────────────
CREATE TABLE public.data_models (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','active','archived')),
  version           INTEGER NOT NULL DEFAULT 1,
  refresh_schedule  TEXT,        -- cron; NULL = manual
  last_refreshed_at TIMESTAMPTZ,
  created_by        UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. MODEL FIELDS — colunas do modelo
-- ─────────────────────────────────────────────
CREATE TABLE public.model_fields (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id     UUID NOT NULL REFERENCES public.data_models(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,    -- chave interna
  label        TEXT NOT NULL,    -- rótulo exibido
  field_type   TEXT NOT NULL CHECK (field_type IN (
                 'text','number','date','datetime',
                 'boolean','currency','percentage'
               )),
  order_index  INTEGER NOT NULL DEFAULT 0,
  is_dimension BOOLEAN NOT NULL DEFAULT FALSE, -- dimensão (filtro) vs métrica (número)
  aggregation  TEXT CHECK (aggregation IN ('sum','avg','count','min','max')),
  format       TEXT,             -- ex: 'R$ #.###,##' para currency
  UNIQUE (model_id, name)
);

-- ─────────────────────────────────────────────
-- 5. MODEL SOURCES — o que alimenta cada modelo
-- ─────────────────────────────────────────────
CREATE TABLE public.model_sources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id     UUID NOT NULL REFERENCES public.data_models(id) ON DELETE CASCADE,
  source_type  TEXT NOT NULL CHECK (source_type IN (
                 'form_template', -- lançamentos dos Operadores
                 'raw_records',   -- dados de conectores externos
                 'data_model'     -- composição de outro modelo
               )),
  source_id    UUID NOT NULL,    -- ID da fonte (form_template, data_source, ou data_model)
  field_mapping JSONB NOT NULL DEFAULT '{}',
  -- ex: {"model_field_name": "form_field_name"}
  filters      JSONB            -- filtros aplicados na fonte
);

-- ─────────────────────────────────────────────
-- 6. MODEL RECORDS — dados certificados (linhas do modelo)
-- ─────────────────────────────────────────────
CREATE TABLE public.model_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        UUID NOT NULL REFERENCES public.data_models(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES public.companies(id),
  values          JSONB NOT NULL DEFAULT '{}',   -- {field_name: value}
  source_entry_id UUID REFERENCES public.data_entries(id) ON DELETE SET NULL,
  certified_by    UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_model_records_model   ON public.model_records (model_id);
CREATE INDEX idx_model_records_company ON public.model_records (company_id);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.business_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_models      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_fields     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_sources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_records    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_rules: member read"
  ON public.business_rules FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "business_rules: analista write"
  ON public.business_rules FOR ALL
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "rule_validations: member read"
  ON public.rule_validations FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "rule_validations: write"
  ON public.rule_validations FOR INSERT
  WITH CHECK (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "data_models: member read"
  ON public.data_models FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "data_models: analista write"
  ON public.data_models FOR ALL
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "model_fields: member read"
  ON public.model_fields FOR SELECT
  USING (
    model_id IN (
      SELECT id FROM public.data_models
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

CREATE POLICY "model_fields: analista write"
  ON public.model_fields FOR ALL
  USING (
    model_id IN (
      SELECT id FROM public.data_models
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

CREATE POLICY "model_sources: member read"
  ON public.model_sources FOR SELECT
  USING (
    model_id IN (
      SELECT id FROM public.data_models
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

CREATE POLICY "model_sources: analista write"
  ON public.model_sources FOR ALL
  USING (
    model_id IN (
      SELECT id FROM public.data_models
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

CREATE POLICY "model_records: member read"
  ON public.model_records FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "model_records: write"
  ON public.model_records FOR INSERT
  WITH CHECK (company_id IN (SELECT public.my_company_ids()));

-- ─────────────────────────────────────────────
-- TRIGGERS updated_at
-- ─────────────────────────────────────────────
CREATE TRIGGER set_business_rules_updated_at
  BEFORE UPDATE ON public.business_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_data_models_updated_at
  BEFORE UPDATE ON public.data_models
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
