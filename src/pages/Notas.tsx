import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonTable } from "@/components/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAuditLog } from "@/lib/audit";
import { cn } from "@/lib/utils";

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>;
}

const Notas = () => {
  const [search, setSearch] = useState("");
  const [notas, setNotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasRole, user, roles, institutionId } = useAuth();

  // Permission checks
  const isAdmin = hasRole("admin");
  const isSecretaria = hasRole("secretaria");
  const isProfessor = hasRole("professor");
  const isAluno = hasRole("aluno");
  const canCreate = isAdmin || isSecretaria || isProfessor;
  const canEdit = isAdmin || isSecretaria || isProfessor;
  const canDelete = isAdmin;

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNota, setEditingNota] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Lookup data
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [alunosList, setAlunosList] = useState<any[]>([]);
  const [profDisciplinas, setProfDisciplinas] = useState<any[]>([]);

  // Form
  const [form, setForm] = useState({
    turma_id: "", disciplina_id: "", aluno_id: "",
    nota1: "", nota2: "", nota3: "", nota4: "", observacao: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; nota: any | null }>({ open: false, nota: null });
  const [deleting, setDeleting] = useState(false);

  // Filter
  const [filterTurma, setFilterTurma] = useState("");
  const [filterDisciplina, setFilterDisciplina] = useState("");

  // ========================================
  // Fetch data
  // ========================================
  const fetchNotas = async () => {
    setLoading(true);
    let query = supabase
      .from("notas")
      .select("*, disciplinas(nome)")
      .order("created_at", { ascending: false });

    const { data } = await query;

    if (data && data.length > 0) {
      const alunoIds = [...new Set(data.map((n) => n.aluno_id))];
      const { data: alunos } = await supabase
        .from("alunos")
        .select("id, user_id, matricula")
        .in("id", alunoIds);
      const userIds = alunos?.map((a) => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const profileMap = new Map();
      profiles?.forEach((p) => profileMap.set(p.user_id, p));
      const alunoMap = new Map();
      alunos?.forEach((a) => alunoMap.set(a.id, { ...a, profile: profileMap.get(a.user_id) }));

      const enriched = data.map((n) => ({
        ...n,
        aluno: alunoMap.get(n.aluno_id) || null,
      }));
      setNotas(enriched);
    } else {
      setNotas([]);
    }
    setLoading(false);
  };

  const fetchLookups = async () => {
    const [turmasRes, disciplinasRes] = await Promise.all([
      supabase.from("turmas").select("*").eq("ativo", true).order("nome"),
      supabase.from("disciplinas").select("*").eq("ativo", true).order("nome"),
    ]);
    setTurmas(turmasRes.data || []);
    setDisciplinas(disciplinasRes.data || []);

    // If professor, fetch linked disciplines
    if (isProfessor && user) {
      const { data: pd } = await supabase
        .from("professor_disciplinas" as any)
        .select("disciplina_id, turma_id")
        .eq("professor_id", user.id)
        .eq("ativo", true);
      setProfDisciplinas(pd || []);
    }
  };

  useEffect(() => { fetchNotas(); fetchLookups(); }, []);

  // Fetch students when turma changes in form
  useEffect(() => {
    if (form.turma_id) {
      const fetchStudents = async () => {
        const { data } = await supabase
          .from("matriculas")
          .select("aluno_id, alunos(id, user_id, matricula)")
          .eq("turma_id", form.turma_id)
          .eq("status", "ativa");

        if (data) {
          const alunoIds = data.map((m: any) => m.alunos?.user_id).filter(Boolean);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", alunoIds);

          const profileMap = new Map();
          profiles?.forEach((p) => profileMap.set(p.user_id, p));

          const enriched = data.map((m: any) => ({
            ...m.alunos,
            profile: profileMap.get(m.alunos?.user_id),
          })).filter(Boolean);
          setAlunosList(enriched);
        }
      };
      fetchStudents();
    } else {
      setAlunosList([]);
    }
  }, [form.turma_id]);

  // ========================================
  // Get available disciplines (filtered for professor)
  // ========================================
  const getAvailableDisciplinas = () => {
    if (isProfessor && !isAdmin && !isSecretaria) {
      const linkedIds = profDisciplinas.map((pd: any) => pd.disciplina_id);
      return disciplinas.filter((d) => linkedIds.includes(d.id));
    }
    return disciplinas;
  };

  const getAvailableTurmas = () => {
    if (isProfessor && !isAdmin && !isSecretaria) {
      const linkedTurmaIds = profDisciplinas.map((pd: any) => pd.turma_id).filter(Boolean);
      if (linkedTurmaIds.length > 0) {
        return turmas.filter((t) => linkedTurmaIds.includes(t.id));
      }
    }
    return turmas;
  };

  // ========================================
  // Form handlers
  // ========================================
  const validateNota = (val: string): boolean => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 10;
  };

  const handleNotaInput = (field: string, value: string) => {
    // Only allow numbers and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setForm((f) => ({ ...f, [field]: formatted }));
    if (formErrors[field]) setFormErrors((e) => ({ ...e, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.aluno_id) errors.aluno_id = "Selecione um aluno";
    if (!form.disciplina_id) errors.disciplina_id = "Selecione uma disciplina";
    if (form.nota1 && !validateNota(form.nota1)) errors.nota1 = "Nota entre 0 e 10";
    if (form.nota2 && !validateNota(form.nota2)) errors.nota2 = "Nota entre 0 e 10";
    if (form.nota3 && !validateNota(form.nota3)) errors.nota3 = "Nota entre 0 e 10";
    if (form.nota4 && !validateNota(form.nota4)) errors.nota4 = "Nota entre 0 e 10";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openCreate = () => {
    setEditingNota(null);
    setForm({ turma_id: "", disciplina_id: "", aluno_id: "", nota1: "", nota2: "", nota3: "", nota4: "", observacao: "" });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (nota: any) => {
    setEditingNota(nota);
    setForm({
      turma_id: nota.turma_id || "",
      disciplina_id: nota.disciplina_id || "",
      aluno_id: nota.aluno_id || "",
      nota1: nota.nota1 != null ? String(nota.nota1) : "",
      nota2: nota.nota2 != null ? String(nota.nota2) : "",
      nota3: nota.nota3 != null ? String(nota.nota3) : "",
      nota4: nota.nota4 != null ? String(nota.nota4) : "",
      observacao: nota.observacao || "",
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (saving) return;
    setSaving(true);

    try {
      const payload: any = {
        aluno_id: form.aluno_id,
        disciplina_id: form.disciplina_id,
        turma_id: form.turma_id || null,
        nota1: form.nota1 ? parseFloat(form.nota1) : null,
        nota2: form.nota2 ? parseFloat(form.nota2) : null,
        nota3: form.nota3 ? parseFloat(form.nota3) : null,
        nota4: form.nota4 ? parseFloat(form.nota4) : null,
        observacao: form.observacao || null,
        professor_id: user?.id || null,
        institution_id: institutionId,
      };

      if (editingNota) {
        // Update
        const { error } = await supabase
          .from("notas")
          .update(payload)
          .eq("id", editingNota.id);

        if (error) {
          toast({ title: "Erro ao atualizar nota", description: error.message, variant: "destructive" });
          return;
        }
        await createAuditLog({
          action: "update",
          entity_type: "nota",
          entity_id: editingNota.id,
          entity_name: `Nota de ${editingNota.aluno?.profile?.full_name || 'aluno'}`,
          details: payload,
        });
        toast({ title: "Nota atualizada com sucesso!" });
      } else {
        // Create
        const { error } = await supabase.from("notas").insert(payload);

        if (error) {
          if (error.message.includes("duplicate") || error.message.includes("unique")) {
            toast({ title: "Nota já existe", description: "Já existe uma nota para este aluno nesta disciplina/turma. Edite a nota existente.", variant: "destructive" });
          } else {
            toast({ title: "Erro ao lançar nota", description: error.message, variant: "destructive" });
          }
          return;
        }
        await createAuditLog({
          action: "create",
          entity_type: "nota",
          entity_name: `Nota lançada`,
          details: payload,
        });
        toast({ title: "Nota lançada com sucesso!" });
      }

      setDialogOpen(false);
      setEditingNota(null);
      fetchNotas();
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.nota) return;
    setDeleting(true);
    const { error } = await supabase.from("notas").delete().eq("id", deleteConfirm.nota.id);
    if (error) {
      toast({ title: "Erro ao excluir nota", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({
        action: "delete",
        entity_type: "nota",
        entity_id: deleteConfirm.nota.id,
        entity_name: `Nota de ${deleteConfirm.nota.aluno?.profile?.full_name || 'aluno'}`,
      });
      toast({ title: "Nota excluída com sucesso" });
      fetchNotas();
    }
    setDeleteConfirm({ open: false, nota: null });
    setDeleting(false);
  };

  // ========================================
  // Filtering
  // ========================================
  const filtered = notas.filter((n) => {
    const alunoNome = n.aluno?.profile?.full_name || "";
    const disciplina = n.disciplinas?.nome || "";
    const matchSearch = alunoNome.toLowerCase().includes(search.toLowerCase()) || disciplina.toLowerCase().includes(search.toLowerCase());
    const matchTurma = !filterTurma || n.turma_id === filterTurma;
    const matchDisc = !filterDisciplina || n.disciplina_id === filterDisciplina;
    return matchSearch && matchTurma && matchDisc;
  });

  const formatNota = (val: number | null) => (val != null ? Number(val).toFixed(1) : "—");
  const getNotaColor = (val: number | null) => {
    if (val == null) return "";
    if (val >= 7) return "text-success font-semibold";
    if (val >= 5) return "text-warning font-semibold";
    return "text-destructive font-semibold";
  };

  return (
    <AppLayout>
      <PageHeader
        title="Notas e Médias"
        description="Controle de notas por aluno e disciplina"
        breadcrumbs={[{ label: "Notas" }]}
        actions={
          canCreate ? (
            <Button onClick={openCreate} className="gap-2 rounded-xl shadow-sm">
              <Plus className="h-4 w-4" /> Lançar Nota
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchInput placeholder="Buscar por aluno ou disciplina..." value={search} onChange={setSearch} className="max-w-sm" />
        <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={filterTurma} onChange={(e) => setFilterTurma(e.target.value)}>
          <option value="">Todas as turmas</option>
          {turmas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
        </select>
        <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm" value={filterDisciplina} onChange={(e) => setFilterDisciplina(e.target.value)}>
          <option value="">Todas as disciplinas</option>
          {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm">
          <EmptyState
            variant={search ? "search" : "default"}
            title={search ? "Nenhum resultado" : "Nenhuma nota lançada"}
            description={search ? `Sem resultados para "${search}"` : "As notas lançadas aparecerão aqui"}
            action={canCreate && !search ? (<Button onClick={openCreate} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Lançar Nota</Button>) : undefined}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full formal-table">
              <thead>
                <tr className="border-b-2 border-border bg-muted/40">
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-widest">Aluno</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-widest">Disciplina</th>
                  <th className="text-center text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-widest">P1</th>
                  <th className="text-center text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-widest">P2</th>
                  <th className="text-center text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-widest hidden sm:table-cell">P3</th>
                  <th className="text-center text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-widest hidden sm:table-cell">P4</th>
                  <th className="text-center text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-widest">Média</th>
                  <th className="text-left text-[11px] font-semibold text-muted-foreground px-5 py-3 uppercase tracking-widest">Situação</th>
                  {canEdit && <th className="text-center text-[11px] font-semibold text-muted-foreground px-3 py-3 uppercase tracking-widest">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((nota) => (
                  <tr key={nota.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{nota.aluno?.profile?.full_name || "—"}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{nota.disciplinas?.nome || "—"}</td>
                    <td className={cn("px-3 py-3 text-sm text-center", getNotaColor(nota.nota1))}>{formatNota(nota.nota1)}</td>
                    <td className={cn("px-3 py-3 text-sm text-center", getNotaColor(nota.nota2))}>{formatNota(nota.nota2)}</td>
                    <td className={cn("px-3 py-3 text-sm text-center hidden sm:table-cell", getNotaColor(nota.nota3))}>{formatNota(nota.nota3)}</td>
                    <td className={cn("px-3 py-3 text-sm text-center hidden sm:table-cell", getNotaColor(nota.nota4))}>{formatNota(nota.nota4)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded-md",
                        nota.media != null && nota.media >= 7 ? "bg-success/10 text-success" :
                        nota.media != null && nota.media >= 5 ? "bg-warning/10 text-warning" :
                        nota.media != null ? "bg-destructive/10 text-destructive" : "text-foreground"
                      )}>
                        {formatNota(nota.media)}
                      </span>
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={nota.status || "cursando"} /></td>
                    {canEdit && (
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(nota)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteConfirm({ open: true, nota })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 border-t border-border/50 bg-muted/20 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">{filtered.length} {filtered.length === 1 ? "registro encontrado" : "registros encontrados"}</p>
            <p className="text-[11px] text-muted-foreground/60 hidden sm:block">Média para aprovação: 7.0</p>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingNota ? "Editar Nota" : "Lançar Nova Nota"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Turma */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Turma</label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30"
                value={form.turma_id}
                onChange={(e) => setForm({ ...form, turma_id: e.target.value, aluno_id: "" })}
                disabled={!!editingNota}
              >
                <option value="">Selecione uma turma...</option>
                {getAvailableTurmas().map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>

            {/* Disciplina */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Disciplina *</label>
              <select
                className={`flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 ${formErrors.disciplina_id ? 'border-destructive' : 'border-input'}`}
                value={form.disciplina_id}
                onChange={(e) => { setForm({ ...form, disciplina_id: e.target.value }); if (formErrors.disciplina_id) setFormErrors((err) => ({ ...err, disciplina_id: "" })); }}
                disabled={!!editingNota}
              >
                <option value="">Selecione uma disciplina...</option>
                {getAvailableDisciplinas().map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
              <FieldError error={formErrors.disciplina_id} />
            </div>

            {/* Aluno */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Aluno *</label>
              <select
                className={`flex h-10 w-full rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 ${formErrors.aluno_id ? 'border-destructive' : 'border-input'}`}
                value={form.aluno_id}
                onChange={(e) => { setForm({ ...form, aluno_id: e.target.value }); if (formErrors.aluno_id) setFormErrors((err) => ({ ...err, aluno_id: "" })); }}
                disabled={!!editingNota}
              >
                <option value="">
                  {form.turma_id ? (alunosList.length === 0 ? "Nenhum aluno nesta turma" : "Selecione um aluno...") : "Selecione uma turma primeiro"}
                </option>
                {alunosList.map((a) => <option key={a.id} value={a.id}>{a.profile?.full_name || a.matricula} ({a.matricula})</option>)}
              </select>
              <FieldError error={formErrors.aluno_id} />
            </div>

            {/* Notas grid */}
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Notas (0 a 10)</p>
              <div className="grid grid-cols-4 gap-3">
                {(["nota1", "nota2", "nota3", "nota4"] as const).map((field, i) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">P{i + 1}</label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={form[field]}
                      onChange={(e) => handleNotaInput(field, e.target.value)}
                      placeholder="0.0"
                      className={`rounded-xl text-center ${formErrors[field] ? 'border-destructive' : ''}`}
                    />
                    <FieldError error={formErrors[field]} />
                  </div>
                ))}
              </div>
            </div>

            {/* Observação */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Observação</label>
              <Input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Observação opcional" className="rounded-xl" />
            </div>

            {/* Submit */}
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
              {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />{editingNota ? "Salvando..." : "Lançando..."}</>) : (editingNota ? "Salvar Alterações" : "Lançar Nota")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Excluir Nota"
        description={`Tem certeza que deseja excluir a nota de "${deleteConfirm.nota?.aluno?.profile?.full_name || 'aluno'}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </AppLayout>
  );
};

export default Notas;
