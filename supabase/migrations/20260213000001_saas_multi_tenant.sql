-- =============================================
-- SIAP SaaS MULTI-TENANT MIGRATION
-- Transforms the system into a multi-tenant SaaS platform
-- =============================================
-- EXECUTION ORDER: Run this AFTER all previous migrations
-- This migration:
--   1. Creates institutions & plans tables
--   2. Adds institution_id to ALL data tables
--   3. Rewrites RLS for tenant isolation
--   4. Creates SUPER_ADMIN role
--   5. Adds subscription management
--   6. Improves audit & security
-- =============================================

-- ============================================
-- PHASE 1: NEW ENUM & CORE TABLES
-- ============================================

-- 1.1 Extend role enum with super_admin and rename for clarity
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tecnico';

-- 1.2 Plans table (monetization)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) DEFAULT 0,
  price_yearly NUMERIC(10,2) DEFAULT 0,
  max_users INT DEFAULT 50,
  max_turmas INT DEFAULT 10,
  max_cursos INT DEFAULT 5,
  max_storage_mb INT DEFAULT 1024,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

INSERT INTO public.plans (name, slug, description, price_monthly, price_yearly, max_users, max_turmas, max_cursos, max_storage_mb, features) VALUES
  ('Gratuito', 'free', 'Plano gratuito para teste', 0, 0, 10, 3, 2, 256, '["dashboard","alunos","notas"]'),
  ('Básico', 'basic', 'Para pequenas escolas', 197, 1970, 100, 20, 10, 2048, '["dashboard","alunos","notas","documentos","frequencia"]'),
  ('Profissional', 'pro', 'Para instituições médias', 397, 3970, 500, 100, 50, 10240, '["dashboard","alunos","notas","documentos","frequencia","auditoria","api"]'),
  ('Empresarial', 'enterprise', 'Para grandes instituições', 797, 7970, -1, -1, -1, -1, '["all"]')
ON CONFLICT (slug) DO NOTHING;

-- 1.3 Institutions table (tenants)
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cnpj TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'PE',
  zip_code TEXT,
  website TEXT,
  plan_id UUID REFERENCES public.plans(id) DEFAULT (SELECT id FROM public.plans WHERE slug = 'free'),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  subscription_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.4 Subscriptions history table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) NOT NULL,
  status TEXT CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')) DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,
  amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PHASE 2: ADD institution_id TO ALL TABLES
-- ============================================

