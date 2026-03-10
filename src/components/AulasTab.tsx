import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Plus, Loader2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30";

interface Props {
  turmaId: string;
  institutionId: string | null;
}

export function AulasTab({ turmaId, institutionId }: Props) {
  const [aulas, setAulas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split("T")[0],
    numero_aula: "1",
    disciplina_id: "",
    conteudo: "",
    observacoes: "",
  });

  const fetchAulas = async () => {
    if (!turmaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("aulas")
      .select("*, disciplinas(nome)")
      .eq("turma_id", turmaId)
      .order("data", { ascending: false });
    setAulas(data || []);
    setLoading(false);
  };

  const fetchDisciplinas = async () => {
    if (!institutionId) return;
    const { data } = await supabase
      .from("disciplinas")
      .select("id, nome")
      .eq("institution_id", institutionId)
      .eq("ativo", true)
      .order("nome");
    setDisciplinas(data || []);
  };

  useEffect(() => {
    fetchAulas();
    fetchDisciplinas();
  }, [turmaId]);

  const handleSave = async () => {
    if (!form.data) { toast({ title: "Data é obrigatória", variant: "destructive" }); return; }
    if (!institutionId) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("aulas").insert({
      turma_id: turmaId,
      disciplina_id: form.disciplina_id || null,
      professor_id: user?.id || null,
      institution_id: institutionId,
      data: form.data,
      numero_aula: parseInt(form.numero_aula) || 1,
      conteudo: form.conteudo || null,
      observacoes: form.observacoes || null,
    });
    if (error) {
      toast({ title: "Erro ao registrar aula", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Aula registrada com sucesso!" });
      setForm({ data: new Date().toISOString().split("T")[0], numero_aula: "1", disciplina_id: "", conteudo: "", observacoes: "" });
      setDialogOpen(false);
      fetchAulas();
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-muted-foreground">{aulas.length} aula(s) registrada(s)</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 rounded-xl">
              <Plus className="h-3.5 w-3.5" /> Registrar Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-xl">
            <DialogHeader><DialogTitle>Registrar Aula</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Data *</label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nº da Aula</label>
                  <Input type="number" value={form.numero_aula} onChange={(e) => setForm({ ...form, numero_aula: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Disciplina</label>
                <select className={selectClass} value={form.disciplina_id} onChange={(e) => setForm({ ...form, disciplina_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Conteúdo ministrado</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 resize-none"
                  value={form.conteudo}
                  onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  placeholder="Descreva o conteúdo da aula..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Observações</label>
                <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="rounded-xl" placeholder="Opcional" />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Registrar Aula"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : aulas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhuma aula registrada ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {aulas.map((aula) => (
            <div key={aula.id} className="px-4 py-3 rounded-xl border border-border/50 bg-card hover:bg-muted/20 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {new Date(aula.data + "T12:00:00").toLocaleDateString("pt-BR")} · Aula {aula.numero_aula}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{aula.disciplinas?.nome || "Sem disciplina"}</span>
              </div>
              {aula.conteudo && <p className="text-xs text-muted-foreground mt-1 ml-5">{aula.conteudo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
