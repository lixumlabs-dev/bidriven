-- ============================================================
-- BiDriven — Migration 001: Schema inicial multi-tenant RBAC
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. COMPANIES (tenants)
-- ─────────────────────────────────────────────
CREATE TABLE public.companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  logo_url   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. PROFILES (espelha auth.users 1:1)
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cria perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 3. ROLES
-- ─────────────────────────────────────────────
CREATE TABLE public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO public.roles (name, description) VALUES
  ('gestor',   'Acesso total à empresa, delegação e dashboards'),
  ('analista', 'Regras de negócio, catálogo, dashboards e agentes IA'),
  ('operador', 'Monitoramento e lançamentos manuais de dados');

-- ─────────────────────────────────────────────
-- 4. PERMISSIONS
-- ─────────────────────────────────────────────
CREATE TABLE public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT
);

INSERT INTO public.permissions (name, description) VALUES
  ('dashboard.view',    'Visualizar dashboards'),
  ('dashboard.create',  'Criar e editar dashboards'),
  ('catalog.view',      'Visualizar catálogo de dados'),
  ('catalog.edit',      'Editar modelos e bases no catálogo'),
  ('data.read',         'Ler dados da empresa'),
  ('data.write',        'Lançar dados manualmente'),
  ('agents.trigger',    'Acionar agentes de IA'),
  ('pipeline.view',     'Visualizar pipelines'),
  ('pipeline.edit',     'Editar e configurar pipelines'),
  ('team.manage',       'Gerenciar membros da empresa'),
  ('company.settings',  'Configurações da empresa');

-- ─────────────────────────────────────────────
-- 5. ROLE_PERMISSIONS (defaults por papel)
-- ─────────────────────────────────────────────
CREATE TABLE public.role_permissions (
  role_id       UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Gestor: tudo
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'gestor';

-- Analista: tudo exceto data.write, team.manage, company.settings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'analista'
  AND p.name IN (
    'dashboard.view', 'dashboard.create',
    'catalog.view', 'catalog.edit',
    'data.read', 'agents.trigger',
    'pipeline.view', 'pipeline.edit'
  );

-- Operador: só dashboard.view, data.read, data.write
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'operador'
  AND p.name IN ('dashboard.view', 'data.read', 'data.write');

-- ─────────────────────────────────────────────
-- 6. COMPANY_MEMBERS (usuário ↔ empresa ↔ papel)
-- ─────────────────────────────────────────────
CREATE TABLE public.company_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES public.roles(id),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, company_id)
);

-- ─────────────────────────────────────────────
-- 7. MEMBER_PERMISSIONS (overrides granulares)
-- ─────────────────────────────────────────────
CREATE TABLE public.member_permissions (
  member_id     UUID REFERENCES public.company_members(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted       BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (member_id, permission_id)
);

-- ─────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE public.companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário vê só o próprio perfil
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Companies: vê só empresas em que é membro
CREATE POLICY "companies: member read"
  ON public.companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_members.company_id = companies.id
        AND company_members.user_id = auth.uid()
    )
  );

-- Company members: vê só membros das suas empresas
CREATE POLICY "company_members: same company read"
  ON public.company_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = company_members.company_id
        AND cm.user_id = auth.uid()
    )
  );

-- Gestores podem inserir/deletar membros nas suas empresas
CREATE POLICY "company_members: gestor manage"
  ON public.company_members FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_members cm
      JOIN public.roles r ON r.id = cm.role_id
      WHERE cm.company_id = company_members.company_id
        AND cm.user_id = auth.uid()
        AND r.name = 'gestor'
    )
  );

-- Member permissions: vê os próprios overrides
CREATE POLICY "member_permissions: own read"
  ON public.member_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.id = member_permissions.member_id
        AND cm.user_id = auth.uid()
    )
  );

-- Roles e permissions são públicos para leitura (tabelas de referência)
CREATE POLICY "roles: public read"
  ON public.roles FOR SELECT USING (TRUE);

CREATE POLICY "permissions: public read"
  ON public.permissions FOR SELECT USING (TRUE);

CREATE POLICY "role_permissions: public read"
  ON public.role_permissions FOR SELECT USING (TRUE);

-- ─────────────────────────────────────────────
-- 9. FUNÇÃO: resolver permissões efetivas de um membro
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_member_permissions(
  p_user_id    UUID,
  p_company_id UUID
)
RETURNS TABLE (permission_name TEXT, granted BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  WITH member AS (
    SELECT cm.id, cm.role_id
    FROM public.company_members cm
    WHERE cm.user_id = p_user_id AND cm.company_id = p_company_id
    LIMIT 1
  ),
  base_perms AS (
    -- permissões default do papel
    SELECT p.name AS permission_name, TRUE AS granted
    FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN member m ON m.role_id = rp.role_id
  ),
  overrides AS (
    -- overrides granulares do membro
    SELECT p.name AS permission_name, mp.granted
    FROM public.member_permissions mp
    JOIN public.permissions p ON p.id = mp.permission_id
    JOIN member m ON m.id = mp.member_id
  )
  SELECT
    COALESCE(o.permission_name, b.permission_name),
    COALESCE(o.granted, b.granted)
  FROM base_perms b
  FULL OUTER JOIN overrides o ON o.permission_name = b.permission_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