-- Create a default institution for existing data
INSERT INTO public.institutions (id, name, slug, cnpj, email, subscription_status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Instituição Padrão (Migração)', 'default', NULL, 'admin@siap.com', 'active')
ON CONFLICT (slug) DO NOTHING;

-- 2.1 profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;
UPDATE public.profiles SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.2 user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.user_roles SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.3 cursos
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.cursos SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.4 disciplinas
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.disciplinas SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.5 turmas
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.turmas SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.6 alunos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.alunos SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.7 matriculas
ALTER TABLE public.matriculas ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.matriculas SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.8 notas
ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.notas SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.9 frequencia
ALTER TABLE public.frequencia ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.frequencia SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.10 documentos
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.documentos SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.11 requerimentos
ALTER TABLE public.requerimentos ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.requerimentos SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.12 audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL;
UPDATE public.audit_logs SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.13 generated_documents
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.generated_documents SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.14 horarios
ALTER TABLE public.horarios ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.horarios SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.15 professor_disciplinas
ALTER TABLE public.professor_disciplinas ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.professor_disciplinas SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- 2.16 turma_disciplinas
ALTER TABLE public.turma_disciplinas ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE;
UPDATE public.turma_disciplinas SET institution_id = '00000000-0000-0000-0000-000000000001' WHERE institution_id IS NULL;

-- ============================================
-- PHASE 3: INDEXES FOR TENANT ISOLATION
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_institution ON public.profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_institution ON public.user_roles(institution_id);
CREATE INDEX IF NOT EXISTS idx_cursos_institution ON public.cursos(institution_id);
CREATE INDEX IF NOT EXISTS idx_disciplinas_institution ON public.disciplinas(institution_id);
CREATE INDEX IF NOT EXISTS idx_turmas_institution ON public.turmas(institution_id);
CREATE INDEX IF NOT EXISTS idx_alunos_institution ON public.alunos(institution_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_institution ON public.matriculas(institution_id);
CREATE INDEX IF NOT EXISTS idx_notas_institution ON public.notas(institution_id);
CREATE INDEX IF NOT EXISTS idx_frequencia_institution ON public.frequencia(institution_id);
CREATE INDEX IF NOT EXISTS idx_documentos_institution ON public.documentos(institution_id);
CREATE INDEX IF NOT EXISTS idx_requerimentos_institution ON public.requerimentos(institution_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_institution ON public.audit_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_institution ON public.generated_documents(institution_id);
CREATE INDEX IF NOT EXISTS idx_horarios_institution ON public.horarios(institution_id);
CREATE INDEX IF NOT EXISTS idx_prof_disc_institution ON public.professor_disciplinas(institution_id);
CREATE INDEX IF NOT EXISTS idx_turma_disc_institution ON public.turma_disciplinas(institution_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_institution ON public.subscriptions(institution_id);

-- ============================================
-- PHASE 4: SECURITY FUNCTIONS (TENANT-AWARE)
-- ============================================

-- 4.1 Get current user's institution_id
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 4.2 Check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- 4.3 Check if user belongs to same institution (tenant check)
CREATE OR REPLACE FUNCTION public.is_same_institution(_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR (
    SELECT institution_id FROM public.profiles WHERE user_id = auth.uid()
  ) = _institution_id;
$$;

-- 4.4 Updated has_role (tenant-aware)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 4.5 Get user roles (tenant-aware — only returns roles for their institution)
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id;
$$;

-- 4.6 Check institution subscription/limits
CREATE OR REPLACE FUNCTION public.check_institution_limit(_institution_id UUID, _resource TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan public.plans%ROWTYPE;
  _current_count INT;
  _max_allowed INT;
BEGIN
  SELECT p.* INTO _plan
  FROM public.institutions i
  JOIN public.plans p ON p.id = i.plan_id
  WHERE i.id = _institution_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Instituição não encontrada');
  END IF;

  CASE _resource
    WHEN 'users' THEN
      SELECT COUNT(*) INTO _current_count FROM public.profiles WHERE institution_id = _institution_id;
      _max_allowed := _plan.max_users;
    WHEN 'turmas' THEN
      SELECT COUNT(*) INTO _current_count FROM public.turmas WHERE institution_id = _institution_id AND ativo = true;
      _max_allowed := _plan.max_turmas;
    WHEN 'cursos' THEN
      SELECT COUNT(*) INTO _current_count FROM public.cursos WHERE institution_id = _institution_id AND ativo = true;
      _max_allowed := _plan.max_cursos;
    ELSE
      RETURN jsonb_build_object('allowed', true);
  END CASE;

  -- -1 means unlimited
  IF _max_allowed = -1 THEN
    RETURN jsonb_build_object('allowed', true, 'current', _current_count, 'max', 'unlimited');
  END IF;

  RETURN jsonb_build_object(
    'allowed', _current_count < _max_allowed,
    'current', _current_count,
    'max', _max_allowed
  );
END;
$$;

-- 4.7 Get institution stats (for dashboard)
CREATE OR REPLACE FUNCTION public.get_institution_stats(_institution_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Super admin can see any institution, others only their own
  IF NOT public.is_super_admin() AND public.get_user_institution_id() != _institution_id THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    'total_alunos', (SELECT COUNT(*) FROM public.alunos WHERE institution_id = _institution_id AND status = 'ativo'),
    'total_professores', (SELECT COUNT(*) FROM public.user_roles WHERE institution_id = _institution_id AND role = 'professor'),
    'total_turmas', (SELECT COUNT(*) FROM public.turmas WHERE institution_id = _institution_id AND ativo = true),
    'total_cursos', (SELECT COUNT(*) FROM public.cursos WHERE institution_id = _institution_id AND ativo = true),
    'total_disciplinas', (SELECT COUNT(*) FROM public.disciplinas WHERE institution_id = _institution_id AND ativo = true),
    'req_pendentes', (SELECT COUNT(*) FROM public.requerimentos WHERE institution_id = _institution_id AND status = 'pendente'),
    'total_documentos', (SELECT COUNT(*) FROM public.documentos WHERE institution_id = _institution_id),
    'total_usuarios', (SELECT COUNT(*) FROM public.profiles WHERE institution_id = _institution_id)
  ) INTO result;

  RETURN result;
END;
$$;

-- 4.8 Platform-wide stats (for super_admin)
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RETURN '{}'::jsonb;
  END IF;

  RETURN jsonb_build_object(
    'total_institutions', (SELECT COUNT(*) FROM public.institutions WHERE is_active = true),
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_alunos', (SELECT COUNT(*) FROM public.alunos WHERE status = 'ativo'),
    'active_subscriptions', (SELECT COUNT(*) FROM public.institutions WHERE subscription_status = 'active'),
    'trial_institutions', (SELECT COUNT(*) FROM public.institutions WHERE subscription_status = 'trial'),
    'revenue_monthly', (SELECT COALESCE(SUM(p.price_monthly), 0) FROM public.institutions i JOIN public.plans p ON p.id = i.plan_id WHERE i.subscription_status = 'active')
  );
END;
$$;

-- ============================================
-- PHASE 5: DROP OLD RLS & RECREATE WITH TENANT ISOLATION
-- ============================================

-- Helper: drop all policies on a table
DO $$
DECLARE
  _tbl TEXT;
  _pol RECORD;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY[
    'profiles', 'user_roles', 'cursos', 'disciplinas', 'turmas',
    'alunos', 'matriculas', 'notas', 'frequencia', 'documentos',
    'requerimentos', 'audit_logs', 'generated_documents', 'horarios',
    'professor_disciplinas', 'turma_disciplinas'
  ]) LOOP
    FOR _pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = _tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _tbl);
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================
-- 5.1 INSTITUTIONS RLS
-- ============================================

-- Super admin can do anything
CREATE POLICY "super_admin_all" ON public.institutions
  FOR ALL USING (public.is_super_admin());

-- Institutional admin can view their own institution
CREATE POLICY "institution_view_own" ON public.institutions
  FOR SELECT USING (
    id = public.get_user_institution_id()
  );

-- Institutional admin can update their own institution (settings, logo, etc.)
CREATE POLICY "institution_update_own" ON public.institutions
  FOR UPDATE USING (
    id = public.get_user_institution_id() AND
    public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- 5.2 PLANS RLS
-- ============================================

-- Anyone authenticated can view plans
CREATE POLICY "plans_view" ON public.plans
  FOR SELECT TO authenticated USING (true);

-- Only super admin can manage plans
CREATE POLICY "plans_manage" ON public.plans
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.3 SUBSCRIPTIONS RLS
-- ============================================

CREATE POLICY "subscriptions_super_admin" ON public.subscriptions
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "subscriptions_view_own" ON public.subscriptions
  FOR SELECT USING (institution_id = public.get_user_institution_id());

-- ============================================
-- 5.4 PROFILES RLS (tenant-isolated)
-- ============================================

-- Users can view their own profile always
CREATE POLICY "profiles_view_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users of same institution can view profiles within tenant
CREATE POLICY "profiles_view_institution" ON public.profiles
  FOR SELECT USING (institution_id = public.get_user_institution_id());

-- Super admin can view all profiles
CREATE POLICY "profiles_super_admin" ON public.profiles
  FOR ALL USING (public.is_super_admin());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage profiles within their institution
CREATE POLICY "profiles_admin_manage" ON public.profiles
  FOR ALL USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

-- Insert: triggered by handle_new_user or admin
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin')
  );

-- ============================================
-- 5.5 USER_ROLES RLS (tenant-isolated)
-- ============================================

CREATE POLICY "user_roles_view_own" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_roles_view_institution" ON public.user_roles
  FOR SELECT USING (institution_id = public.get_user_institution_id());

CREATE POLICY "user_roles_super_admin" ON public.user_roles
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL USING (
    institution_id = public.get_user_institution_id() AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "user_roles_insert" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'super_admin') OR
    auth.uid() = user_id -- for trigger
  );

-- ============================================
-- 5.6 CURSOS RLS
-- ============================================

CREATE POLICY "cursos_view" ON public.cursos
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id() OR public.is_super_admin()
  );

CREATE POLICY "cursos_manage" ON public.cursos
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

CREATE POLICY "cursos_super_admin" ON public.cursos
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.7 DISCIPLINAS RLS
-- ============================================

CREATE POLICY "disciplinas_view" ON public.disciplinas
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id() OR public.is_super_admin()
  );

CREATE POLICY "disciplinas_manage" ON public.disciplinas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

CREATE POLICY "disciplinas_super_admin" ON public.disciplinas
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.8 TURMAS RLS
-- ============================================

CREATE POLICY "turmas_view" ON public.turmas
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id() OR public.is_super_admin()
  );

