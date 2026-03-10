CREATE TABLE IF NOT EXISTS public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE SET NULL,
  professor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  numero_aula INT DEFAULT 1,
  conteudo TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aulas_view" ON public.aulas
  FOR SELECT TO authenticated
  USING (institution_id = public.get_user_institution_id() OR public.is_super_admin());

CREATE POLICY "aulas_manage" ON public.aulas
  FOR ALL TO authenticated USING (
    institution_id = public.get_user_institution_id() AND (
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'secretaria') OR
      professor_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_aulas_turma ON public.aulas(turma_id);
CREATE INDEX IF NOT EXISTS idx_aulas_data ON public.aulas(data);
