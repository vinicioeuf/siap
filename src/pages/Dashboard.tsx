import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
import { Users, GraduationCap, ClipboardList, FileText, TrendingUp, BookOpen, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ alunos: 0, turmas: 0, reqPendentes: 0, documentos: 0 });
  const [requerimentos, setRequerimentos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema acadêmico"
      />

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Alunos Ativos" value={stats.alunos} icon={Users} />
          <StatCard title="Turmas Ativas" value={stats.turmas} icon={GraduationCap} colorClass="text-accent" />
          <StatCard title="Req. Pendentes" value={stats.reqPendentes} icon={ClipboardList} colorClass="text-warning" />
          <StatCard title="Documentos" value={stats.documentos} icon={FileText} colorClass="text-info" />
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Requests */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                <ClipboardList className="h-4 w-4 text-warning" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Requerimentos Recentes</h2>
            </div>
            <button
              onClick={() => navigate("/requerimentos")}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {loading ? (
            <div className="p-4">
              <SkeletonList rows={3} />
            </div>
          ) : requerimentos.length === 0 ? (
            <EmptyState
              variant="inbox"
              title="Nenhum requerimento"
              description="Os requerimentos recentes aparecerão aqui"
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-border/50">
              {requerimentos.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{req.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.tipo}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Classes */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <BookOpen className="h-4 w-4 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Turmas Ativas</h2>
            </div>
            <button
              onClick={() => navigate("/turmas")}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {loading ? (
            <div className="p-4">
              <SkeletonList rows={3} />
            </div>
          ) : turmas.length === 0 ? (
            <EmptyState
              variant="folder"
              title="Nenhuma turma"
              description="As turmas ativas aparecerão aqui"
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-border/50">
              {turmas.map((turma) => (
                <div key={turma.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{turma.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{turma.codigo} · {turma.turno}</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground bg-muted/50 px-2.5 py-1 rounded-lg">{turma.max_alunos} vagas</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Novo Aluno", color: "bg-primary/10 text-primary", hoverColor: "hover:bg-primary/15", path: "/alunos" },
            { icon: GraduationCap, label: "Nova Turma", color: "bg-accent/10 text-accent", hoverColor: "hover:bg-accent/15", path: "/turmas" },
            { icon: TrendingUp, label: "Lançar Notas", color: "bg-success/10 text-success", hoverColor: "hover:bg-success/15", path: "/notas" },
            { icon: FileText, label: "Novo Documento", color: "bg-info/10 text-info", hoverColor: "hover:bg-info/15", path: "/documentos" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border border-border/50 bg-card shadow-sm ${action.hoverColor} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color} transition-transform duration-300 group-hover:scale-110`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
