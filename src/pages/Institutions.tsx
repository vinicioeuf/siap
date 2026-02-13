import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonTable } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Building2, Users, Loader2, AlertCircle, CheckCircle2, XCircle,
  MoreVertical, Pencil, Power, CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAuditLog } from "@/lib/audit";

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>;
}

interface InstitutionRow {
  id: string;
  name: string;
  slug: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  subscription_status: string | null;
  plan_id: string | null;
  plan_name?: string;
  user_count?: number;
  created_at: string;
}

const Institutions = () => {
  const [search, setSearch] = useState("");
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isSuperAdmin } = useAuth();

  const [form, setForm] = useState({
    name: "", slug: "", cnpj: "", email: "", phone: "", address: "",
    plan_id: "", admin_name: "", admin_email: "", admin_password: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Edit
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInst, setEditingInst] = useState<InstitutionRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", cnpj: "", email: "", phone: "", plan_id: "" });

  const fetchData = async () => {
    setLoading(true);

    const [instRes, plansRes] = await Promise.all([
      supabase.from("institutions").select("*").order("name"),
      supabase.from("plans").select("*").order("price"),
    ]);

    const planMap = new Map<string, string>();
    (plansRes.data || []).forEach((p: any) => planMap.set(p.id, p.name));
    setPlans(plansRes.data || []);

    // Get user counts per institution
    const { data: profiles } = await supabase
      .from("profiles")
      .select("institution_id");

    const countMap = new Map<string, number>();
    profiles?.forEach((p: any) => {
      if (p.institution_id) {
        countMap.set(p.institution_id, (countMap.get(p.institution_id) || 0) + 1);
      }
    });

    const enriched: InstitutionRow[] = (instRes.data || []).map((inst: any) => ({
      ...inst,
      plan_name: inst.plan_id ? planMap.get(inst.plan_id) || "—" : "Gratuito",
      user_count: countMap.get(inst.id) || 0,
    }));

    setInstitutions(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Nome é obrigatório";
    if (!form.slug.trim()) errors.slug = "Slug é obrigatório";
    if (!form.admin_name.trim()) errors.admin_name = "Nome do admin é obrigatório";
    if (!form.admin_email.trim()) errors.admin_email = "E-mail do admin é obrigatório";
    if (!form.admin_password || form.admin_password.length < 6) errors.admin_password = "Senha mínima 6 caracteres";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (saving) return;
    setSaving(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-institution", {
        body: {
          institution_name: form.name,
          institution_slug: form.slug,
          institution_cnpj: form.cnpj || undefined,
          institution_phone: form.phone || undefined,
          institution_email: form.email || undefined,
          institution_address: form.address || undefined,
          plan_id: form.plan_id || undefined,
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          admin_password: form.admin_password,
        },
      });

      if (error || data?.error) {
        toast({ title: "Erro ao criar instituição", description: data?.error || error?.message, variant: "destructive" });
        return;
      }

      await createAuditLog({
        action: "create",
        entity_type: "institution",
        entity_id: data?.institution?.id,
        entity_name: form.name,
        details: { admin_email: form.admin_email },
      });

      toast({ title: "Instituição criada com sucesso!" });
      setForm({ name: "", slug: "", cnpj: "", email: "", phone: "", address: "", plan_id: "", admin_name: "", admin_email: "", admin_password: "" });
      setFormErrors({});
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Erro inesperado", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (inst: InstitutionRow) => {
    const newStatus = !inst.is_active;
    const { error } = await supabase
      .from("institutions")
      .update({ is_active: newStatus })
      .eq("id", inst.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({
        action: "update",
        entity_type: "institution",
        entity_id: inst.id,
        entity_name: inst.name,
        details: { is_active: newStatus },
      });
      toast({ title: `Instituição ${newStatus ? "ativada" : "desativada"}` });
      fetchData();
    }
  };

  const openEdit = (inst: InstitutionRow) => {
    setEditingInst(inst);
    setEditForm({
      name: inst.name,
      slug: inst.slug,
      cnpj: inst.cnpj || "",
      email: inst.email || "",
      phone: inst.phone || "",
      plan_id: inst.plan_id || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingInst || saving) return;
    if (!editForm.name.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSaving(true);

    const { error } = await supabase.from("institutions").update({
      name: editForm.name.trim(),
      slug: editForm.slug.trim(),
      cnpj: editForm.cnpj.trim() || null,
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
      plan_id: editForm.plan_id || null,
    }).eq("id", editingInst.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await createAuditLog({
        action: "update",
        entity_type: "institution",
        entity_id: editingInst.id,
        entity_name: editForm.name,
      });
      toast({ title: "Instituição atualizada!" });
      setEditDialogOpen(false);
      setEditingInst(null);
      fetchData();
    }
    setSaving(false);
  };

  const handleSlugify = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((f) => ({ ...f, name, slug }));
  };

  const filtered = institutions.filter((inst) => {
    const q = search.toLowerCase();
    return inst.name.toLowerCase().includes(q) || inst.slug.toLowerCase().includes(q) || (inst.email || "").toLowerCase().includes(q);
  });

  const selectClass = "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30";

  return (
    <AppLayout>
      <PageHeader
        title="Instituições"
        description="Gerenciamento de instituições da plataforma"
        breadcrumbs={[{ label: "Instituições" }]}
        actions={
          isSuperAdmin ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl shadow-sm">
                  <Plus className="h-4 w-4" /> Nova Instituição
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg">Nova Instituição</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="border-b border-border/50 pb-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Dados da Instituição</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                        <Input value={form.name} onChange={(e) => handleSlugify(e.target.value)} placeholder="Escola Municipal ABC" className={`rounded-xl ${formErrors.name ? 'border-destructive' : ''}`} />
                        <FieldError error={formErrors.name} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Slug *</label>
                          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="escola-abc" className={`rounded-xl ${formErrors.slug ? 'border-destructive' : ''}`} />
                          <FieldError error={formErrors.slug} />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ</label>
                          <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="rounded-xl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
                          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@escola.edu.br" className="rounded-xl" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 0000-0000" className="rounded-xl" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Plano</label>
                        <select className={selectClass} value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })}>
                          <option value="">Gratuito</option>
                          {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}/mês</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Administrador da Instituição</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Completo *</label>
                        <Input value={form.admin_name} onChange={(e) => { setForm({ ...form, admin_name: e.target.value }); if (formErrors.admin_name) setFormErrors((err) => ({ ...err, admin_name: "" })) }} placeholder="Nome do administrador" className={`rounded-xl ${formErrors.admin_name ? 'border-destructive' : ''}`} />
                        <FieldError error={formErrors.admin_name} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail *</label>
                        <Input type="email" value={form.admin_email} onChange={(e) => { setForm({ ...form, admin_email: e.target.value }); if (formErrors.admin_email) setFormErrors((err) => ({ ...err, admin_email: "" })) }} placeholder="admin@escola.edu.br" className={`rounded-xl ${formErrors.admin_email ? 'border-destructive' : ''}`} />
                        <FieldError error={formErrors.admin_email} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Senha *</label>
                        <Input type="password" value={form.admin_password} onChange={(e) => { setForm({ ...form, admin_password: e.target.value }); if (formErrors.admin_password) setFormErrors((err) => ({ ...err, admin_password: "" })) }} placeholder="Mínimo 6 caracteres" className={`rounded-xl ${formErrors.admin_password ? 'border-destructive' : ''}`} />
                        <FieldError error={formErrors.admin_password} />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                    {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</>) : "Criar Instituição"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="mb-6">
        <SearchInput placeholder="Buscar instituições..." value={search} onChange={setSearch} className="max-w-sm" />
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingInst(null); }}>
        <DialogContent className="max-w-md rounded-xl">
          <DialogHeader><DialogTitle className="text-lg">Editar Instituição</DialogTitle></DialogHeader>
          {editingInst && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome *</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Slug</label>
                  <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ</label>
                  <Input value={editForm.cnpj} onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail</label>
                  <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Plano</label>
                <select className={selectClass} value={editForm.plan_id} onChange={(e) => setEditForm({ ...editForm, plan_id: e.target.value })}>
                  <option value="">Gratuito</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.price).toFixed(2)}/mês</option>)}
                </select>
              </div>
              <Button onClick={handleUpdate} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                {saving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm">
          <EmptyState
            variant={search ? "search" : "default"}
            title={search ? "Nenhum resultado" : "Nenhuma instituição"}
            description={search ? `Sem resultados para "${search}"` : "Crie a primeira instituição"}
            action={isSuperAdmin && !search ? (<Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> Nova Instituição</Button>) : undefined}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Instituição</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden md:table-cell uppercase tracking-wider">Plano</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-6 py-4 hidden lg:table-cell uppercase tracking-wider">Usuários</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 hidden lg:table-cell uppercase tracking-wider">Criado em</th>
                  {isSuperAdmin && <th className="text-right text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{inst.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{inst.slug} {inst.email ? `· ${inst.email}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-foreground">{inst.plan_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">{inst.user_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inst.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${inst.is_active ? "bg-green-500" : "bg-red-500"}`} />
                        {inst.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{new Date(inst.created_at).toLocaleDateString("pt-BR")}</span>
                    </td>
                    {isSuperAdmin && (
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => openEdit(inst)} className="gap-2">
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(inst)} className="gap-2">
                              <Power className="h-3.5 w-3.5" /> {inst.is_active ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "instituição" : "instituições"} ·
              {" "}{filtered.filter((i) => i.is_active).length} ativas
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Institutions;
