import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cursoDialogOpen, setCursoDialogOpen] = useState(false);
  const { hasRole } = useAuth();
  const canManage = hasRole("admin") || hasRole("secretaria");

  const [form, setForm] = useState({ nome: "", codigo: "", curso_id: "", turno: "matutino", max_alunos: "40" });
  const [cursoForm, setCursoForm] = useState({ nome: "", descricao: "", duracao_semestres: "1" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [turmasRes, cursosRes] = await Promise.all([
      supabase.from("turmas").select("*, cursos(nome)").eq("ativo", true).order("nome"),
      supabase.from("cursos").select("*").eq("ativo", true).order("nome"),
    ]);
    setTurmas(turmasRes.data || []);
    setCursos(cursosRes.data || []);
    setLoading(false);
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
        breadcrumbs={[{ label: "Turmas" }]}
        actions={
          canManage ? (
            <div className="flex gap-2">
              <Dialog open={cursoDialogOpen} onOpenChange={setCursoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 rounded-xl">
                    <Plus className="h-4 w-4" /> Novo Curso
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader><DialogTitle className="text-lg">Novo Curso</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                      <Input value={cursoForm.nome} onChange={(e) => setCursoForm({ ...cursoForm, nome: e.target.value })} placeholder="Ensino Médio" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
                      <Input value={cursoForm.descricao} onChange={(e) => setCursoForm({ ...cursoForm, descricao: e.target.value })} className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Duração (semestres)</label>
                      <Input type="number" value={cursoForm.duracao_semestres} onChange={(e) => setCursoForm({ ...cursoForm, duracao_semestres: e.target.value })} className="rounded-xl" />
                    </div>
                    <Button onClick={handleCreateCurso} disabled={saving} className="w-full rounded-xl h-11">{saving ? "Salvando..." : "Criar Curso"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 rounded-xl shadow-sm"><Plus className="h-4 w-4" /> Nova Turma</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader><DialogTitle className="text-lg">Nova Turma</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                      <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="1º Ano A" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Código</label>
                      <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="1A-2024" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Curso</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                        value={form.curso_id}
                        onChange={(e) => setForm({ ...form, curso_id: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Turno</label>
                        <select
                          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
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
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Máx. Alunos</label>
                        <Input type="number" value={form.max_alunos} onChange={(e) => setForm({ ...form, max_alunos: e.target.value })} className="rounded-xl" />
                      </div>
                    </div>
                    <Button onClick={handleCreateTurma} disabled={saving} className="w-full rounded-xl h-11">{saving ? "Salvando..." : "Criar Turma"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : turmas.length === 0 ? (
        <EmptyState
          variant="folder"
          title="Nenhuma turma cadastrada"
          description="Comece criando uma nova turma no sistema"
          action={
            canManage ? (
              <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" /> Criar Turma
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {turmas.map((turma, index) => {
            const TurnoIcon = turnoIcon[turma.turno] || Sun;
            return (
              <div
                key={turma.id}
                className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">{turma.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{turma.cursos?.nome || "Sem curso"} · {turma.ano}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                    <TurnoIcon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5 shrink-0" /><span>Máx. {turma.max_alunos} alunos</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 shrink-0" /><span>{turnoLabel[turma.turno] || turma.turno}</span>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border/50">
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">{turma.codigo || "Sem código"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Turmas;
