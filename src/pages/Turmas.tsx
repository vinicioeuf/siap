import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Clock, Sun, Moon, Sunset } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const turnoIcon: Record<string, typeof Sun> = { matutino: Sun, vespertino: Sunset, noturno: Moon };
const turnoLabel: Record<string, string> = { matutino: "Matutino", vespertino: "Vespertino", noturno: "Noturno", integral: "Integral" };

const Turmas = () => {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cursoDialogOpen, setCursoDialogOpen] = useState(false);
  const { hasRole } = useAuth();
  const canManage = hasRole("admin") || hasRole("secretaria");

  const [form, setForm] = useState({ nome: "", codigo: "", curso_id: "", turno: "matutino", max_alunos: "40" });
  const [cursoForm, setCursoForm] = useState({ nome: "", descricao: "", duracao_semestres: "1" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [turmasRes, cursosRes] = await Promise.all([
      supabase.from("turmas").select("*, cursos(nome)").eq("ativo", true).order("nome"),
      supabase.from("cursos").select("*").eq("ativo", true).order("nome"),
    ]);
    setTurmas(turmasRes.data || []);
    setCursos(cursosRes.data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateTurma = async () => {
    if (!form.nome) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("turmas").insert({
      nome: form.nome,
      codigo: form.codigo || null,
      curso_id: form.curso_id || null,
      turno: form.turno,
      max_alunos: parseInt(form.max_alunos) || 40,
    });
    if (error) {
      toast({ title: "Erro ao criar turma", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Turma criada!" });
      setForm({ nome: "", codigo: "", curso_id: "", turno: "matutino", max_alunos: "40" });
      setDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleCreateCurso = async () => {
    if (!cursoForm.nome) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cursos").insert({
      nome: cursoForm.nome,
      descricao: cursoForm.descricao || null,
      duracao_semestres: parseInt(cursoForm.duracao_semestres) || 1,
    });
    if (error) {
      toast({ title: "Erro ao criar curso", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Curso criado!" });
      setCursoForm({ nome: "", descricao: "", duracao_semestres: "1" });
      setCursoDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Turmas"
        description="Gestão de turmas e séries"
        actions={
          canManage ? (
            <div className="flex gap-2">
              <Dialog open={cursoDialogOpen} onOpenChange={setCursoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Curso
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Novo Curso</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
                      <Input value={cursoForm.nome} onChange={(e) => setCursoForm({ ...cursoForm, nome: e.target.value })} placeholder="Ensino Médio" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Descrição</label>
                      <Input value={cursoForm.descricao} onChange={(e) => setCursoForm({ ...cursoForm, descricao: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Duração (semestres)</label>
                      <Input type="number" value={cursoForm.duracao_semestres} onChange={(e) => setCursoForm({ ...cursoForm, duracao_semestres: e.target.value })} />
                    </div>
                    <Button onClick={handleCreateCurso} disabled={saving} className="w-full">{saving ? "Salvando..." : "Criar Curso"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Turma</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Nova Turma</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Nome *</label>
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="1º Ano A" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Código</label>
                      <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="1A-2024" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Curso</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={form.curso_id}
                        onChange={(e) => setForm({ ...form, curso_id: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Turno</label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={form.turno}
                          onChange={(e) => setForm({ ...form, turno: e.target.value })}
                        >
                          <option value="matutino">Matutino</option>
                          <option value="vespertino">Vespertino</option>
                          <option value="noturno">Noturno</option>
                          <option value="integral">Integral</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Máx. Alunos</label>
                        <Input type="number" value={form.max_alunos} onChange={(e) => setForm({ ...form, max_alunos: e.target.value })} />
                      </div>
                    </div>
                    <Button onClick={handleCreateTurma} disabled={saving} className="w-full">{saving ? "Salvando..." : "Criar Turma"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.length === 0 && (
          <p className="col-span-full text-center py-12 text-muted-foreground text-sm">Nenhuma turma cadastrada.</p>
        )}
        {turmas.map((turma) => {
          const TurnoIcon = turnoIcon[turma.turno] || Sun;
          return (
            <div key={turma.id} className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{turma.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{turma.cursos?.nome || "Sem curso"} · {turma.ano}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <TurnoIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /><span>Máx. {turma.max_alunos} alunos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /><span>{turnoLabel[turma.turno] || turma.turno}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{turma.codigo || "Sem código"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Turmas;
