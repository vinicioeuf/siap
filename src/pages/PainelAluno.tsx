import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
import { StatCard } from "@/components/StatCard";
import {
  BookOpen, ClipboardList, Calendar, Download, Clock,
  GraduationCap, FileText, TrendingUp, CheckCircle2, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  generateDeclaracaoMatricula,
  generateBoletim,
  type StudentInfo,
} from "@/lib/pdf-generator";
import { createAuditLog } from "@/lib/audit";
import { toast } from "@/hooks/use-toast";

interface GradeRow {
  disciplina: string;
  carga_horaria: number;
  nota1: number | null;
  nota2: number | null;
  nota3: number | null;
  nota4: number | null;
  media: number | null;
  status: string;
}

const diasSemana: Record<number, string> = {
  1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta", 6: "Sábado", 7: "Domingo",
};

const PainelAluno = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alunoData, setAlunoData] = useState<any>(null);
  const [grades, setGrades] = useState<GradeRow[]>([]);
  const [requerimentos, setRequerimentos] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [stats, setStats] = useState({
    disciplinas: 0,
    media_geral: 0,
    aprovadas: 0,
    pendentes_req: 0,
  });

  useEffect(() => {
    if (user) fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);

    // Get aluno record
    const { data: aluno } = await supabase
      .from("alunos")
      .select("*, matriculas(*, turmas(*, cursos(nome)))")
      .eq("user_id", user!.id)
      .single();

    setAlunoData(aluno);

    if (aluno) {
      // Get grades
      const { data: notasData } = await supabase
        .from("notas")
        .select("*, disciplinas(nome, carga_horaria)")
        .eq("aluno_id", aluno.id);

      const gradeRows: GradeRow[] = (notasData || []).map((n: any) => ({
        disciplina: n.disciplinas?.nome || "—",
        carga_horaria: n.disciplinas?.carga_horaria || 0,
        nota1: n.nota1,
        nota2: n.nota2,
        nota3: n.nota3,
        nota4: n.nota4,
        media: n.media,
        status: n.status,
      }));
      setGrades(gradeRows);

      // Stats
      const aprovadas = gradeRows.filter((g) => g.status === "aprovado").length;
      const medias = gradeRows.filter((g) => g.media != null).map((g) => g.media!);
      const mediaGeral = medias.length > 0 ? medias.reduce((a, b) => a + b, 0) / medias.length : 0;

      // Requerimentos
      const { data: reqs } = await supabase
        .from("requerimentos")
        .select("*")
        .eq("solicitante_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRequerimentos(reqs || []);

      const pendentes = (reqs || []).filter((r) => r.status === "pendente" || r.status === "em_analise").length;

      setStats({
        disciplinas: gradeRows.length,
        media_geral: Number(mediaGeral.toFixed(1)),
        aprovadas,
        pendentes_req: pendentes,
      });

      // Horários
      if (aluno.matriculas && aluno.matriculas.length > 0) {
        const turmaIds = aluno.matriculas.map((m: any) => m.turma_id);
        const { data: horariosData } = await supabase
          .from("horarios")
          .select("*, disciplinas(nome)")
          .in("turma_id", turmaIds)
          .order("dia_semana")
          .order("hora_inicio");
        setHorarios(horariosData || []);
      }
    }

    setLoading(false);
  };

  const getStudentInfo = (): StudentInfo => {
    const turma = alunoData?.matriculas?.[0]?.turmas;
    return {
      name: profile?.full_name || "—",
      matricula: alunoData?.matricula || "—",
      cpf: alunoData?.cpf || undefined,
      curso: turma?.cursos?.nome || "—",
      turma: turma?.nome || "—",
      semestre: turma ? `${turma.ano}/${turma.semestre}` : "—",
      status: alunoData?.status || "ativo",
      data_ingresso: alunoData?.data_ingresso
        ? new Date(alunoData.data_ingresso).toLocaleDateString("pt-BR")
        : "—",
    };
  };

  const handleDownloadDeclaracao = async () => {
    const info = getStudentInfo();
    const { doc, validationCode } = generateDeclaracaoMatricula(info, "Secretaria Acadêmica - SIAP");
    doc.save(`declaracao_matricula_${info.matricula}.pdf`);

    await supabase.from("generated_documents").insert({
      tipo: "declaracao_matricula",
      aluno_id: alunoData?.id,
      numero_validacao: validationCode,
      generated_by: user!.id,
      generated_by_name: profile?.full_name || "—",
    });

    await createAuditLog({
      action: "generate_document",
      entity_type: "generated_document",
      entity_name: "Declaração de Matrícula",
      details: { aluno: info.name, validation: validationCode },
    });

    toast({ title: "Declaração gerada com sucesso!" });
  };

  const handleDownloadBoletim = async () => {
    const info = getStudentInfo();
    const { doc, validationCode } = generateBoletim(info, grades, "Secretaria Acadêmica - SIAP");
    doc.save(`boletim_${info.matricula}.pdf`);

    await supabase.from("generated_documents").insert({
      tipo: "boletim",
      aluno_id: alunoData?.id,
      numero_validacao: validationCode,
      generated_by: user!.id,
      generated_by_name: profile?.full_name || "—",
    });

    await createAuditLog({
      action: "generate_document",
      entity_type: "generated_document",
      entity_name: "Boletim Escolar",
      details: { aluno: info.name, validation: validationCode },
    });

    toast({ title: "Boletim gerado com sucesso!" });
  };

  const getMediaColor = (val: number | null) => {
    if (val == null) return "";
    if (val >= 7) return "text-success";
    if (val >= 5) return "text-warning";
    return "text-destructive";
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="Meu Painel" description="Carregando seus dados acadêmicos..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </AppLayout>
    );
  }

  if (!alunoData) {
    return (
      <AppLayout>
        <PageHeader title="Meu Painel" description="Painel do Aluno" />
        <EmptyState
          variant="default"
          title="Registro não encontrado"
          description="Seu registro acadêmico ainda não foi criado. Contate a secretaria."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title={`Olá, ${profile?.full_name?.split(" ")[0] || "Aluno"}`}
        description="Acompanhe seu desempenho acadêmico"
        breadcrumbs={[{ label: "Painel do Aluno" }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Disciplinas" value={stats.disciplinas} icon={BookOpen} />
        <StatCard
          title="Média Geral"
          value={stats.media_geral}
          icon={TrendingUp}
          colorClass={getMediaColor(stats.media_geral)}
        />
        <StatCard title="Aprovadas" value={stats.aprovadas} icon={CheckCircle2} colorClass="text-success" />
        <StatCard title="Req. Pendentes" value={stats.pendentes_req} icon={ClipboardList} colorClass="text-warning" />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <button
          onClick={handleDownloadDeclaracao}
          className="flex items-center gap-4 p-5 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <Download className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Declaração de Matrícula</p>
            <p className="text-xs text-muted-foreground">Baixar PDF com validação digital</p>
          </div>
        </button>
        <button
          onClick={handleDownloadBoletim}
          className="flex items-center gap-4 p-5 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Boletim Escolar</p>
            <p className="text-xs text-muted-foreground">Baixar boletim completo em PDF</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Grades */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Histórico de Notas</h2>
          </div>
          {grades.length === 0 ? (
            <EmptyState variant="default" title="Sem notas" description="Nenhuma nota lançada ainda" className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Disciplina</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider">P1</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider">P2</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider">P3</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider">P4</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-3 uppercase tracking-wider">Média</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {grades.map((g, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-foreground">{g.disciplina}</td>
                      <td className={`px-3 py-3 text-sm text-center ${getMediaColor(g.nota1)}`}>
                        {g.nota1 != null ? g.nota1.toFixed(1) : "—"}
                      </td>
                      <td className={`px-3 py-3 text-sm text-center ${getMediaColor(g.nota2)}`}>
                        {g.nota2 != null ? g.nota2.toFixed(1) : "—"}
                      </td>
                      <td className={`px-3 py-3 text-sm text-center ${getMediaColor(g.nota3)}`}>
                        {g.nota3 != null ? g.nota3.toFixed(1) : "—"}
                      </td>
                      <td className={`px-3 py-3 text-sm text-center ${getMediaColor(g.nota4)}`}>
                        {g.nota4 != null ? g.nota4.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-sm font-bold ${getMediaColor(g.media)}`}>
                          {g.media != null ? g.media.toFixed(1) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={g.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Requerimentos */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <ClipboardList className="h-4 w-4 text-warning" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Meus Requerimentos</h2>
          </div>
          {requerimentos.length === 0 ? (
            <EmptyState variant="inbox" title="Nenhum requerimento" description="Seus requerimentos aparecerão aqui" className="py-10" />
          ) : (
            <div className="divide-y divide-border/50">
              {requerimentos.map((req) => (
                <div key={req.id} className="px-6 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">{req.titulo}</p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden mb-8">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
            <Calendar className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Horário Semanal</h2>
        </div>
        {horarios.length === 0 ? (
          <EmptyState variant="default" title="Sem horários" description="Os horários aparecerão quando cadastrados" className="py-10" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Dia</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Horário</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Disciplina</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-3 uppercase tracking-wider">Sala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {horarios.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-foreground">
                      {diasSemana[h.dia_semana] || `Dia ${h.dia_semana}`}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {h.hora_inicio?.slice(0, 5)} — {h.hora_fim?.slice(0, 5)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-foreground">{h.disciplinas?.nome || "—"}</td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">{h.sala || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student info card */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
            <GraduationCap className="h-4 w-4 text-info" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Dados Acadêmicos</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Matrícula", value: alunoData.matricula },
            { label: "Status", value: alunoData.status?.charAt(0).toUpperCase() + alunoData.status?.slice(1) },
            { label: "Data de Ingresso", value: alunoData.data_ingresso ? new Date(alunoData.data_ingresso).toLocaleDateString("pt-BR") : "—" },
            { label: "Curso", value: alunoData.matriculas?.[0]?.turmas?.cursos?.nome || "—" },
            { label: "Turma", value: alunoData.matriculas?.[0]?.turmas?.nome || "—" },
            { label: "Turno", value: alunoData.matriculas?.[0]?.turmas?.turno || "—" },
          ].map((item) => (
            <div key={item.label} className="p-3 bg-muted/30 rounded-xl">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default PainelAluno;
