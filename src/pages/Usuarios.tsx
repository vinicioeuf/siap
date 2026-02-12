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
import { Plus, UserCog, Shield, Mail, Trash2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getRoleLabel, getRoleColor, type AppRole } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { adminCreateUser } from "@/lib/admin-api";
import { maskPhone, unmask, formatPhone } from "@/lib/masks";
import { validateUserForm } from "@/lib/validators";

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>;
}

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  roles: AppRole[];
  created_at: string;
}

const Usuarios = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasRole } = useAuth();
  const canManage = hasRole("admin");

  const [form, setForm] = useState({
    email: "", password: "", full_name: "", phone: "",
    role: "aluno" as AppRole,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: UserRow | null }>({ open: false, user: null });
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, phone, created_at")
      .order("created_at", { ascending: false });

    if (profiles && profiles.length > 0) {
      const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, AppRole[]>();
      allRoles?.forEach((r) => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role as AppRole);
        roleMap.set(r.user_id, existing);
      });

      const enriched: UserRow[] = profiles.map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        email: p.email,
        phone: p.phone,
        roles: roleMap.get(p.user_id) || [],
        created_at: p.created_at,
      }));
      setUsers(enriched);
    } else {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handlePhoneChange = (value: string) => {
    setForm((f) => ({ ...f, phone: maskPhone(value) }));
    if (formErrors.phone) setFormErrors((e) => ({ ...e, phone: "" }));
  };

  const handleCreateUser = async () => {
    const errors = validateUserForm({
      full_name: form.full_name,
      email: form.email,
      password: form.password,
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
      // Use admin API (Edge Function or fallback)
      const { user, error } = await adminCreateUser({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        phone: unmask(form.phone) || undefined,
      });

      if (error || !user) {
        toast({ title: "Erro ao criar usuário", description: error || "Erro desconhecido", variant: "destructive" });
        return;
      }

      // If role is 'aluno', also create aluno record
      if (form.role === "aluno") {
        const matricula = `${new Date().getFullYear()}${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
        await supabase.from("alunos").insert({
          user_id: user.id,
          matricula,
        });
      }

      await createAuditLog({
        action: "create",
        entity_type: "user",
        entity_id: user.id,
        entity_name: form.full_name,
        details: { role: form.role, email: form.email },
      });

      toast({ title: "Usuário criado com sucesso!" });
      setForm({ email: "", password: "", full_name: "", phone: "", role: "aluno" });
      setFormErrors({});
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm.user) return;
    setDeleting(true);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", deleteConfirm.user.user_id);
    if (error) {
      toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({
        action: "delete",
        entity_type: "user",
        entity_id: deleteConfirm.user.user_id,
        entity_name: deleteConfirm.user.full_name,
      });
      toast({ title: "Usuário desativado com sucesso" });
      setDeleteConfirm({ open: false, user: null });
      fetchUsers();
    }
    setDeleting(false);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roles.some((r) => getRoleLabel(r).toLowerCase().includes(q))
    );
  });

  return (
    <AppLayout>
      <PageHeader
        title="Gestão de Usuários"
        description="Cadastro e controle de acesso de usuários do sistema"
        breadcrumbs={[{ label: "Usuários" }]}
        actions={
          canManage ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-sm"><Plus className="h-4 w-4" /> Novo Usuário</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg">Cadastrar Novo Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Completo *</label>
                    <Input value={form.full_name} onChange={(e) => { setForm({ ...form, full_name: e.target.value }); if (formErrors.full_name) setFormErrors((err) => ({ ...err, full_name: "" })); }} placeholder="Nome completo" className={`rounded-xl ${formErrors.full_name ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.full_name} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail *</label>
                    <Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); if (formErrors.email) setFormErrors((err) => ({ ...err, email: "" })); }} placeholder="usuario@email.com" className={`rounded-xl ${formErrors.email ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.email} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Senha *</label>
                    <Input type="password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); if (formErrors.password) setFormErrors((err) => ({ ...err, password: "" })); }} placeholder="Mínimo 6 caracteres" minLength={6} className={`rounded-xl ${formErrors.password ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.password} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                    <Input value={form.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="(00) 00000-0000" maxLength={15} className={`rounded-xl ${formErrors.phone ? 'border-destructive' : ''}`} />
                    <FieldError error={formErrors.phone} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Papel no Sistema *</label>
                    <select className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AppRole })}>
                      <option value="admin">Administrador</option>
                      <option value="secretaria">Técnico Administrativo</option>
                      <option value="coordenador">Coordenador</option>
                      <option value="professor">Professor</option>
                      <option value="aluno">Aluno</option>
                    </select>
                  </div>
                  <div className="p-3 bg-info/5 border border-info/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <Shield className="h-4 w-4 text-info mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-info">Controle de Acesso</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          O papel define as permissões do usuário. Apenas administradores podem criar usuários.
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleCreateUser} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                    {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</>) : "Criar Usuário"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="mb-6">
        <SearchInput placeholder="Buscar por nome, e-mail ou papel..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm">
          <EmptyState variant={search ? "search" : "default"} title={search ? "Nenhum resultado" : "Nenhum usuário cadastrado"} description={search ? `Nenhum usuário encontrado para "${search}"` : "Cadastre o primeiro usuário no sistema"} />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Usuário</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden md:table-cell uppercase tracking-wider">Contato</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Papel</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden lg:table-cell uppercase tracking-wider">Data Cadastro</th>
                  {canManage && <th className="text-center text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((user) => {
                  const initials = user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <tr key={user.user_id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold shrink-0">{initials}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{user.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> {user.email}</span>
                          {user.phone && <span className="text-xs text-muted-foreground">{formatPhone(user.phone)}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <span key={role} className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${getRoleColor(role)}`}>{getRoleLabel(role)}</span>
                          ))}
                          {user.roles.length === 0 && <span className="text-[11px] text-muted-foreground italic">Sem papel</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString("pt-BR")}</span>
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-center">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteConfirm({ open: true, user })}>
                            <Trash2 className="h-4 w-4" />
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
            <p className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "usuário" : "usuários"}</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        title="Desativar Usuário"
        description={`Tem certeza que deseja desativar o usuário "${deleteConfirm.user?.full_name}"? As permissões serão removidas.`}
        confirmLabel="Desativar"
        variant="danger"
        onConfirm={handleDeleteUser}
        loading={deleting}
      />
    </AppLayout>
  );
};

export default Usuarios;
