
-- =============================================
-- SISTEMA DE GESTÃO ESCOLAR - SCHEMA COMPLETO
-- =============================================

-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'secretaria', 'professor', 'aluno', 'coordenador');

-- 2. Tabela de profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function for role checks
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
  )
$$;

-- Helper to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- 5. Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and secretaria can view all profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Auto-create profile on signup
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
  -- Default role: aluno
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'aluno');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TABELAS ACADÊMICAS
-- =============================================

-- 9. Cursos
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  duracao_semestres INT DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cursos" ON public.cursos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/secretaria can manage cursos" ON public.cursos
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE TRIGGER update_cursos_updated_at
  BEFORE UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Disciplinas
CREATE TABLE public.disciplinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  carga_horaria INT DEFAULT 60,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  professor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view disciplinas" ON public.disciplinas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/secretaria can manage disciplinas" ON public.disciplinas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE TRIGGER update_disciplinas_updated_at
  BEFORE UPDATE ON public.disciplinas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Turmas
CREATE TABLE public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo TEXT UNIQUE,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  turno TEXT CHECK (turno IN ('matutino', 'vespertino', 'noturno', 'integral')) DEFAULT 'matutino',
  ano INT DEFAULT EXTRACT(YEAR FROM now()),
  semestre INT DEFAULT 1 CHECK (semestre IN (1, 2)),
  max_alunos INT DEFAULT 40,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view turmas" ON public.turmas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/secretaria can manage turmas" ON public.turmas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE TRIGGER update_turmas_updated_at
  BEFORE UPDATE ON public.turmas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Alunos (dados adicionais do aluno, vinculado ao profile)
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  matricula TEXT UNIQUE NOT NULL,
  data_nascimento DATE,
  cpf TEXT UNIQUE,
  endereco TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'SP',
  cep TEXT,
  responsavel_nome TEXT,
  responsavel_telefone TEXT,
  status TEXT CHECK (status IN ('ativo', 'inativo', 'trancado', 'formado', 'transferido')) DEFAULT 'ativo',
  data_ingresso DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno can view own data" ON public.alunos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin/secretaria can view all alunos" ON public.alunos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria') OR public.has_role(auth.uid(), 'coordenador')
  );

CREATE POLICY "Admin/secretaria can manage alunos" ON public.alunos
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Matrículas (aluno em turma)
CREATE TABLE public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('ativa', 'cancelada', 'trancada', 'concluida')) DEFAULT 'ativa',
  data_matricula DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, turma_id)
);

ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno can view own matriculas" ON public.matriculas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin/secretaria can manage matriculas" ON public.matriculas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

-- 14. Notas
CREATE TABLE public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  nota1 NUMERIC(4,2),
  nota2 NUMERIC(4,2),
  nota3 NUMERIC(4,2),
  nota4 NUMERIC(4,2),
  media NUMERIC(4,2),
  status TEXT CHECK (status IN ('aprovado', 'reprovado', 'recuperacao', 'cursando')) DEFAULT 'cursando',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (aluno_id, disciplina_id, turma_id)
);

ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno can view own notas" ON public.notas
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "Professor can view/manage notas of their disciplinas" ON public.notas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'professor') AND
    disciplina_id IN (SELECT id FROM public.disciplinas WHERE professor_id = auth.uid())
  );

CREATE POLICY "Admin/secretaria can manage all notas" ON public.notas
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE TRIGGER update_notas_updated_at
  BEFORE UPDATE ON public.notas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-calculate media
CREATE OR REPLACE FUNCTION public.calculate_media()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  count_notas INT := 0;
  soma NUMERIC := 0;
