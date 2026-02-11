import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AlunoRow {
  id: string;
  matricula: string;
  status: string;
  user_id: string;
  cpf: string | null;
  cidade: string | null;
  profiles: { full_name: string; email: string; phone: string | null } | null;
}

const Alunos = () => {
  const [search, setSearch] = useState("");
  const [alunos, setAlunos] = useState<AlunoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlunos = async () => {
      const { data } = await supabase
        .from("alunos")
        .select("id, matricula, status, user_id, cpf, cidade, profiles!alunos_user_id_fkey(full_name, email, phone)")
        .order("created_at", { ascending: false });
      setAlunos((data as any[]) || []);
      setLoading(false);
    };
    fetchAlunos();
  }, []);

  const filtered = alunos.filter((a) => {
    const name = a.profiles?.full_name || "";
    return name.toLowerCase().includes(search.toLowerCase()) || a.matricula.includes(search);
  });

  return (
    <AppLayout>
      <PageHeader
        title="Alunos"
        description="Gerenciamento de alunos matriculados"
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Novo Aluno
          </Button>
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
                const name = aluno.profiles?.full_name || "—";
                const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2);
                return (
                  <tr key={aluno.id} className="hover:bg-muted/20 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{aluno.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-foreground font-mono">{aluno.matricula}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {aluno.profiles?.email || "—"}
                        </span>
                        {aluno.profiles?.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {aluno.profiles.phone}
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
