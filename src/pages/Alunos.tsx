import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonTable } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Phone, Loader2, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAuditLog } from "@/lib/audit";
import { adminCreateUser } from "@/lib/admin-api";
import { maskCPF, maskPhone, unmask, formatPhone, formatCPF } from "@/lib/masks";
import { validateAlunoForm } from "@/lib/validators";

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {error}
    </p>
  );
}

const emptyForm = {
  email: "", password: "", full_name: "", matricula: "",
  cpf: "", phone: "", cidade: "", estado: "PE",
  curso_id: "", turma_id: "",
};

const Alunos = () => {
  const [search, setSearch] = useState("");
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasRole } = useAuth();

  const [cursos, setCursos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmasFiltradas, setTurmasFiltradas] = useState<any[]>([]);

  const [form, setForm] = useState({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    full_name: "", matricula: "", cpf: "", phone: "",
    cidade: "", estado: "PE", status: "ativo",
    curso_id: "", turma_id: "",
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [editTurmasFiltradas, setEditTurmasFiltradas] = useState<any[]>([]);

  const canManage = hasRole("admin") || hasRole("secretaria");

  const fetchAlunos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("alunos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone");
      const profileMap = new Map();
      profiles?.forEach((p) => profileMap.set(p.user_id, p));

      const alunoIds = data.map((a) => a.id);
      const { data: matriculas } = await supabase
        .from("matriculas")
        .select("aluno_id, turma_id, status, turmas(nome, cursos(nome, id))")
        .in("aluno_id", alunoIds)
        .eq("status", "ativa");
      const matriculaMap = new Map();
      matriculas?.forEach((m) => {
        const existing = matriculaMap.get(m.aluno_id) || [];
        existing.push(m);
        matriculaMap.set(m.aluno_id, existing);
      });

      const enriched = data.map((a) => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
        matriculas: matriculaMap.get(a.id) || [],
      }));
      setAlunos(enriched);
    } else {
      setAlunos([]);
    }
    setLoading(false);
  };

  const fetchCursosETurmas = async () => {
    const [cursosRes, turmasRes] = await Promise.all([
      supabase.from("cursos").select("*").eq("ativo", true).order("nome"),
      supabase.from("turmas").select("*").eq("ativo", true).order("nome"),
    ]);
    setCursos(cursosRes.data || []);
    setTurmas(turmasRes.data || []);
  };

  useEffect(() => { fetchAlunos(); fetchCursosETurmas(); }, []);

  // Filter turmas for create form
  useEffect(() => {
    if (form.curso_id) {
      setTurmasFiltradas(turmas.filter((t) => t.curso_id === form.curso_id));
      if (form.turma_id && !turmas.some((t) => t.id === form.turma_id && t.curso_id === form.curso_id)) {
        setForm((f) => ({ ...f, turma_id: "" }));
      }
    } else {
      setTurmasFiltradas(turmas);
    }
  }, [form.curso_id, turmas]);

  // Filter turmas for edit form
  useEffect(() => {
    if (editForm.curso_id) {
      setEditTurmasFiltradas(turmas.filter((t) => t.curso_id === editForm.curso_id));
      if (editForm.turma_id && !turmas.some((t) => t.id === editForm.turma_id && t.curso_id === editForm.curso_id)) {
        setEditForm((f) => ({ ...f, turma_id: "" }));
      }
    } else {
      setEditTurmasFiltradas(turmas);
    }
  }, [editForm.curso_id, turmas]);

  const handleCPFChange = (value: string) => {
    setForm((f) => ({ ...f, cpf: maskCPF(value) }));
    if (formErrors.cpf) setFormErrors((e) => ({ ...e, cpf: "" }));
  };

  const handlePhoneChange = (value: string) => {
    setForm((f) => ({ ...f, phone: maskPhone(value) }));
    if (formErrors.phone) setFormErrors((e) => ({ ...e, phone: "" }));
  };

  const handleCreate = async () => {
    const errors = validateAlunoForm({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      matricula: form.matricula,
      cpf: form.cpf,
      phone: form.phone,
    });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Corrija os erros no formulário", variant: "destructive" });
      return;
    }
    if (saving) return;
    setSaving(true);

    try {
      const { user, error } = await adminCreateUser({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: "aluno",
        phone: unmask(form.phone) || undefined,
      });

      if (error || !user) {
        toast({ title: "Erro ao criar usuário", description: error || "Erro desconhecido", variant: "destructive" });
        return;
      }

      const { data: alunoData, error: alunoError } = await supabase.from("alunos").insert({
        user_id: user.id,
        matricula: form.matricula,
        cpf: unmask(form.cpf) || null,
        cidade: form.cidade || null,
        estado: form.estado || "PE",
      }).select("id").single();

      if (alunoError) {
        toast({ title: "Erro ao cadastrar aluno", description: alunoError.message, variant: "destructive" });
        return;
      }

      if (form.turma_id && alunoData) {
        await supabase.from("matriculas").insert({
          aluno_id: alunoData.id,
          turma_id: form.turma_id,
          status: "ativa",
        });
      }

      await createAuditLog({
        action: "create",
        entity_type: "aluno",
        entity_id: user.id,
        entity_name: form.full_name,
        details: { matricula: form.matricula, email: form.email, turma_id: form.turma_id || null },
      });

      toast({ title: "Aluno cadastrado com sucesso!" });
      setForm({ ...emptyForm });
      setFormErrors({});
      setDialogOpen(false);
      fetchAlunos();
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ========== EDIT ==========
  const openEditDialog = (aluno: any) => {
    const mat = aluno.matriculas?.[0];
    const cursoId = mat?.turmas?.cursos?.id || "";
    setEditingAluno(aluno);
    setEditForm({
      full_name: aluno.profile?.full_name || "",
      matricula: aluno.matricula || "",
      cpf: aluno.cpf ? maskCPF(aluno.cpf) : "",
      phone: aluno.profile?.phone ? maskPhone(aluno.profile.phone) : "",
      cidade: aluno.cidade || "",
      estado: aluno.estado || "PE",
      status: aluno.status || "ativo",
      curso_id: cursoId,
      turma_id: mat?.turma_id || "",
    });
    setEditFormErrors({});
    setEditDialogOpen(true);
  };

  const handleEditCPFChange = (value: string) => {
    setEditForm((f) => ({ ...f, cpf: maskCPF(value) }));
    if (editFormErrors.cpf) setEditFormErrors((e) => ({ ...e, cpf: "" }));
  };

  const handleEditPhoneChange = (value: string) => {
    setEditForm((f) => ({ ...f, phone: maskPhone(value) }));
    if (editFormErrors.phone) setEditFormErrors((e) => ({ ...e, phone: "" }));
  };

  const handleUpdate = async () => {
    if (!editingAluno || saving) return;

    // Validate (no email/password required for edit)
    const errors: Record<string, string> = {};
    if (!editForm.full_name.trim()) errors.full_name = "Nome é obrigatório";
    if (!editForm.matricula.trim()) errors.matricula = "Matrícula é obrigatória";
    if (editForm.cpf && unmask(editForm.cpf).length > 0 && unmask(editForm.cpf).length !== 11) {
      errors.cpf = "CPF deve ter 11 dígitos";
    }
    if (editForm.phone && unmask(editForm.phone).length > 0 && unmask(editForm.phone).length < 10) {
      errors.phone = "Telefone inválido";
    }
    setEditFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Corrija os erros no formulário", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // 1. Update profile (name + phone)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name.trim(),
          phone: unmask(editForm.phone) || null,
        })
        .eq("user_id", editingAluno.user_id);

      if (profileError) {
        toast({ title: "Erro ao atualizar perfil", description: profileError.message, variant: "destructive" });
        return;
      }

      // 2. Update alunos table
      const { error: alunoError } = await supabase
        .from("alunos")
        .update({
          matricula: editForm.matricula.trim(),
          cpf: unmask(editForm.cpf) || null,
          cidade: editForm.cidade.trim() || null,
          estado: editForm.estado.trim() || "PE",
          status: editForm.status,
        })
        .eq("id", editingAluno.id);

      if (alunoError) {
        toast({ title: "Erro ao atualizar aluno", description: alunoError.message, variant: "destructive" });
        return;
      }

      // 3. Handle turma/matrícula change
      const currentMatricula = editingAluno.matriculas?.[0];
      const currentTurmaId = currentMatricula?.turma_id || null;
      const newTurmaId = editForm.turma_id || null;

      if (currentTurmaId !== newTurmaId) {
        // Cancel old enrollment if exists
        if (currentTurmaId && currentMatricula) {
          await supabase
            .from("matriculas")
            .update({ status: "cancelada" })
            .eq("aluno_id", editingAluno.id)
            .eq("turma_id", currentTurmaId)
            .eq("status", "ativa");
        }
        // Create new enrollment if turma selected
        if (newTurmaId) {
          // Check if there's already a cancelled enrollment for same turma
          const { data: existing } = await supabase
            .from("matriculas")
            .select("id")
            .eq("aluno_id", editingAluno.id)
            .eq("turma_id", newTurmaId)
            .single();

          if (existing) {
            await supabase
              .from("matriculas")
              .update({ status: "ativa" })
              .eq("id", existing.id);
          } else {
            await supabase.from("matriculas").insert({
              aluno_id: editingAluno.id,
              turma_id: newTurmaId,
              status: "ativa",
            });
          }
        }
      }

      await createAuditLog({
        action: "update",
        entity_type: "aluno",
        entity_id: editingAluno.user_id,
        entity_name: editForm.full_name,
        details: {
          matricula: editForm.matricula,
          status: editForm.status,
          turma_id: newTurmaId,
          changes: "profile, aluno, turma",
        },
      });

      toast({ title: "Aluno atualizado com sucesso!" });
      setEditDialogOpen(false);
      setEditingAluno(null);
      fetchAlunos();
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = alunos.filter((a) => {
    const name = a.profile?.full_name || "";
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || a.matricula.includes(search);
  });

  const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30";

  return (
    <AppLayout>
      <PageHeader
        title="Alunos"
        description="Gerenciamento de alunos matriculados"
        breadcrumbs={[{ label: "Alunos" }]}
        actions={
          canManage ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-sm">
                  <Plus className="h-4 w-4" /> Novo Aluno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">Cadastrar Novo Aluno</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Completo *</label>
                    <Input value={form.full_name} onChange={(e) => { setForm({ ...form, full_name: e.target.value }); if (formErrors.full_name) setFormErrors((err) => ({ ...err, full_name: "" })); }} placeholder="Nome do aluno" className={`rounded-xl ${formErrors.full_name ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.full_name} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail *</label>
                    <Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (formErrors.email) setFormErrors((err) => ({ ...err, email: "" })); }} placeholder="aluno@email.com" className={`rounded-xl ${formErrors.email ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.email} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Senha *</label>
                    <Input type="password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); if (formErrors.password) setFormErrors((err) => ({ ...err, password: "" })); }} placeholder="Mínimo 6 caracteres" className={`rounded-xl ${formErrors.password ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.password} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Matrícula *</label>
                    <Input value={form.matricula} onChange={(e) => { setForm({ ...form, matricula: e.target.value }); if (formErrors.matricula) setFormErrors((err) => ({ ...err, matricula: "" })); }} placeholder="Ex: 2026001" className={`rounded-xl ${formErrors.matricula ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.matricula} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">CPF</label>
                      <Input value={form.cpf} onChange={(e) => handleCPFChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} className={`rounded-xl ${formErrors.cpf ? 'border-destructive' : ''}`} />
                      <FieldError error={formErrors.cpf} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                      <Input value={form.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="(00) 00000-0000" maxLength={15} className={`rounded-xl ${formErrors.phone ? 'border-destructive' : ''}`} />
                      <FieldError error={formErrors.phone} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Cidade</label>
                      <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Cedro" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Estado</label>
                      <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="PE" maxLength={2} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Matrícula em Turma (opcional)</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Curso</label>
                        <select className={selectClass} value={form.curso_id} onChange={(e) => setForm({ ...form, curso_id: e.target.value, turma_id: "" })}>
                          <option value="">Selecione um curso...</option>
                          {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Turma</label>
                        <select className={selectClass} value={form.turma_id} onChange={(e) => setForm({ ...form, turma_id: e.target.value })} disabled={turmasFiltradas.length === 0}>
                          <option value="">Selecione uma turma...</option>
                          {turmasFiltradas.map((t) => <option key={t.id} value={t.id}>{t.nome} ({t.turno})</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                    {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</>) : "Cadastrar Aluno"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="mb-6">
        <SearchInput placeholder="Buscar por nome ou matrícula..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>

      {/* ===== EDIT DIALOG ===== */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingAluno(null); }}>
        <DialogContent className="max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Editar Aluno</DialogTitle>
          </DialogHeader>
          {editingAluno && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Completo *</label>
                <Input value={editForm.full_name} onChange={(e) => { setEditForm({ ...editForm, full_name: e.target.value }); if (editFormErrors.full_name) setEditFormErrors((err) => ({ ...err, full_name: "" })); }} className={`rounded-xl ${editFormErrors.full_name ? 'border-destructive' : ''}`} />
                <FieldError error={editFormErrors.full_name} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
                <Input value={editingAluno.profile?.email || ""} disabled className="rounded-xl bg-muted/50 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground mt-1">E-mail não pode ser alterado</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Matrícula *</label>
                <Input value={editForm.matricula} onChange={(e) => { setEditForm({ ...editForm, matricula: e.target.value }); if (editFormErrors.matricula) setEditFormErrors((err) => ({ ...err, matricula: "" })); }} className={`rounded-xl ${editFormErrors.matricula ? 'border-destructive' : ''}`} />
                <FieldError error={editFormErrors.matricula} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">CPF</label>
                  <Input value={editForm.cpf} onChange={(e) => handleEditCPFChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} className={`rounded-xl ${editFormErrors.cpf ? 'border-destructive' : ''}`} />
                  <FieldError error={editFormErrors.cpf} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                  <Input value={editForm.phone} onChange={(e) => handleEditPhoneChange(e.target.value)} placeholder="(00) 00000-0000" maxLength={15} className={`rounded-xl ${editFormErrors.phone ? 'border-destructive' : ''}`} />
                  <FieldError error={editFormErrors.phone} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Cidade</label>
                  <Input value={editForm.cidade} onChange={(e) => setEditForm({ ...editForm, cidade: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Estado</label>
                  <Input value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })} maxLength={2} className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <select className={selectClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="transferido">Transferido</option>
                  <option value="trancado">Trancado</option>
                </select>
              </div>
              <div className="border-t border-border/50 pt-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Matrícula em Turma</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Curso</label>
                    <select className={selectClass} value={editForm.curso_id} onChange={(e) => setEditForm({ ...editForm, curso_id: e.target.value, turma_id: "" })}>
                      <option value="">Sem turma</option>
                      {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Turma</label>
                    <select className={selectClass} value={editForm.turma_id} onChange={(e) => setEditForm({ ...editForm, turma_id: e.target.value })} disabled={editTurmasFiltradas.length === 0}>
                      <option value="">Selecione uma turma...</option>
                      {editTurmasFiltradas.map((t) => <option key={t.id} value={t.id}>{t.nome} ({t.turno})</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm">
          <EmptyState
            variant={search ? "search" : "default"}
            title={search ? "Nenhum resultado" : "Nenhum aluno cadastrado"}
            description={search ? `Nenhum aluno encontrado para "${search}"` : "Comece cadastrando um novo aluno no sistema"}
            action={canManage && !search ? (<Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Cadastrar Aluno</Button>) : undefined}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Aluno</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden md:table-cell uppercase tracking-wider">Matrícula</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden lg:table-cell uppercase tracking-wider">Contato</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden xl:table-cell uppercase tracking-wider">Turma</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Status</th>
                  {canManage && <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((aluno, index) => {
                  const name = aluno.profile?.full_name || "—";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                  const turmaInfo = aluno.matriculas?.[0]?.turmas;
                  return (
                    <tr key={aluno.id} className="hover:bg-muted/20 transition-colors group" style={{ animationDelay: `${index * 30}ms` }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold shrink-0 transition-transform duration-200 group-hover:scale-105">{initials}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">{aluno.profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md">{aluno.matricula}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {aluno.profile?.email || "—"}</span>
                          {aluno.profile?.phone && (<span className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> {formatPhone(aluno.profile.phone)}</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        {turmaInfo ? (
                          <div>
                            <p className="text-sm text-foreground">{turmaInfo.nome}</p>
                            <p className="text-xs text-muted-foreground">{turmaInfo.cursos?.nome || ""}</p>
                          </div>
                        ) : (<span className="text-xs text-muted-foreground italic">Sem turma</span>)}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={aluno.status || "ativo"} /></td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10" onClick={() => openEditDialog(aluno)} title="Editar aluno">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "aluno encontrado" : "alunos encontrados"}</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Alunos;