BEGIN
  IF NEW.nota1 IS NOT NULL THEN count_notas := count_notas + 1; soma := soma + NEW.nota1; END IF;
  IF NEW.nota2 IS NOT NULL THEN count_notas := count_notas + 1; soma := soma + NEW.nota2; END IF;
  IF NEW.nota3 IS NOT NULL THEN count_notas := count_notas + 1; soma := soma + NEW.nota3; END IF;
  IF NEW.nota4 IS NOT NULL THEN count_notas := count_notas + 1; soma := soma + NEW.nota4; END IF;
  
  IF count_notas > 0 THEN
    NEW.media := ROUND(soma / count_notas, 2);
    IF NEW.media >= 7 THEN NEW.status := 'aprovado';
    ELSIF NEW.media >= 5 THEN NEW.status := 'recuperacao';
    ELSIF count_notas = 4 THEN NEW.status := 'reprovado';
    ELSE NEW.status := 'cursando';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER calculate_nota_media
  BEFORE INSERT OR UPDATE ON public.notas
  FOR EACH ROW EXECUTE FUNCTION public.calculate_media();

-- 15. Frequência
CREATE TABLE public.frequencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE NOT NULL,
  disciplina_id UUID REFERENCES public.disciplinas(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  presente BOOLEAN DEFAULT true,
  justificativa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.frequencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aluno can view own frequencia" ON public.frequencia
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE POLICY "Professor can manage frequencia" ON public.frequencia
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'professor') AND
    disciplina_id IN (SELECT id FROM public.disciplinas WHERE professor_id = auth.uid())
  );

CREATE POLICY "Admin/secretaria can manage all frequencia" ON public.frequencia
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

-- 16. Documentos (metadados - arquivos ficam no Storage)
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT CHECK (categoria IN ('historico', 'declaracao', 'ata', 'certificado', 'contrato', 'documento_pessoal', 'outro')) DEFAULT 'outro',
  arquivo_url TEXT,
  arquivo_nome TEXT,
  arquivo_tipo TEXT,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE SET NULL,
  turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/secretaria can manage all documentos" ON public.documentos
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE POLICY "Users can view own uploaded docs" ON public.documentos
  FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Aluno can view own documentos" ON public.documentos
  FOR SELECT USING (
    aluno_id IN (SELECT id FROM public.alunos WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Requerimentos
CREATE TABLE public.requerimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT CHECK (tipo IN ('declaracao', 'historico', 'certificado', 'trancamento', 'transferencia', 'revisao_nota', 'outro')) NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT CHECK (status IN ('pendente', 'em_analise', 'aprovado', 'recusado')) DEFAULT 'pendente',
  resposta TEXT,
  anexo_url TEXT,
  resposta_anexo_url TEXT,
  solicitante_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  respondido_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.requerimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requerimentos" ON public.requerimentos
  FOR SELECT USING (solicitante_id = auth.uid());

CREATE POLICY "Users can create own requerimentos" ON public.requerimentos
  FOR INSERT WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "Admin/secretaria can manage all requerimentos" ON public.requerimentos
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
  );

CREATE TRIGGER update_requerimentos_updated_at
  BEFORE UPDATE ON public.requerimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Storage bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false);

CREATE POLICY "Authenticated users can upload docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Users can view own docs" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'documentos');

CREATE POLICY "Admin/secretaria can manage all docs" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'documentos' AND (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'secretaria')
    )
  );

-- 19. Indexes for performance
CREATE INDEX idx_alunos_user_id ON public.alunos(user_id);
CREATE INDEX idx_alunos_status ON public.alunos(status);
CREATE INDEX idx_matriculas_aluno ON public.matriculas(aluno_id);
CREATE INDEX idx_matriculas_turma ON public.matriculas(turma_id);
CREATE INDEX idx_notas_aluno ON public.notas(aluno_id);
CREATE INDEX idx_notas_disciplina ON public.notas(disciplina_id);
CREATE INDEX idx_frequencia_aluno ON public.frequencia(aluno_id);
CREATE INDEX idx_documentos_aluno ON public.documentos(aluno_id);
CREATE INDEX idx_requerimentos_solicitante ON public.requerimentos(solicitante_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
