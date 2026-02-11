import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, GraduationCap, ClipboardList, FileText, TrendingUp, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ alunos: 0, turmas: 0, reqPendentes: 0, documentos: 0 });
  const [requerimentos, setRequerimentos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [alunosRes, turmasRes, reqRes, docsRes] = await Promise.all([
        supabase.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        supabase.from("turmas").select("*").eq("ativo", true).limit(4),
        supabase.from("requerimentos").select("*").order("created_at", { ascending: false }).limit(4),
        supabase.from("documentos").select("id", { count: "exact", head: true }),
      ]);

      const reqPendentes = await supabase.from("requerimentos").select("id", { count: "exact", head: true }).eq("status", "pendente");

      setStats({
        alunos: alunosRes.count || 0,
        turmas: turmasRes.data?.length || 0,
        reqPendentes: reqPendentes.count || 0,
        documentos: docsRes.count || 0,
      });
      setRequerimentos(reqRes.data || []);
      setTurmas(turmasRes.data || []);
    };
    fetchData();
  }, []);

  return (
    <AppLayout>
      <PageHeader title="Dashboard" description="Visão geral do sistema acadêmico" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Alunos Ativos" value={stats.alunos} icon={Users} />
        <StatCard title="Turmas Ativas" value={stats.turmas} icon={GraduationCap} colorClass="text-accent" />
        <StatCard title="Requerimentos Pendentes" value={stats.reqPendentes} icon={ClipboardList} colorClass="text-warning" />
        <StatCard title="Documentos" value={stats.documentos} icon={FileText} colorClass="text-info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border/50 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="text-base font-semibold text-foreground">Requerimentos Recentes</h2>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border/50">
            {requerimentos.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">Nenhum requerimento ainda.</p>
            )}
            {requerimentos.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{req.titulo}</p>
                  <p className="text-xs text-muted-foreground">{req.tipo}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="text-base font-semibold text-foreground">Turmas Ativas</h2>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border/50">
            {turmas.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma turma cadastrada.</p>
            )}
            {turmas.map((turma) => (
              <div key={turma.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{turma.nome}</p>
                  <p className="text-xs text-muted-foreground">{turma.codigo} · {turma.turno}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{turma.max_alunos} vagas</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Novo Aluno", color: "bg-primary/10 text-primary", path: "/alunos" },
          { icon: GraduationCap, label: "Nova Turma", color: "bg-accent/10 text-accent", path: "/turmas" },
          { icon: TrendingUp, label: "Lançar Notas", color: "bg-success/10 text-success", path: "/notas" },
          { icon: FileText, label: "Novo Documento", color: "bg-info/10 text-info", path: "/documentos" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
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