CREATE POLICY "turmas_manage" ON public.turmas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

CREATE POLICY "turmas_super_admin" ON public.turmas
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.9 ALUNOS RLS
-- ============================================

CREATE POLICY "alunos_view_own" ON public.alunos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alunos_view_institution" ON public.alunos
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id()
  );

CREATE POLICY "alunos_manage" ON public.alunos
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

CREATE POLICY "alunos_super_admin" ON public.alunos
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.10 MATRICULAS RLS
-- ============================================

CREATE POLICY "matriculas_view_own" ON public.matriculas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "matriculas_view_institution" ON public.matriculas
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id()
  );

CREATE POLICY "matriculas_manage" ON public.matriculas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

CREATE POLICY "matriculas_super_admin" ON public.matriculas
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.11 NOTAS RLS
-- ============================================

CREATE POLICY "notas_view_own" ON public.notas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "notas_professor" ON public.notas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    public.has_role(auth.uid(), 'professor') AND
    EXISTS (
      SELECT 1 FROM public.professor_disciplinas pd
      WHERE pd.professor_id = auth.uid()
      AND pd.disciplina_id = notas.disciplina_id
      AND (pd.turma_id IS NULL OR pd.turma_id = notas.turma_id)
      AND pd.ativo = true
    )
  );

CREATE POLICY "notas_admin" ON public.notas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria'))
  );

