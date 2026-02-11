import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const tipoLabels: Record<string, string> = {
  declaracao: "Declaração",
  historico: "Histórico Escolar",
  certificado: "Certificado",
  trancamento: "Trancamento",
  transferencia: "Transferência",
  revisao_nota: "Revisão de Nota",
  outro: "Outro",
};

const Requerimentos = () => {
  const [search, setSearch] = useState("");
  const [requerimentos, setRequerimentos] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    supabase
      .from("requerimentos")
      .select("*, profiles:profiles!requerimentos_solicitante_id_fkey(full_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRequerimentos(data || []));
  }, []);

  const filtered = requerimentos.filter(
    (r) =>
      r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (r.tipo || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Requerimentos"
        description="Solicitações e requerimentos acadêmicos"
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Novo Requerimento
          </Button>
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar requerimentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum requerimento encontrado.</div>
        )}
        {filtered.map((req) => (
          <div
            key={req.id}
            className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{tipoLabels[req.tipo] || req.tipo}</h3>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-2">{req.profiles?.full_name || "—"}</p>
                <p className="text-sm text-foreground/80">{req.descricao}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Criado: {new Date(req.created_at).toLocaleDateString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Atualizado: {new Date(req.updated_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Requerimentos;
