import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonList } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, MessageSquare, ClipboardList, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const tipoLabels: Record<string, string> = {
  declaracao: "Declaração", historico: "Histórico Escolar", certificado: "Certificado",
  trancamento: "Trancamento", transferencia: "Transferência", revisao_nota: "Revisão de Nota", outro: "Outro",
};

const tipoColors: Record<string, string> = {
  declaracao: "bg-primary/10 text-primary",
  historico: "bg-accent/10 text-accent",
  certificado: "bg-success/10 text-success",
  trancamento: "bg-destructive/10 text-destructive",
  transferencia: "bg-warning/10 text-warning",
  revisao_nota: "bg-info/10 text-info",
  outro: "bg-muted text-muted-foreground",
};

const Requerimentos = () => {
  const [search, setSearch] = useState("");
  const [requerimentos, setRequerimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, hasRole } = useAuth();
  const canRespond = hasRole("admin") || hasRole("secretaria");

  const [form, setForm] = useState({ tipo: "declaracao", titulo: "", descricao: "" });
  const [saving, setSaving] = useState(false);

  const fetchRequerimentos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("requerimentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const profileMap = new Map();
      profiles?.forEach((p) => profileMap.set(p.user_id, p));

      const enriched = data.map((r) => ({
        ...r,
        solicitante: profileMap.get(r.solicitante_id) || null,
      }));
      setRequerimentos(enriched);
    } else {
      setRequerimentos([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequerimentos(); }, []);

  const handleCreate = async () => {
    if (!form.titulo) { toast({ title: "Título é obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("requerimentos").insert({
      tipo: form.tipo,
      titulo: form.titulo,
      descricao: form.descricao || null,
      solicitante_id: user!.id,
    });
    if (error) {
      toast({ title: "Erro ao criar requerimento", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Requerimento criado!" });
      setForm({ tipo: "declaracao", titulo: "", descricao: "" });
      setDialogOpen(false);
      fetchRequerimentos();
    }
    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("requerimentos").update({
      status,
      respondido_por: user!.id,
      respondido_em: new Date().toISOString(),
    }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Requerimento ${status === "aprovado" ? "aprovado" : "recusado"}!` });
      fetchRequerimentos();
    }
  };

  const filtered = requerimentos.filter(
    (r) => r.titulo.toLowerCase().includes(search.toLowerCase()) || (r.tipo || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Requerimentos"
        description="Solicitações e requerimentos acadêmicos"
        breadcrumbs={[{ label: "Requerimentos" }]}
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shadow-sm"><Plus className="h-4 w-4" /> Novo Requerimento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader><DialogTitle className="text-lg">Novo Requerimento</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Tipo</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Título *</label>
                  <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Assunto do requerimento" className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Descreva sua solicitação..."
                  />
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl h-11">{saving ? "Enviando..." : "Enviar Requerimento"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar requerimentos..."
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          variant={search ? "search" : "inbox"}
          title={search ? "Nenhum requerimento encontrado" : "Nenhum requerimento"}
          description={search ? `Sem resultados para "${search}"` : "Os requerimentos criados aparecerão aqui"}
          action={
            !search ? (
              <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Novo Requerimento
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {filtered.map((req, index) => (
              <div
                key={req.id}
                className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 hover:shadow-lg transition-all duration-300 animate-fade-in group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${tipoColors[req.tipo] || tipoColors.outro}`}>
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-lg ${tipoColors[req.tipo] || tipoColors.outro}`}>
                          {tipoLabels[req.tipo] || req.tipo}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{req.titulo}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {req.solicitante?.full_name || "—"}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(req.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      {req.descricao && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{req.descricao}</p>
                      )}
                      {req.resposta && (
                        <div className="mt-3 p-3 bg-muted/40 rounded-xl text-xs text-foreground/70 flex items-start gap-2">
                          <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                          <div><span className="font-semibold">Resposta:</span> {req.resposta}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    {canRespond && req.status === "pendente" && (
                      <Button size="sm" variant="outline" className="text-xs h-8 rounded-xl" onClick={() => handleUpdateStatus(req.id, "em_analise")}>
                        Analisar
                      </Button>
                    )}
                    {canRespond && req.status === "em_analise" && (
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs h-8 rounded-xl bg-success hover:bg-success/90" onClick={() => handleUpdateStatus(req.id, "aprovado")}>
                          Aprovar
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs h-8 rounded-xl" onClick={() => handleUpdateStatus(req.id, "recusado")}>
                          Recusar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between px-2 text-xs text-muted-foreground">
            <span>{filtered.length} requerimento{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default Requerimentos;
