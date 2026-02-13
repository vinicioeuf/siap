import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
import {
  Building2, Users, CreditCard, TrendingUp, BarChart3,
  Activity, ArrowRight, CheckCircle2, XCircle, Globe,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Platform = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    institutions: 0,
    activeInstitutions: 0,
    totalUsers: 0,
    totalAlunos: 0,
    activeSubscriptions: 0,
    mrr: 0,
  });
  const [recentInstitutions, setRecentInstitutions] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    setLoading(true);

    const [instRes, profilesRes, alunosRes, subsRes, plansRes] = await Promise.all([
      supabase.from("institutions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("alunos").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("subscriptions").select("*, plans(name, price)").eq("status", "active"),
      supabase.from("plans").select("*").order("price"),
    ]);

    const institutions = instRes.data || [];
    const activeInst = institutions.filter((i: any) => i.is_active);
    const subs = subsRes.data || [];
    const mrr = subs.reduce((acc: number, s: any) => acc + (Number(s.plans?.price) || 0), 0);

    setStats({
      institutions: institutions.length,
      activeInstitutions: activeInst.length,
      totalUsers: profilesRes.count || 0,
      totalAlunos: alunosRes.count || 0,
      activeSubscriptions: subs.length,
      mrr,
    });

    setRecentInstitutions(institutions.slice(0, 5));

    // Plan distribution
    const planMap = new Map<string, { name: string; count: number }>();
    (plansRes.data || []).forEach((p: any) => planMap.set(p.id, { name: p.name, count: 0 }));
    planMap.set("free", { name: "Gratuito", count: 0 });

    institutions.forEach((inst: any) => {
      if (inst.plan_id && planMap.has(inst.plan_id)) {
        planMap.get(inst.plan_id)!.count++;
      } else {
        planMap.get("free")!.count++;
      }
    });

    setPlanDistribution(Array.from(planMap.values()).filter((p) => p.count > 0));
    setLoading(false);
  };

  return (
    <AppLayout>
      {/* Welcome Banner */}
      <div className="mb-8 animate-fade-in">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 lg:p-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 opacity-80" />
                <span className="text-xs font-semibold uppercase tracking-widest opacity-70">Painel da Plataforma</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
                Bem-vindo, {profile?.full_name?.split(" ")[0] || "Super Admin"}
              </h1>
              <p className="text-sm opacity-80 mt-1">
                Super Administrador · Visão geral de todas as instituições
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
                <Activity className="h-4 w-4 opacity-70" />
                <span className="text-xs font-medium">SaaS Multi-Tenant</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Instituições" value={stats.institutions} icon={Building2} />
            <StatCard title="Instituições Ativas" value={stats.activeInstitutions} icon={CheckCircle2} colorClass="text-success" />
            <StatCard title="Total Usuários" value={stats.totalUsers} icon={Users} colorClass="text-accent" />
            <StatCard title="Alunos Ativos" value={stats.totalAlunos} icon={TrendingUp} colorClass="text-info" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatCard
              title="MRR (Receita Mensal)"
              value={`R$ ${stats.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              icon={CreditCard}
              colorClass="text-success"
            />
            <StatCard title="Assinaturas Ativas" value={stats.activeSubscriptions} icon={BarChart3} colorClass="text-primary" />
          </div>
        </>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Institutions */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Instituições Recentes</h2>
            </div>
            <button
              onClick={() => navigate("/institutions")}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {loading ? (
            <div className="p-4"><SkeletonList rows={3} /></div>
          ) : recentInstitutions.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma instituição cadastrada</div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentInstitutions.map((inst: any) => (
                <div key={inst.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors cursor-pointer group" onClick={() => navigate("/institutions")}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{inst.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{inst.slug}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    inst.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {inst.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {inst.is_active ? "Ativa" : "Inativa"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <CreditCard className="h-4 w-4 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Distribuição de Planos</h2>
            </div>
          </div>
          {loading ? (
            <div className="p-4"><SkeletonList rows={3} /></div>
          ) : planDistribution.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <div className="p-6 space-y-4">
              {planDistribution.map((plan, i) => {
                const total = stats.institutions || 1;
                const pct = Math.round((plan.count / total) * 100);
                const colors = ["bg-primary", "bg-accent", "bg-success", "bg-warning", "bg-info"];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground">{plan.name}</span>
                      <span className="text-xs text-muted-foreground">{plan.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Building2, label: "Nova Instituição", color: "bg-primary/10 text-primary", hoverColor: "hover:bg-primary/15", path: "/institutions" },
            { icon: Users, label: "Usuários", color: "bg-accent/10 text-accent", hoverColor: "hover:bg-accent/15", path: "/usuarios" },
            { icon: BarChart3, label: "Dashboard", color: "bg-success/10 text-success", hoverColor: "hover:bg-success/15", path: "/dashboard" },
            { icon: CreditCard, label: "Assinaturas", color: "bg-info/10 text-info", hoverColor: "hover:bg-info/15", path: "/institutions" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center gap-3 p-5 rounded-xl border border-border/50 bg-card shadow-sm ${action.hoverColor} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color} transition-transform duration-300 group-hover:scale-110`}>
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

export default Platform;
