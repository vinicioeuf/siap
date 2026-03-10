import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, Link2 } from "lucide-react";

const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30";

interface Props {
  turmaId: string;
  institutionId: string | null;
}

export function TurmaDisciplinasTab({ turmaId, institutionId }: Props) {
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!turmaId || !institutionId) {
      setDisciplinas([]);
      setLinks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [disciplinasRes, linksRes] = await Promise.all([
      supabase
        .from("disciplinas")
        .select("id, nome, codigo, ativo")
        .eq("institution_id", institutionId)
        .order("nome"),
      supabase
        .from("turma_disciplinas")
        .select("id, disciplina_id")
        .eq("institution_id", institutionId)
        .eq("turma_id", turmaId),
    ]);

    setDisciplinas((disciplinasRes.data || []).filter((d: any) => d.ativo !== false));
    setLinks(linksRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [turmaId, institutionId]);

  const linkedIds = useMemo(() => new Set((links || []).map((l: any) => l.disciplina_id)), [links]);

  const linkedDisciplinas = useMemo(
    () => disciplinas.filter((d: any) => linkedIds.has(d.id)),
    [disciplinas, linkedIds],
  );

  const availableDisciplinas = useMemo(
    () => disciplinas.filter((d: any) => !linkedIds.has(d.id)),
    [disciplinas, linkedIds],
  );

  const handleLink = async () => {
    if (!selectedDisciplinaId) {
      toast({ title: "Selecione uma disciplina", variant: "destructive" });
      return;
    }
    if (!institutionId) return;

    setSaving(true);
    const { error } = await supabase.from("turma_disciplinas").insert({
      turma_id: turmaId,
      disciplina_id: selectedDisciplinaId,
      institution_id: institutionId,
    });

    if (error) {
      toast({ title: "Erro ao vincular disciplina", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Disciplina vinculada com sucesso!" });
      setSelectedDisciplinaId("");
      fetchData();
    }
    setSaving(false);
  };

  const handleUnlink = async (disciplinaId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("turma_disciplinas")
      .delete()
      .eq("turma_id", turmaId)
      .eq("disciplina_id", disciplinaId);

    if (error) {
      toast({ title: "Erro ao remover vínculo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Vínculo removido com sucesso!" });
      fetchData();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 p-4 bg-card/50">
        <p className="text-xs text-muted-foreground mb-3">Vincular disciplina a esta turma</p>
        <div className="flex gap-2">
          <select
            className={selectClass}
            value={selectedDisciplinaId}
            onChange={(e) => setSelectedDisciplinaId(e.target.value)}
          >
            <option value="">Selecione...</option>
            {availableDisciplinas.map((disc) => (
              <option key={disc.id} value={disc.id}>{disc.nome}</option>
            ))}
          </select>
          <Button onClick={handleLink} disabled={saving || !selectedDisciplinaId} className="rounded-xl gap-2 shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Vincular
          </Button>
        </div>
      </div>

      {linkedDisciplinas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          Nenhuma disciplina vinculada nesta turma.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{linkedDisciplinas.length} disciplina(s) vinculada(s)</p>
          {linkedDisciplinas.map((disc) => (
            <div key={disc.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/50 bg-card hover:bg-muted/20 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{disc.nome}</p>
                <p className="text-xs text-muted-foreground">Código: {disc.codigo || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs gap-1">
                  <Link2 className="h-3 w-3" /> Vinculada
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleUnlink(disc.id)}
                  disabled={saving}
                  title="Remover vínculo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