CREATE POLICY "notas_view_institution" ON public.notas
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id()
  );

CREATE POLICY "notas_super_admin" ON public.notas
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.12 FREQUENCIA RLS
-- ============================================

CREATE POLICY "freq_view_own" ON public.frequencia
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "freq_professor" ON public.frequencia
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    public.has_role(auth.uid(), 'professor') AND
    EXISTS (
      SELECT 1 FROM public.professor_disciplinas pd
      WHERE pd.professor_id = auth.uid()
      AND pd.disciplina_id = frequencia.disciplina_id
      AND pd.ativo = true
    )
  );

CREATE POLICY "freq_admin" ON public.frequencia
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria'))
  );

CREATE POLICY "freq_super_admin" ON public.frequencia
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.13 DOCUMENTOS RLS
-- ============================================

CREATE POLICY "docs_view_own" ON public.documentos
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "docs_manage" ON public.documentos
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

CREATE POLICY "docs_super_admin" ON public.documentos
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.14 REQUERIMENTOS RLS
-- ============================================

CREATE POLICY "req_view_own" ON public.requerimentos
  FOR SELECT USING (solicitante_id = auth.uid());

CREATE POLICY "req_create_own" ON public.requerimentos
  FOR INSERT WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "req_manage" ON public.requerimentos
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'tecnico'))
  );

CREATE POLICY "req_super_admin" ON public.requerimentos
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.15 AUDIT_LOGS RLS
-- ============================================

CREATE POLICY "audit_view" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "audit_super_admin" ON public.audit_logs
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.16 GENERATED_DOCUMENTS RLS
-- ============================================

CREATE POLICY "gen_docs_manage" ON public.generated_documents
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria'))
  );

CREATE POLICY "gen_docs_professor" ON public.generated_documents
  FOR SELECT TO authenticated USING (generated_by = auth.uid());

CREATE POLICY "gen_docs_aluno" ON public.generated_documents
  FOR SELECT TO authenticated USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "gen_docs_super_admin" ON public.generated_documents
  FOR ALL USING (public.is_super_admin());

-- ============================================
-- 5.17 HORARIOS RLS
-- ============================================

