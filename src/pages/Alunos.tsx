import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonTable } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createAuditLog } from "@/lib/audit";

const Alunos = () => {
  const [search, setSearch] = useState("");
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasRole } = useAuth();

  const [form, setForm] = useState({
    email: "", password: "", full_name: "", matricula: "",
    cpf: "", phone: "", cidade: "", estado: "SP",
  });
  const [saving, setSaving] = useState(false);

  const canManage = hasRole("admin") || hasRole("secretaria");

  const fetchAlunos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("alunos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const userIds = data.map((a) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone");

      const profileMap = new Map();
      profiles?.forEach((p) => profileMap.set(p.user_id, p));

      const enriched = data.map((a) => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      }));
      setAlunos(enriched);
    } else {
      setAlunos([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAlunos(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name || !form.matricula) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: form.full_name },
      },
    });

    if (authError || !authData.user) {
      toast({ title: "Erro ao criar usuário", description: authError?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    if (form.phone) {
      await supabase.from("profiles").update({ phone: form.phone }).eq("user_id", authData.user.id);
    }

    const { error: alunoError } = await supabase.from("alunos").insert({
      user_id: authData.user.id,
      matricula: form.matricula,
      cpf: form.cpf || null,
      cidade: form.cidade || null,
      estado: form.estado,
    });

    if (alunoError) {
      toast({ title: "Erro ao cadastrar aluno", description: alunoError.message, variant: "destructive" });
    } else {
      await createAuditLog({
        action: "create",
        entity_type: "aluno",
        entity_id: authData.user.id,
        entity_name: form.full_name,
        details: { matricula: form.matricula, email: form.email },
      });
      toast({ title: "Aluno cadastrado com sucesso!" });
      setForm({ email: "", password: "", full_name: "", matricula: "", cpf: "", phone: "", cidade: "", estado: "SP" });
      setDialogOpen(false);
      fetchAlunos();
    }
    setSaving(false);
  };

  const filtered = alunos.filter((a) => {
    const name = a.profile?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase()) || a.matricula.includes(search);
  });

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
              <DialogContent className="max-w-md rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-lg">Cadastrar Novo Aluno</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome Completo *</label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nome do aluno" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail *</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="aluno@email.com" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Senha *</label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Matrícula *</label>
                    <Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} placeholder="Ex: 2024001" className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">CPF</label>
                      <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" className="rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Cidade</label>
                      <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="São Paulo" className="rounded-xl" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Estado</label>
                      <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="SP" className="rounded-xl" />
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl h-11 text-sm font-semibold">
                    {saving ? "Salvando..." : "Cadastrar Aluno"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar por nome ou matrícula..."
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm">
          <EmptyState
            variant={search ? "search" : "default"}
            title={search ? "Nenhum resultado" : "Nenhum aluno cadastrado"}
            description={search ? `Nenhum aluno encontrado para "${search}"` : "Comece cadastrando um novo aluno no sistema"}
            action={
              canManage && !search ? (
                <Button onClick={() => setDialogOpen(true)} className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" /> Cadastrar Aluno
                </Button>
              ) : undefined
            }
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
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((aluno, index) => {
                  const name = aluno.profile?.full_name || "—";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                  return (
                    <tr
                      key={aluno.id}
                      className="hover:bg-muted/20 transition-colors cursor-pointer group"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold shrink-0 transition-transform duration-200 group-hover:scale-105">
                            {initials}
                          </div>
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
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> {aluno.profile?.email || "—"}
                          </span>
                          {aluno.profile?.phone && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Phone className="h-3 w-3" /> {aluno.profile.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={aluno.status || "ativo"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer count */}
          <div className="px-6 py-3 border-t border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "aluno encontrado" : "alunos encontrados"}
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Alunos;
