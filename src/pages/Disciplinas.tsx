import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonTable } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAuditLog } from "@/lib/audit";
import { hasPermission, type AppRole } from "@/lib/permissions";
import { ConfirmDialog } from "@/components/ConfirmDialog";

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {error}
    </p>
  );
}

const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30";

const emptyForm = { nome: "", codigo: "", carga_horaria: "60", curso_id: "", professor_id: "" };

const Disciplinas = () => {
  const [search, setSearch] = useState("");
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasRole, roles } = useAuth();

  const canManage = hasRole("admin") || hasRole("secretaria");
  const canDelete = hasPermission(roles as AppRole[], "disciplinas.delete");

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState<any>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm, ativo: "true" });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDisc, setDeletingDisc] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [discRes, cursosRes, profsRes] = await Promise.all([
      supabase.from("disciplinas").select("*, cursos(nome)").order("nome"),
      supabase.from("cursos").select("*").eq("ativo", true).order("nome"),
      supabase.from("profiles").select("user_id, full_name").order("full_name"),
    ]);

    // Filter professors: only users with professor role
    let profsList = profsRes.data || [];
    if (profsList.length > 0) {
      const userIds = profsList.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("user_id", userIds)
        .eq("role", "professor");
      const profIds = new Set(roles?.map((r) => r.user_id) || []);
      profsList = profsList.filter((p) => profIds.has(p.user_id));
    }

    setDisciplinas(discRes.data || []);
    setCursos(cursosRes.data || []);
    setProfessores(profsList);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ========== CREATE ==========
  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = "Nome é obrigatório";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (saving) return;
    setSaving(true);

    try {
      const { data, error } = await supabase.from("disciplinas").insert({
        nome: form.nome.trim(),
        codigo: form.codigo.trim() || null,
        carga_horaria: parseInt(form.carga_horaria) || 60,
        curso_id: form.curso_id || null,
        professor_id: form.professor_id || null,
      }).select().single();

      if (error) {
        toast({ title: "Erro ao criar disciplina", description: error.message, variant: "destructive" });
        return;
      }

      await createAuditLog({
        action: "create",
        entity_type: "disciplina",
        entity_id: data?.id,
        entity_name: form.nome,
      });

      toast({ title: "Disciplina criada com sucesso!" });
      setForm({ ...emptyForm });
      setFormErrors({});
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ========== EDIT ==========
  const openEditDialog = (disc: any) => {
    setEditingDisc(disc);
    setEditForm({
      nome: disc.nome || "",
      codigo: disc.codigo || "",
      carga_horaria: String(disc.carga_horaria || 60),
      curso_id: disc.curso_id || "",
      professor_id: disc.professor_id || "",
      ativo: disc.ativo ? "true" : "false",
    });
    setEditFormErrors({});
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingDisc || saving) return;
    const errors: Record<string, string> = {};
    if (!editForm.nome.trim()) errors.nome = "Nome é obrigatório";
    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);

    try {
      const { error } = await supabase.from("disciplinas").update({
        nome: editForm.nome.trim(),
        codigo: editForm.codigo.trim() || null,
        carga_horaria: parseInt(editForm.carga_horaria) || 60,
        curso_id: editForm.curso_id || null,
        professor_id: editForm.professor_id || null,
        ativo: editForm.ativo === "true",
      }).eq("id", editingDisc.id);

      if (error) {
        toast({ title: "Erro ao atualizar disciplina", description: error.message, variant: "destructive" });
        return;
      }

      await createAuditLog({
        action: "update",
        entity_type: "disciplina",
        entity_id: editingDisc.id,
        entity_name: editForm.nome,
      });

      toast({ title: "Disciplina atualizada com sucesso!" });
      setEditDialogOpen(false);
      setEditingDisc(null);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ========== DELETE ==========
  const handleDelete = async () => {
    if (!deletingDisc) return;
    setDeleting(true);
    const { error } = await supabase.from("disciplinas").update({ ativo: false }).eq("id", deletingDisc.id);
    if (error) {
      toast({ title: "Erro ao desativar disciplina", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({ action: "soft_delete", entity_type: "disciplina", entity_id: deletingDisc.id, entity_name: deletingDisc.nome });
      toast({ title: "Disciplina desativada com sucesso" });
      fetchData();
    }
    setDeleteDialogOpen(false);
    setDeletingDisc(null);
    setDeleting(false);
  };

  const filtered = disciplinas.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.nome?.toLowerCase().includes(q) ||
      d.codigo?.toLowerCase().includes(q) ||
      d.cursos?.nome?.toLowerCase().includes(q)
    );
  });

  const activeCount = filtered.filter((d) => d.ativo).length;
  const inactiveCount = filtered.length - activeCount;

  const getProfName = (profId: string | null) => {
    if (!profId) return null;
    return professores.find((p) => p.user_id === profId)?.full_name || null;
  };

  return (
    <AppLayout>
      <PageHeader
        title="Disciplinas"
        description="Gerenciamento de disciplinas e componentes curriculares"
        breadcrumbs={[{ label: "Disciplinas" }]}
        actions={
          canManage ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-sm">
                  <Plus className="h-4 w-4" /> Nova Disciplina
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg">Nova Disciplina</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                    <Input value={form.nome} onChange={(e) => { setForm({ ...form, nome: e.target.value }); if (formErrors.nome) setFormErrors((e2) => ({ ...e2, nome: "" })); }} placeholder="Matemática" className={`rounded-xl ${formErrors.nome ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.nome} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Código</label>
                      <Input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="MAT01" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Carga Horária</label>
                      <Input type="number" value={form.carga_horaria} onChange={(e) => setForm({ ...form, carga_horaria: e.target.value })} className="rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Curso</label>
                    <select className={selectClass} value={form.curso_id} onChange={(e) => setForm({ ...form, curso_id: e.target.value })}>
                      <option value="">Nenhum (geral)</option>
                      {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Professor Responsável</label>
                    <select className={selectClass} value={form.professor_id} onChange={(e) => setForm({ ...form, professor_id: e.target.value })}>
                      <option value="">Nenhum</option>
                      {professores.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
                    </select>
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                    {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</>) : "Criar Disciplina"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="mb-6">
        <SearchInput placeholder="Buscar por nome, código ou curso..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingDisc(null); }}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Editar Disciplina</DialogTitle>
          </DialogHeader>
          {editingDisc && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                <Input value={editForm.nome} onChange={(e) => { setEditForm({ ...editForm, nome: e.target.value }); if (editFormErrors.nome) setEditFormErrors((e2) => ({ ...e2, nome: "" })); }} className={`rounded-xl ${editFormErrors.nome ? 'border-destructive' : ''}`} />
                <FieldError error={editFormErrors.nome} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Código</label>
                  <Input value={editForm.codigo} onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Carga Horária</label>
                  <Input type="number" value={editForm.carga_horaria} onChange={(e) => setEditForm({ ...editForm, carga_horaria: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Curso</label>
                <select className={selectClass} value={editForm.curso_id} onChange={(e) => setEditForm({ ...editForm, curso_id: e.target.value })}>
                  <option value="">Nenhum (geral)</option>
                  {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Professor Responsável</label>
                <select className={selectClass} value={editForm.professor_id} onChange={(e) => setEditForm({ ...editForm, professor_id: e.target.value })}>
                  <option value="">Nenhum</option>
                  {professores.map((p) => <option key={p.user_id} value={p.user_id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <select className={selectClass} value={editForm.ativo} onChange={(e) => setEditForm({ ...editForm, ativo: e.target.value })}>
                  <option value="true">Ativa</option>
                  <option value="false">Inativa</option>
                </select>
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Desativar Disciplina"
        description={`"${deletingDisc?.nome}" será desativada e não aparecerá mais nas listagens.`}
        confirmLabel="Desativar"
        variant="warning"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm">
          <EmptyState
            variant={search ? "search" : "default"}
            title={search ? "Nenhum resultado" : "Nenhuma disciplina cadastrada"}
            description={search ? `Nenhuma disciplina encontrada para "${search}"` : "Comece criando uma nova disciplina no sistema"}
            action={canManage && !search ? (<Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Nova Disciplina</Button>) : undefined}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Disciplina</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden md:table-cell uppercase tracking-wider">Código</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden lg:table-cell uppercase tracking-wider">Curso</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden lg:table-cell uppercase tracking-wider">Professor</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden md:table-cell uppercase tracking-wider">CH</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Status</th>
                  {canManage && <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((disc, index) => {
                  const profName = getProfName(disc.professor_id);
                  return (
                    <tr key={disc.id} className="hover:bg-muted/20 transition-colors group" style={{ animationDelay: `${index * 30}ms` }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-semibold text-foreground">{disc.nome}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded-md text-foreground">{disc.codigo || "—"}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{disc.cursos?.nome || "Geral"}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">{profName || "—"}</span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">{disc.carga_horaria}h</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${disc.ativo ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${disc.ativo ? 'bg-green-500' : 'bg-red-500'}`} />
                          {disc.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10" onClick={() => openEditDialog(disc)} title="Editar">
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            {canDelete && disc.ativo && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10" onClick={() => { setDeletingDisc(disc); setDeleteDialogOpen(true); }} title="Desativar">
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex gap-4">
            <p className="text-xs text-muted-foreground">{filtered.length} disciplina(s)</p>
            {inactiveCount > 0 && <p className="text-xs text-muted-foreground">· {inactiveCount} inativa(s)</p>}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Disciplinas;