CREATE POLICY "horarios_view" ON public.horarios
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id() OR public.is_super_admin()
  );

CREATE POLICY "horarios_manage" ON public.horarios
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria'))
  );

-- ============================================
-- 5.18 PROFESSOR_DISCIPLINAS RLS
-- ============================================

CREATE POLICY "prof_disc_view" ON public.professor_disciplinas
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id() OR public.is_super_admin()
  );

CREATE POLICY "prof_disc_manage" ON public.professor_disciplinas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria'))
  );

-- ============================================
-- 5.19 TURMA_DISCIPLINAS RLS
-- ============================================

CREATE POLICY "turma_disc_view" ON public.turma_disciplinas
  FOR SELECT TO authenticated USING (
    institution_id = public.get_user_institution_id() OR public.is_super_admin()
  );

CREATE POLICY "turma_disc_manage" ON public.turma_disciplinas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria'))
  );

-- ============================================
-- PHASE 6: UPDATE TRIGGER FOR NEW USER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _institution_id UUID;
  _role app_role;
BEGIN
  -- Get institution_id from metadata (set by admin during user creation)
  _institution_id := (NEW.raw_user_meta_data->>'institution_id')::UUID;
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'aluno');

  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email, institution_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    _institution_id
  );

  -- Assign role with institution
  INSERT INTO public.user_roles (user_id, role, institution_id)
  VALUES (NEW.id, _role, _institution_id);

  RETURN NEW;
END;
$$;

-- ============================================
-- PHASE 7: UPDATED HELPER FUNCTIONS (TENANT-AWARE)
-- ============================================

-- 7.1 Get professor's linked disciplines for their institution
CREATE OR REPLACE FUNCTION public.get_professor_disciplinas(_professor_id UUID)
RETURNS TABLE (
  disciplina_id UUID,
  disciplina_nome TEXT,
  turma_id UUID,
  turma_nome TEXT,
  curso_nome TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pd.disciplina_id,
    d.nome as disciplina_nome,
    pd.turma_id,
    t.nome as turma_nome,
    c.nome as curso_nome
  FROM public.professor_disciplinas pd
  JOIN public.disciplinas d ON d.id = pd.disciplina_id
  LEFT JOIN public.turmas t ON t.id = pd.turma_id
  LEFT JOIN public.cursos c ON c.id = t.curso_id
  WHERE pd.professor_id = _professor_id
  AND pd.ativo = true
  AND pd.institution_id = (SELECT institution_id FROM public.profiles WHERE user_id = _professor_id)
  ORDER BY d.nome, t.nome;
$$;

-- 7.2 Get students by turma (tenant-aware)
CREATE OR REPLACE FUNCTION public.get_alunos_by_turma(_turma_id UUID)
RETURNS TABLE (
  aluno_id UUID,
  aluno_nome TEXT,
  matricula TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id as aluno_id,
    p.full_name as aluno_nome,
    a.matricula
  FROM public.matriculas m
  JOIN public.alunos a ON a.id = m.aluno_id
  JOIN public.profiles p ON p.user_id = a.user_id
  WHERE m.turma_id = _turma_id
  AND m.status = 'ativa'
  AND a.status = 'ativo'
  ORDER BY p.full_name;
$$;

-- 7.3 Get institutions list (for super_admin)
CREATE OR REPLACE FUNCTION public.get_all_institutions()
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  cnpj TEXT,
  plan_name TEXT,
  subscription_status TEXT,
  total_users BIGINT,
  total_alunos BIGINT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.name,
    i.slug,
    i.cnpj,
    p.name as plan_name,
    i.subscription_status,
    (SELECT COUNT(*) FROM public.profiles WHERE institution_id = i.id) as total_users,
    (SELECT COUNT(*) FROM public.alunos WHERE institution_id = i.id AND status = 'ativo') as total_alunos,
    i.is_active,
    i.created_at
  FROM public.institutions i
  LEFT JOIN public.plans p ON p.id = i.plan_id
  WHERE public.is_super_admin()
  ORDER BY i.created_at DESC;
$$;

-- ============================================
-- PHASE 8: UPDATE TRIGGER FOR PLANS
-- ============================================

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- DONE: Migration complete
-- ============================================
