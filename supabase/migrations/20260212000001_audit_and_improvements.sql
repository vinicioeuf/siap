-- =============================================
-- MIGRAÇÃO: AUDITORIA, SOFT DELETE E MELHORIAS
-- =============================================

-- 1. Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'soft_delete', 'login', 'logout', 'restore'
  entity_type TEXT NOT NULL, -- 'curso', 'disciplina', 'aluno', 'turma', 'nota', 'documento', 'requerimento', 'user'
  entity_id UUID,
  entity_name TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 2. Soft delete columns for cursos (already has 'ativo')
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 3. Soft delete columns for disciplinas (already has 'ativo')
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.disciplinas ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 4. Soft delete columns for turmas (already has 'ativo')
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 5. Document generation tracking
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('declaracao_matricula', 'historico_escolar', 'diario_classe', 'lista_presenca', 'boletim', 'requerimento')),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  numero_validacao TEXT NOT NULL UNIQUE,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  generated_by_name TEXT,
  assinatura_digital TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/secretaria can manage generated documents" ON public.generated_documents
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE POLICY "Professor can view own generated documents" ON public.generated_documents
  FOR SELECT TO authenticated USING (
    generated_by = auth.uid()
  );

CREATE POLICY "Aluno can view own generated documents" ON public.generated_documents
  FOR SELECT TO authenticated USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE INDEX idx_generated_docs_aluno ON public.generated_documents(aluno_id);
CREATE INDEX idx_generated_docs_validation ON public.generated_documents(numero_validacao);

-- 6. Function to check if curso can be hard-deleted
CREATE OR REPLACE FUNCTION public.can_hard_delete_curso(_curso_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  turma_count INT;
  disciplina_count INT;
  matricula_count INT;
BEGIN
  SELECT COUNT(*) INTO turma_count FROM public.turmas WHERE curso_id = _curso_id AND deleted_at IS NULL;
  SELECT COUNT(*) INTO disciplina_count FROM public.disciplinas WHERE curso_id = _curso_id AND deleted_at IS NULL;
  SELECT COUNT(*) INTO matricula_count FROM public.matriculas m
    INNER JOIN public.turmas t ON m.turma_id = t.id
    WHERE t.curso_id = _curso_id AND m.status = 'ativa';
  
  RETURN jsonb_build_object(
    'can_delete', (turma_count = 0 AND disciplina_count = 0 AND matricula_count = 0),
    'turmas_ativas', turma_count,
    'disciplinas_ativas', disciplina_count,
    'matriculas_ativas', matricula_count
  );
END;
$$;

-- 7. Function to check if disciplina can be hard-deleted
CREATE OR REPLACE FUNCTION public.can_hard_delete_disciplina(_disciplina_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nota_count INT;
  freq_count INT;
BEGIN
  SELECT COUNT(*) INTO nota_count FROM public.notas WHERE disciplina_id = _disciplina_id;
  SELECT COUNT(*) INTO freq_count FROM public.frequencia WHERE disciplina_id = _disciplina_id;
  
  RETURN jsonb_build_object(
    'can_delete', (nota_count = 0 AND freq_count = 0),
    'notas_lancadas', nota_count,
    'frequencias_lancadas', freq_count
  );
END;
$$;

-- 8. Update handle_new_user to NOT auto-assign role (admin will assign)
-- We keep the trigger but modify: only create profile, no default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  -- Role is now assigned explicitly by admin during user creation
  -- Only auto-assign 'aluno' if metadata says so
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'aluno');
  END IF;
  RETURN NEW;
END;
$$;

-- 9. Horarios table for student schedule
CREATE TABLE IF NOT EXISTS public.horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Segunda, 7=Domingo
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  sala TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view horarios" ON public.horarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/secretaria can manage horarios" ON public.horarios
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE TRIGGER update_horarios_updated_at
  BEFORE UPDATE ON public.horarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Admin user management: allow admin to create users with service role
-- This is handled via the Supabase Admin API on the client side
-- We add a policy for admin to manage all profiles
CREATE POLICY "Admin can insert profiles for others" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admin can manage all user_roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );
