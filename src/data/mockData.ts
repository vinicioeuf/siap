export type UserRole = 'admin' | 'secretaria' | 'professor' | 'aluno' | 'coordenador';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  dataNascimento: string;
  turma: string;
  curso: string;
  status: 'ativo' | 'inativo' | 'trancado';
  matricula: string;
  telefone: string;
}

export interface Turma {
  id: string;
  nome: string;
  curso: string;
  turno: 'matutino' | 'vespertino' | 'noturno';
  ano: number;
  totalAlunos: number;
  professor: string;
}

export interface Disciplina {
  id: string;
  nome: string;
  cargaHoraria: number;
  professor: string;
  turma: string;
}

export interface Nota {
  id: string;
  alunoId: string;
  alunoNome: string;
  disciplina: string;
  nota1: number;
  nota2: number;
  nota3: number;
  nota4: number;
  media: number;
  situacao: 'aprovado' | 'reprovado' | 'cursando';
}

export interface Documento {
  id: string;
  titulo: string;
  tipo: 'historico' | 'declaracao' | 'ata' | 'certificado' | 'contrato' | 'pessoal';
  vinculo: string;
  dataUpload: string;
  formato: string;
  tamanho: string;
}

export interface Requerimento {
  id: string;
  alunoNome: string;
  tipo: string;
  descricao: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'recusado';
  dataCriacao: string;
  dataAtualizacao: string;
}

export const mockUser: User = {
  id: '1',
  nome: 'Carlos Silva',
  email: 'admin@escola.edu.br',
  role: 'admin',
};

export const mockAlunos: Aluno[] = [
  { id: '1', nome: 'Ana Beatriz Santos', email: 'ana@aluno.edu.br', cpf: '123.456.789-00', dataNascimento: '2005-03-15', turma: '3º Ano A', curso: 'Ensino Médio', status: 'ativo', matricula: '2024001', telefone: '(11) 99999-0001' },
  { id: '2', nome: 'Bruno Costa Lima', email: 'bruno@aluno.edu.br', cpf: '234.567.890-11', dataNascimento: '2004-07-22', turma: '2º Ano B', curso: 'Ensino Médio', status: 'ativo', matricula: '2024002', telefone: '(11) 99999-0002' },
  { id: '3', nome: 'Camila Ferreira', email: 'camila@aluno.edu.br', cpf: '345.678.901-22', dataNascimento: '2005-11-08', turma: '3º Ano A', curso: 'Ensino Médio', status: 'ativo', matricula: '2024003', telefone: '(11) 99999-0003' },
  { id: '4', nome: 'Daniel Oliveira', email: 'daniel@aluno.edu.br', cpf: '456.789.012-33', dataNascimento: '2006-01-30', turma: '1º Ano C', curso: 'Ensino Médio', status: 'trancado', matricula: '2024004', telefone: '(11) 99999-0004' },
  { id: '5', nome: 'Eduarda Mendes', email: 'eduarda@aluno.edu.br', cpf: '567.890.123-44', dataNascimento: '2005-09-12', turma: '3º Ano B', curso: 'Ensino Médio', status: 'ativo', matricula: '2024005', telefone: '(11) 99999-0005' },
  { id: '6', nome: 'Felipe Rodrigues', email: 'felipe@aluno.edu.br', cpf: '678.901.234-55', dataNascimento: '2004-05-18', turma: '2º Ano A', curso: 'Ensino Médio', status: 'inativo', matricula: '2024006', telefone: '(11) 99999-0006' },
  { id: '7', nome: 'Gabriela Souza', email: 'gabriela@aluno.edu.br', cpf: '789.012.345-66', dataNascimento: '2005-12-25', turma: '3º Ano A', curso: 'Ensino Médio', status: 'ativo', matricula: '2024007', telefone: '(11) 99999-0007' },
  { id: '8', nome: 'Henrique Almeida', email: 'henrique@aluno.edu.br', cpf: '890.123.456-77', dataNascimento: '2006-04-02', turma: '1º Ano A', curso: 'Ensino Médio', status: 'ativo', matricula: '2024008', telefone: '(11) 99999-0008' },
];

export const mockTurmas: Turma[] = [
  { id: '1', nome: '1º Ano A', curso: 'Ensino Médio', turno: 'matutino', ano: 2024, totalAlunos: 35, professor: 'Prof. Maria Silva' },
  { id: '2', nome: '1º Ano B', curso: 'Ensino Médio', turno: 'matutino', ano: 2024, totalAlunos: 32, professor: 'Prof. João Santos' },
  { id: '3', nome: '2º Ano A', curso: 'Ensino Médio', turno: 'vespertino', ano: 2024, totalAlunos: 28, professor: 'Prof. Ana Costa' },
  { id: '4', nome: '2º Ano B', curso: 'Ensino Médio', turno: 'vespertino', ano: 2024, totalAlunos: 30, professor: 'Prof. Pedro Lima' },
  { id: '5', nome: '3º Ano A', curso: 'Ensino Médio', turno: 'matutino', ano: 2024, totalAlunos: 27, professor: 'Prof. Carla Mendes' },
  { id: '6', nome: '3º Ano B', curso: 'Ensino Médio', turno: 'noturno', ano: 2024, totalAlunos: 25, professor: 'Prof. Roberto Alves' },
];

