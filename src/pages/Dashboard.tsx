import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, GraduationCap, ClipboardList, FileText, TrendingUp, BookOpen } from "lucide-react";
import { mockAlunos, mockRequerimentos, mockDocumentos, mockTurmas } from "@/data/mockData";

const Dashboard = () => {
  const alunosAtivos = mockAlunos.filter(a => a.status === 'ativo').length;
  const reqPendentes = mockRequerimentos.filter(r => r.status === 'pendente').length;

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema acadêmico"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Alunos Ativos" value={alunosAtivos} icon={Users} trend={{ value: 12, positive: true }} />
        <StatCard title="Turmas" value={mockTurmas.length} icon={GraduationCap} colorClass="text-accent" />
        <StatCard title="Requerimentos Pendentes" value={reqPendentes} icon={ClipboardList} colorClass="text-warning" />
        <StatCard title="Documentos" value={mockDocumentos.length} icon={FileText} colorClass="text-info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requerimentos */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="text-base font-semibold text-foreground">Requerimentos Recentes</h2>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border/50">
            {mockRequerimentos.slice(0, 4).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{req.alunoNome}</p>
                  <p className="text-xs text-muted-foreground">{req.tipo}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Turmas Overview */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="text-base font-semibold text-foreground">Turmas Ativas</h2>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border/50">
            {mockTurmas.slice(0, 4).map((turma) => (
              <div key={turma.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{turma.nome}</p>
                  <p className="text-xs text-muted-foreground">{turma.professor} · {turma.turno}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{turma.totalAlunos} alunos</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Novo Aluno", color: "bg-primary/10 text-primary" },
          { icon: GraduationCap, label: "Nova Turma", color: "bg-accent/10 text-accent" },
          { icon: TrendingUp, label: "Lançar Notas", color: "bg-success/10 text-success" },
          { icon: FileText, label: "Novo Documento", color: "bg-info/10 text-info" },
        ].map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{action.label}</span>
          </button>
        ))}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
