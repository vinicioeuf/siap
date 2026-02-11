import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const tipoLabels: Record<string, string> = {
  declaracao: "Declaração", historico: "Histórico Escolar", certificado: "Certificado",
  trancamento: "Trancamento", transferencia: "Transferência", revisao_nota: "Revisão de Nota", outro: "Outro",
};

const Requerimentos = () => {
  const [search, setSearch] = useState("");
  const [requerimentos, setRequerimentos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, hasRole } = useAuth();
  const canRespond = hasRole("admin") || hasRole("secretaria");

  const [form, setForm] = useState({ tipo: "declaracao", titulo: "", descricao: "" });
  const [saving, setSaving] = useState(false);

  const fetchRequerimentos = async () => {
    const { data } = await supabase
      .from("requerimentos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r) => r.solicitante_id))];
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
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Requerimento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Novo Requerimento</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Tipo</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    {Object.entries(tipoLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Título *</label>
                  <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Assunto do requerimento" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Descreva sua solicitação..."
                  />
                </div>
                <Button onClick={handleCreate} disabled={saving} className="w-full">{saving ? "Enviando..." : "Enviar Requerimento"}</Button>
              </div>
            </DialogContent>
          </Dialog>
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
          <div key={req.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md transition-all duration-200 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{tipoLabels[req.tipo] || req.tipo}</h3>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-2">{req.solicitante?.full_name || "—"}</p>
                <p className="text-sm text-foreground/80">{req.descricao}</p>
                {req.resposta && (
                  <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-foreground/70">
                    <strong>Resposta:</strong> {req.resposta}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {canRespond && req.status === "pendente" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleUpdateStatus(req.id, "em_analise")}>
                      Analisar
                    </Button>
                  </div>
                )}
                {canRespond && req.status === "em_analise" && (
                  <div className="flex gap-1">
                    <Button size="sm" className="text-xs h-7 bg-success hover:bg-success/90" onClick={() => handleUpdateStatus(req.id, "aprovado")}>
                      Aprovar
                    </Button>
                    <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => handleUpdateStatus(req.id, "recusado")}>
                      Recusar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Requerimentos;
