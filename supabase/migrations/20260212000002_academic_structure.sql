-- =============================================
-- MIGRAÇÃO: ESTRUTURA ACADÊMICA - VÍNCULOS E MELHORIAS
-- Professor ↔ Disciplina, Turma ↔ Disciplina, Notas melhoradas
-- =============================================

-- 1. Tabela professor_disciplinas (vínculo professor ↔ disciplina por turma)
CREATE TABLE IF NOT EXISTS public.professor_disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  ano INT DEFAULT EXTRACT(YEAR FROM now()),
  semestre INT DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professor_id, disciplina_id, turma_id)
);

ALTER TABLE public.professor_disciplinas ENABLE ROW LEVEL SECURITY;

-- Professors can view their own discipline links
CREATE POLICY "prof_disc_view_own" ON public.professor_disciplinas
  FOR SELECT USING (professor_id = auth.uid());

-- All authenticated users can view professor-discipline links (for listings)
CREATE POLICY "prof_disc_view_all" ON public.professor_disciplinas
  FOR SELECT TO authenticated USING (true);

-- Admin/secretaria can manage professor-discipline links
CREATE POLICY "prof_disc_manage" ON public.professor_disciplinas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE INDEX IF NOT EXISTS idx_prof_disc_professor ON public.professor_disciplinas(professor_id);
CREATE INDEX IF NOT EXISTS idx_prof_disc_disciplina ON public.professor_disciplinas(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_prof_disc_turma ON public.professor_disciplinas(turma_id);

-- 2. Tabela turma_disciplinas (vínculo turma ↔ disciplina)
CREATE TABLE IF NOT EXISTS public.turma_disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (turma_id, disciplina_id)
);

ALTER TABLE public.turma_disciplinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turma_disc_view_all" ON public.turma_disciplinas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "turma_disc_manage" ON public.turma_disciplinas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE INDEX IF NOT EXISTS idx_turma_disc_turma ON public.turma_disciplinas(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_disc_disciplina ON public.turma_disciplinas(disciplina_id);

-- 3. Add professor_id to notas for tracking who launched the grade
ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.notas ADD COLUMN IF NOT EXISTS semestre_letivo TEXT;

CREATE INDEX IF NOT EXISTS idx_notas_professor ON public.notas(professor_id);

-- 4. Improve notas RLS: professor only manages grades for their linked disciplines
-- First drop the old policy if it exists
DROP POLICY IF EXISTS "Professor can view/manage notas of their disciplinas" ON public.notas;

-- New policy: professor manages notes based on professor_disciplinas table
CREATE POLICY "Professor manages linked notas" ON public.notas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'professor') AND
    EXISTS (
      SELECT 1 FROM public.professor_disciplinas pd
      WHERE pd.professor_id = auth.uid()
      AND pd.disciplina_id = notas.disciplina_id
      AND (pd.turma_id IS NULL OR pd.turma_id = notas.turma_id)
      AND pd.ativo = true
    )
  );

-- 5. Add soft delete to alunos
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.alunos ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 6. Function to get professor's linked disciplines
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
  ORDER BY d.nome, t.nome;
$$;

-- 7. Function to get students by turma for grade launching
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

-- 8. Improve profiles RLS: professors can view student profiles
CREATE POLICY "Professors can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'professor')
  );

-- 9. Coordenador can view all profiles
CREATE POLICY "Coordenador can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'coordenador')
  );

-- 10. Professor can view alunos (needed for grade management)
CREATE POLICY "Professor can view alunos" ON public.alunos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'professor')
  );

-- 11. Professor can view matriculas (needed to see which students are in their classes)
CREATE POLICY "Professor can view matriculas" ON public.matriculas
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'professor')
  );
