-- ============================================================
-- BiDriven — Migration 004: Dashboards + Agentes IA
-- Cobre: dashboards, widgets, bindings de dados,
--        requisições de agentes e log de execução
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. DASHBOARDS — criados pelo Analista
-- ─────────────────────────────────────────────
CREATE TABLE public.dashboards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','published','archived')),
  version       INTEGER NOT NULL DEFAULT 1,
  -- layout: array de posições no grid (gerado pelo builder)
  layout        JSONB NOT NULL DEFAULT '[]',
  created_by    UUID REFERENCES public.profiles(id),
  published_by  UUID REFERENCES public.profiles(id),
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. DASHBOARD WIDGETS — cada card/gráfico do dashboard
-- ─────────────────────────────────────────────
CREATE TABLE public.dashboard_widgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  widget_type  TEXT NOT NULL CHECK (widget_type IN (
                 'kpi',          -- número único com variação
                 'bar_chart',    -- barras
                 'line_chart',   -- linha/área
                 'pie_chart',    -- pizza/donut
                 'table',        -- tabela de dados
                 'text',         -- bloco de texto/markdown
                 'gauge',        -- velocímetro
                 'scatter'       -- dispersão
               )),
  title        TEXT NOT NULL,
  -- position: {x, y, w, h} no grid responsivo
  position     JSONB NOT NULL DEFAULT '{"x":0,"y":0,"w":6,"h":4}',
  -- config: opções visuais do widget (cores, labels, etc)
  config       JSONB NOT NULL DEFAULT '{}',
  model_id     UUID REFERENCES public.data_models(id) ON DELETE SET NULL,
  -- query_config: como consultar o model (filtros, groupby, métricas)
  -- ex: {"metric": "field_name", "dimension": "field_name", "filters": []}
  query_config JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_widgets_dashboard ON public.dashboard_widgets (dashboard_id);

-- ─────────────────────────────────────────────
-- 3. DASHBOARD ACCESS LOG — quem acessou e quando
-- ─────────────────────────────────────────────
CREATE TABLE public.dashboard_views (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES public.companies(id),
  viewer_id    UUID NOT NULL REFERENCES public.profiles(id),
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dashboard_views_dashboard ON public.dashboard_views (dashboard_id);

-- ─────────────────────────────────────────────
-- 4. AGENT REQUESTS — Analista solicita ação de IA
-- ─────────────────────────────────────────────
CREATE TABLE public.agent_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES public.companies(id),
  requested_by  UUID NOT NULL REFERENCES public.profiles(id),
  agent_type    TEXT NOT NULL CHECK (agent_type IN (
                  'build_dashboard',   -- construir dashboard a partir de um modelo
                  'apply_rules',       -- rodar regras de negócio em um lote de entries
                  'analyze_data',      -- análise exploratória de um modelo
                  'suggest_model',     -- sugerir estrutura de modelo a partir de raw data
                  'validate_entries',  -- validar um lote de lançamentos
                  'generate_report'    -- gerar relatório textual
                )),
  -- context: o que o agente deve usar como input
  -- ex: {"model_id": "uuid", "dashboard_id": "uuid", "entry_ids": [...]}
  context       JSONB NOT NULL DEFAULT '{}',
  prompt        TEXT,           -- instrução adicional do Analista
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','running','done','failed','cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_requests_company ON public.agent_requests (company_id);
CREATE INDEX idx_agent_requests_status  ON public.agent_requests (status);

-- ─────────────────────────────────────────────
-- 5. AGENT RUNS — execução + resultado + log
-- ─────────────────────────────────────────────
CREATE TABLE public.agent_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   UUID NOT NULL REFERENCES public.agent_requests(id) ON DELETE CASCADE,
  company_id   UUID NOT NULL REFERENCES public.companies(id),
  status       TEXT NOT NULL DEFAULT 'running'
                 CHECK (status IN ('running','done','failed')),
  -- result: o que o agente produziu
  -- ex: {dashboard_id: "uuid"} ou {rules_applied: 42, flagged: 3}
  result       JSONB,
  log          TEXT,            -- trace de execução para debug
  tokens_used  INTEGER,         -- custo de tokens da chamada IA
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ
);

CREATE INDEX idx_agent_runs_request ON public.agent_runs (request_id);

-- ─────────────────────────────────────────────
-- 6. NOTIFICATIONS — alertas para os usuários
-- ─────────────────────────────────────────────
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id),
  user_id     UUID NOT NULL REFERENCES public.profiles(id),
  type        TEXT NOT NULL CHECK (type IN (
                'entry_approved',    -- Operador: seu lançamento foi aprovado
                'entry_rejected',    -- Operador: seu lançamento foi rejeitado
                'entry_flagged',     -- Analista: lançamento sinalizado para revisão
                'agent_done',        -- Analista: agente concluiu tarefa
                'rule_violated',     -- Analista: regra violada em lançamento
                'model_refreshed',   -- Gestor/Analista: modelo atualizado
                'dashboard_published'-- Gestor: novo dashboard disponível
              )),
  title       TEXT NOT NULL,
  body        TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  link        TEXT,             -- rota interna para navegar ao clicar
  metadata    JSONB,            -- {entry_id, agent_run_id, etc}
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user    ON public.notifications (user_id, read);
CREATE INDEX idx_notifications_company ON public.notifications (company_id);

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.dashboards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_views     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;

-- Dashboards: todos membros veem publicados; Analista vê todos (draft inclusive)
CREATE POLICY "dashboards: member read published"
  ON public.dashboards FOR SELECT
  USING (
    company_id IN (SELECT public.my_company_ids())
    AND status = 'published'
  );

CREATE POLICY "dashboards: analista read all"
  ON public.dashboards FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "dashboards: analista write"
  ON public.dashboards FOR ALL
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "widgets: member read"
  ON public.dashboard_widgets FOR SELECT
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

CREATE POLICY "widgets: analista write"
  ON public.dashboard_widgets FOR ALL
  USING (
    dashboard_id IN (
      SELECT id FROM public.dashboards
      WHERE company_id IN (SELECT public.my_company_ids())
    )
  );

CREATE POLICY "dashboard_views: member insert"
  ON public.dashboard_views FOR INSERT
  WITH CHECK (
    company_id IN (SELECT public.my_company_ids())
    AND viewer_id = auth.uid()
  );

CREATE POLICY "dashboard_views: analista read"
  ON public.dashboard_views FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

CREATE POLICY "agent_requests: member read own"
  ON public.agent_requests FOR SELECT
  USING (
    company_id IN (SELECT public.my_company_ids())
    AND requested_by = auth.uid()
  );

CREATE POLICY "agent_requests: analista write"
  ON public.agent_requests FOR INSERT
  WITH CHECK (
    company_id IN (SELECT public.my_company_ids())
    AND requested_by = auth.uid()
  );

CREATE POLICY "agent_runs: member read"
  ON public.agent_runs FOR SELECT
  USING (company_id IN (SELECT public.my_company_ids()));

-- Notificações: cada usuário vê só as próprias
CREATE POLICY "notifications: own read"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications: own update"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications: insert"
  ON public.notifications FOR INSERT
  WITH CHECK (company_id IN (SELECT public.my_company_ids()));

-- ─────────────────────────────────────────────
-- TRIGGERS updated_at
-- ─────────────────────────────────────────────
CREATE TRIGGER set_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