export const mockNotas: Nota[] = [
  { id: '1', alunoId: '1', alunoNome: 'Ana Beatriz Santos', disciplina: 'Matemática', nota1: 8.5, nota2: 7.0, nota3: 9.0, nota4: 8.0, media: 8.1, situacao: 'aprovado' },
  { id: '2', alunoId: '1', alunoNome: 'Ana Beatriz Santos', disciplina: 'Português', nota1: 9.0, nota2: 8.5, nota3: 7.5, nota4: 9.5, media: 8.6, situacao: 'aprovado' },
  { id: '3', alunoId: '2', alunoNome: 'Bruno Costa Lima', disciplina: 'Matemática', nota1: 5.0, nota2: 4.5, nota3: 6.0, nota4: 5.5, media: 5.3, situacao: 'reprovado' },
  { id: '4', alunoId: '2', alunoNome: 'Bruno Costa Lima', disciplina: 'Português', nota1: 7.0, nota2: 7.5, nota3: 8.0, nota4: 7.0, media: 7.4, situacao: 'aprovado' },
  { id: '5', alunoId: '3', alunoNome: 'Camila Ferreira', disciplina: 'Matemática', nota1: 9.5, nota2: 10.0, nota3: 9.0, nota4: 9.5, media: 9.5, situacao: 'aprovado' },
  { id: '6', alunoId: '5', alunoNome: 'Eduarda Mendes', disciplina: 'Física', nota1: 6.0, nota2: 7.0, nota3: 0, nota4: 0, media: 3.3, situacao: 'cursando' },
];

export const mockDocumentos: Documento[] = [
  { id: '1', titulo: 'Histórico Escolar - Ana Beatriz', tipo: 'historico', vinculo: 'Ana Beatriz Santos', dataUpload: '2024-03-15', formato: 'PDF', tamanho: '245 KB' },
  { id: '2', titulo: 'Declaração de Matrícula - Bruno', tipo: 'declaracao', vinculo: 'Bruno Costa Lima', dataUpload: '2024-03-10', formato: 'PDF', tamanho: '120 KB' },
  { id: '3', titulo: 'Ata de Conselho - 3º Ano A', tipo: 'ata', vinculo: '3º Ano A', dataUpload: '2024-02-28', formato: 'DOCX', tamanho: '380 KB' },
  { id: '4', titulo: 'Certificado de Conclusão - Camila', tipo: 'certificado', vinculo: 'Camila Ferreira', dataUpload: '2024-01-20', formato: 'PDF', tamanho: '190 KB' },
  { id: '5', titulo: 'Contrato de Matrícula 2024', tipo: 'contrato', vinculo: 'Todos os Cursos', dataUpload: '2024-01-05', formato: 'PDF', tamanho: '520 KB' },
  { id: '6', titulo: 'RG - Henrique Almeida', tipo: 'pessoal', vinculo: 'Henrique Almeida', dataUpload: '2024-03-01', formato: 'JPG', tamanho: '1.2 MB' },
];

export const mockRequerimentos: Requerimento[] = [
  { id: '1', alunoNome: 'Ana Beatriz Santos', tipo: 'Declaração de Matrícula', descricao: 'Necessito de uma declaração de matrícula para fins bancários.', status: 'aprovado', dataCriacao: '2024-03-10', dataAtualizacao: '2024-03-12' },
  { id: '2', alunoNome: 'Bruno Costa Lima', tipo: 'Revisão de Nota', descricao: 'Solicito revisão da nota da P2 de Matemática.', status: 'em_analise', dataCriacao: '2024-03-14', dataAtualizacao: '2024-03-15' },
  { id: '3', alunoNome: 'Daniel Oliveira', tipo: 'Trancamento de Matrícula', descricao: 'Solicito trancamento de matrícula por motivos pessoais.', status: 'pendente', dataCriacao: '2024-03-16', dataAtualizacao: '2024-03-16' },
  { id: '4', alunoNome: 'Eduarda Mendes', tipo: 'Histórico Escolar', descricao: 'Preciso do histórico escolar atualizado para transferência.', status: 'pendente', dataCriacao: '2024-03-17', dataAtualizacao: '2024-03-17' },
  { id: '5', alunoNome: 'Felipe Rodrigues', tipo: 'Transferência', descricao: 'Solicito transferência para outra unidade.', status: 'recusado', dataCriacao: '2024-03-05', dataAtualizacao: '2024-03-08' },
];

export const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  secretaria: 'Secretaria Acadêmica',
  professor: 'Professor',
  aluno: 'Aluno',
  coordenador: 'Coordenador',
};

export const statusColors: Record<string, string> = {
  ativo: 'bg-success/10 text-success',
  inativo: 'bg-muted text-muted-foreground',
  trancado: 'bg-warning/10 text-warning',
  aprovado: 'bg-success/10 text-success',
  reprovado: 'bg-destructive/10 text-destructive',
  cursando: 'bg-info/10 text-info',
  pendente: 'bg-warning/10 text-warning',
  em_analise: 'bg-info/10 text-info',
  recusado: 'bg-destructive/10 text-destructive',
};

export const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  trancado: 'Trancado',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  cursando: 'Cursando',
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  recusado: 'Recusado',
};
