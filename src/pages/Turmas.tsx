import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, Clock, Sun, Moon, Sunset, Trash2, MoreVertical, Archive, AlertTriangle, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, type AppRole } from "@/lib/permissions";

const turnoIcon: Record<string, typeof Sun> = { matutino: Sun, vespertino: Sunset, noturno: Moon };
const turnoLabel: Record<string, string> = { matutino: "Matutino", vespertino: "Vespertino", noturno: "Noturno", integral: "Integral" };

const Turmas = () => {
  const [turmas, setTurmas] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cursoDialogOpen, setCursoDialogOpen] = useState(false);
  const { hasRole, roles, institutionId } = useAuth();
  const canManage = hasRole("admin") || hasRole("secretaria");
  const canDelete = hasPermission(roles as AppRole[], "cursos.delete");

  const [form, setForm] = useState({ nome: "", codigo: "", curso_id: "", turno: "matutino", max_alunos: "40" });
  const [cursoForm, setCursoForm] = useState({ nome: "", descricao: "", duracao_semestres: "1" });
  const [saving, setSaving] = useState(false);

  // Edit turma state
  const [editTurmaDialogOpen, setEditTurmaDialogOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<any>(null);
  const [editTurmaForm, setEditTurmaForm] = useState({ nome: "", codigo: "", curso_id: "", turno: "matutino", max_alunos: "40", ano: "" });

  // Edit curso state
  const [editCursoDialogOpen, setEditCursoDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<any>(null);
  const [editCursoForm, setEditCursoForm] = useState({ nome: "", descricao: "", duracao_semestres: "1" });

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<{ type: "curso" | "turma"; item: any } | null>(null);
  const [deleteType, setDeleteType] = useState<"soft" | "hard">("soft");
  const [deleteInfo, setDeleteInfo] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      institution_id: institutionId,
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
    const { data, error } = await supabase.from("cursos").insert({
      nome: cursoForm.nome,
      descricao: cursoForm.descricao || null,
      duracao_semestres: parseInt(cursoForm.duracao_semestres) || 1,
      institution_id: institutionId,
    }).select().single();
    if (error) {
      toast({ title: "Erro ao criar curso", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({
        action: "create",
        entity_type: "curso",
        entity_id: data?.id,
        entity_name: cursoForm.nome,
      });
      toast({ title: "Curso criado!" });
      setCursoForm({ nome: "", descricao: "", duracao_semestres: "1" });
      setCursoDialogOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const openDeleteDialog = async (type: "curso" | "turma", item: any) => {
    setDeleteTarget({ type, item });
    setDeleteType("soft");
    setDeleteInfo(null);

    if (type === "curso") {
      const { data } = await supabase.rpc("can_hard_delete_curso", { _curso_id: item.id });
      setDeleteInfo(data);
    }

    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { type, item } = deleteTarget;

    if (deleteType === "soft") {
      const table = type === "curso" ? "cursos" : "turmas";
      const { error } = await supabase
        .from(table)
        .update({ ativo: false, deleted_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) {
        toast({ title: "Erro ao desativar", description: error.message, variant: "destructive" });
      } else {
        await createAuditLog({
          action: "soft_delete",
          entity_type: type,
          entity_id: item.id,
          entity_name: item.nome,
        });
        toast({ title: `${type === "curso" ? "Curso" : "Turma"} desativado(a) com sucesso` });
        fetchData();
      }
    } else {
      const table = type === "curso" ? "cursos" : "turmas";
      const { error } = await supabase.from(table).delete().eq("id", item.id);
      if (error) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      } else {
        await createAuditLog({
          action: "delete",
          entity_type: type,
          entity_id: item.id,
          entity_name: item.nome,
        });
        toast({ title: `${type === "curso" ? "Curso" : "Turma"} excluído(a) permanentemente` });
        fetchData();
      }
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setDeleting(false);
  };

  // ========== EDIT TURMA ==========
  const openEditTurma = (turma: any) => {
    setEditingTurma(turma);
    setEditTurmaForm({
      nome: turma.nome || "",
      codigo: turma.codigo || "",
      curso_id: turma.curso_id || "",
      turno: turma.turno || "matutino",
      max_alunos: String(turma.max_alunos || 40),
      ano: String(turma.ano || new Date().getFullYear()),
    });
    setEditTurmaDialogOpen(true);
  };

  const handleUpdateTurma = async () => {
    if (!editingTurma || saving) return;
    if (!editTurmaForm.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("turmas").update({
      nome: editTurmaForm.nome.trim(),
      codigo: editTurmaForm.codigo.trim() || null,
      curso_id: editTurmaForm.curso_id || null,
      turno: editTurmaForm.turno,
      max_alunos: parseInt(editTurmaForm.max_alunos) || 40,
      ano: parseInt(editTurmaForm.ano) || new Date().getFullYear(),
    }).eq("id", editingTurma.id);
    if (error) {
      toast({ title: "Erro ao atualizar turma", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({ action: "update", entity_type: "turma", entity_id: editingTurma.id, entity_name: editTurmaForm.nome });
      toast({ title: "Turma atualizada com sucesso!" });
      setEditTurmaDialogOpen(false);
      setEditingTurma(null);
      fetchData();
    }
    setSaving(false);
  };

  // ========== EDIT CURSO ==========
  const openEditCurso = (curso: any) => {
    setEditingCurso(curso);
    setEditCursoForm({
      nome: curso.nome || "",
      descricao: curso.descricao || "",
      duracao_semestres: String(curso.duracao_semestres || 1),
    });
    setEditCursoDialogOpen(true);
  };

  const handleUpdateCurso = async () => {
    if (!editingCurso || saving) return;
    if (!editCursoForm.nome.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("cursos").update({
      nome: editCursoForm.nome.trim(),
      descricao: editCursoForm.descricao.trim() || null,
      duracao_semestres: parseInt(editCursoForm.duracao_semestres) || 1,
    }).eq("id", editingCurso.id);
    if (error) {
      toast({ title: "Erro ao atualizar curso", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({ action: "update", entity_type: "curso", entity_id: editingCurso.id, entity_name: editCursoForm.nome });
      toast({ title: "Curso atualizado com sucesso!" });
      setEditCursoDialogOpen(false);
      setEditingCurso(null);
      fetchData();
    }
    setSaving(false);
  };

  const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30";

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
                <DialogContent className="max-w-md rounded-xl">
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
                <DialogContent className="max-w-md rounded-xl">
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
                      <select className={selectClass} value={form.curso_id} onChange={(e) => setForm({ ...form, curso_id: e.target.value })}>
                        <option value="">Selecione...</option>
                        {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Turno</label>
                        <select className={selectClass} value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })}>
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
                className="bg-card rounded-xl border border-border/50 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">{turma.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{turma.cursos?.nome || "Sem curso"} · {turma.ano}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {canDelete && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); openEditTurma(turma); }}
                            className="gap-2"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Editar Turma
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); openDeleteDialog("turma", turma); }}
                            className="text-destructive focus:text-destructive gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Excluir Turma
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                      <TurnoIcon className="h-4.5 w-4.5" />
                    </div>
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

      {/* Course List with Delete */}
      {canManage && cursos.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Cursos Cadastrados</h3>
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <div className="divide-y divide-border/50">
              {cursos.map((curso) => (
                <div key={curso.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/20 transition-colors group">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{curso.nome}</p>
                    <p className="text-xs text-muted-foreground">{curso.descricao || "Sem descrição"} · {curso.duracao_semestres} semestre(s)</p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10"
                        onClick={() => openEditCurso(curso)}
                        title="Editar curso"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => openDeleteDialog("curso", curso)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Turma Dialog */}
      <Dialog open={editTurmaDialogOpen} onOpenChange={(open) => { setEditTurmaDialogOpen(open); if (!open) setEditingTurma(null); }}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader><DialogTitle className="text-lg">Editar Turma</DialogTitle></DialogHeader>
          {editingTurma && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                <Input value={editTurmaForm.nome} onChange={(e) => setEditTurmaForm({ ...editTurmaForm, nome: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Código</label>
                <Input value={editTurmaForm.codigo} onChange={(e) => setEditTurmaForm({ ...editTurmaForm, codigo: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Curso</label>
                <select className={selectClass} value={editTurmaForm.curso_id} onChange={(e) => setEditTurmaForm({ ...editTurmaForm, curso_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Turno</label>
                  <select className={selectClass} value={editTurmaForm.turno} onChange={(e) => setEditTurmaForm({ ...editTurmaForm, turno: e.target.value })}>
                    <option value="matutino">Matutino</option>
                    <option value="vespertino">Vespertino</option>
                    <option value="noturno">Noturno</option>
                    <option value="integral">Integral</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Máx. Alunos</label>
                  <Input type="number" value={editTurmaForm.max_alunos} onChange={(e) => setEditTurmaForm({ ...editTurmaForm, max_alunos: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Ano</label>
                  <Input type="number" value={editTurmaForm.ano} onChange={(e) => setEditTurmaForm({ ...editTurmaForm, ano: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <Button onClick={handleUpdateTurma} disabled={saving} className="w-full rounded-xl h-11">
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Curso Dialog */}
      <Dialog open={editCursoDialogOpen} onOpenChange={(open) => { setEditCursoDialogOpen(open); if (!open) setEditingCurso(null); }}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader><DialogTitle className="text-lg">Editar Curso</DialogTitle></DialogHeader>
          {editingCurso && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                <Input value={editCursoForm.nome} onChange={(e) => setEditCursoForm({ ...editCursoForm, nome: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Descrição</label>
                <Input value={editCursoForm.descricao} onChange={(e) => setEditCursoForm({ ...editCursoForm, descricao: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Duração (semestres)</label>
                <Input type="number" value={editCursoForm.duracao_semestres} onChange={(e) => setEditCursoForm({ ...editCursoForm, duracao_semestres: e.target.value })} className="rounded-xl" />
              </div>
              <Button onClick={handleUpdateCurso} disabled={saving} className="w-full rounded-xl h-11">
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Excluir ${deleteTarget?.type === "curso" ? "Curso" : "Turma"}`}
        description={
          deleteType === "soft"
            ? `"${deleteTarget?.item?.nome}" será desativado(a) e poderá ser restaurado(a) posteriormente.`
            : `"${deleteTarget?.item?.nome}" será excluído(a) permanentemente. Esta ação não pode ser desfeita.`
        }
        confirmLabel={deleteType === "soft" ? "Desativar" : "Excluir Permanentemente"}
        variant={deleteType === "soft" ? "warning" : "danger"}
        onConfirm={handleDelete}
        loading={deleting}
        details={
          deleteInfo
            ? [
                { label: "Turmas vinculadas", value: deleteInfo.turmas_ativas || 0 },
                { label: "Disciplinas vinculadas", value: deleteInfo.disciplinas_ativas || 0 },
                { label: "Matrículas ativas", value: deleteInfo.matriculas_ativas || 0 },
              ]
            : undefined
        }
      />
      {deleteDialogOpen && (
        <div className="fixed bottom-4 right-4 z-[60] flex gap-2">
          <Button
            variant={deleteType === "soft" ? "default" : "outline"}
            size="sm"
            onClick={() => setDeleteType("soft")}
            className="rounded-xl gap-1.5 text-xs"
          >
            <Archive className="h-3 w-3" /> Desativar
          </Button>
          <Button
            variant={deleteType === "hard" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setDeleteType("hard")}
            className="rounded-xl gap-1.5 text-xs"
            disabled={deleteInfo && !deleteInfo.can_delete && deleteTarget?.type === "curso"}
          >
            <Trash2 className="h-3 w-3" /> Excluir Definitivo
          </Button>
        </div>
      )}
    </AppLayout>
  );
};

export default Turmas;
