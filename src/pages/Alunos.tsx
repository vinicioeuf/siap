import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Alunos = () => {
  const [search, setSearch] = useState("");
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { hasRole } = useAuth();

  // Form state
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    matricula: "",
    cpf: "",
    phone: "",
    cidade: "",
    estado: "SP",
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
      // Fetch profiles for each aluno
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

  useEffect(() => {
    fetchAlunos();
  }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name || !form.matricula) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);

    // 1. Create auth user
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

    // 2. Update profile phone
    if (form.phone) {
      await supabase
        .from("profiles")
        .update({ phone: form.phone })
        .eq("user_id", authData.user.id);
    }

    // 3. Create aluno record
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
        actions={
          canManage ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Novo Aluno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Nome Completo *</label>
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nome do aluno" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">E-mail *</label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="aluno@email.com" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Senha *</label>
                    <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Matrícula *</label>
                    <Input value={form.matricula} onChange={(e) => setForm({ ...form, matricula: e.target.value })} placeholder="Ex: 2024001" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">CPF</label>
                      <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Telefone</label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Cidade</label>
                      <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="São Paulo" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Estado</label>
                      <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} placeholder="SP" />
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={saving} className="w-full">
                    {saving ? "Salvando..." : "Cadastrar Aluno"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : undefined
        }
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou matrícula..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Aluno</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden md:table-cell">Matrícula</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 hidden lg:table-cell">Contato</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((aluno) => {
                const name = aluno.profile?.full_name || "—";
                const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);
                return (
                  <tr key={aluno.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{aluno.profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-foreground font-mono">{aluno.matricula}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {aluno.profile?.email || "—"}
                        </span>
                        {aluno.profile?.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {aluno.profile.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={aluno.status || "ativo"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum aluno encontrado.</div>
        )}
        {loading && (
          <div className="text-center py-12 text-muted-foreground text-sm">Carregando...</div>
        )}
      </div>
    </AppLayout>
  );
};

export default Alunos;
