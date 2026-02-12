import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonList } from "@/components/Skeleton";
import {
  ShieldCheck, User, Calendar, Plus, Trash2, Edit, Eye,
  FileText, UserPlus, LogIn, LogOut, RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const actionLabels: Record<string, string> = {
  create: "Criação",
  update: "Edição",
  delete: "Exclusão",
  soft_delete: "Desativação",
  restore: "Restauração",
  login: "Login",
  logout: "Logout",
  generate_document: "Geração de Documento",
};

const actionIcons: Record<string, typeof Plus> = {
  create: UserPlus,
  update: Edit,
  delete: Trash2,
  soft_delete: Eye,
  restore: RotateCcw,
  login: LogIn,
  logout: LogOut,
  generate_document: FileText,
};

const actionColors: Record<string, string> = {
  create: "bg-success/10 text-success",
  update: "bg-info/10 text-info",
  delete: "bg-destructive/10 text-destructive",
  soft_delete: "bg-warning/10 text-warning",
  restore: "bg-accent/10 text-accent",
  login: "bg-primary/10 text-primary",
  logout: "bg-muted text-muted-foreground",
  generate_document: "bg-info/10 text-info",
};

const entityLabels: Record<string, string> = {
  curso: "Curso",
  disciplina: "Disciplina",
  aluno: "Aluno",
  turma: "Turma",
  nota: "Nota",
  documento: "Documento",
  requerimento: "Requerimento",
  user: "Usuário",
  generated_document: "Documento Gerado",
};

const Auditoria = () => {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterAction) query = query.eq("action", filterAction);
    if (filterEntity) query = query.eq("entity_type", filterEntity);

    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      (log.user_name || "").toLowerCase().includes(q) ||
      (log.entity_name || "").toLowerCase().includes(q) ||
      (log.action || "").toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <PageHeader
        title="Auditoria"
        description="Registro de ações críticas do sistema"
        breadcrumbs={[{ label: "Auditoria" }]}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput
          placeholder="Buscar por usuário ou entidade..."
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
        <select
          className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          <option value="">Todas as ações</option>
          {Object.entries(actionLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
        >
          <option value="">Todas as entidades</option>
          {Object.entries(entityLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <SkeletonList count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          variant={search ? "search" : "default"}
          title={search ? "Nenhum registro encontrado" : "Sem registros de auditoria"}
          description={search ? `Sem resultados para "${search}"` : "Os registros de auditoria aparecerão aqui"}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((log, index) => {
            const Icon = actionIcons[log.action] || ShieldCheck;
            const colorClass = actionColors[log.action] || "bg-muted text-muted-foreground";

            return (
              <div
                key={log.id}
                className="bg-card rounded-xl border border-border/50 shadow-sm px-6 py-4 hover:shadow-md transition-all duration-200 animate-fade-in group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg ${colorClass}`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-lg">
                        {entityLabels[log.entity_type] || log.entity_type}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{log.user_name || "Sistema"}</span>
                      {" realizou "}
                      <span className="font-medium">{actionLabels[log.action]?.toLowerCase() || log.action}</span>
                      {log.entity_name && (
                        <> de <span className="font-semibold">"{log.entity_name}"</span></>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" />{log.user_name || "—"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 p-2 bg-muted/30 rounded-lg">
                        <pre className="text-[11px] text-muted-foreground overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "registro" : "registros"} de auditoria
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Auditoria;
