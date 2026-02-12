import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { SkeletonTable } from "@/components/Skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const Notas = () => {
  const [search, setSearch] = useState("");
  const [notas, setNotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotas = async () => {
      const { data } = await supabase
        .from("notas")
        .select("*, disciplinas(nome)")
        .order("created_at", { ascending: false });

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
    fetchNotas();
  }, []);

  const filtered = notas.filter((n) => {
    const alunoNome = n.aluno?.profile?.full_name || "";
    const disciplina = n.disciplinas?.nome || "";
    return alunoNome.toLowerCase().includes(search.toLowerCase()) || disciplina.toLowerCase().includes(search.toLowerCase());
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
      />

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar por aluno ou disciplina..."
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm">
          <EmptyState
            variant={search ? "search" : "default"}
            title={search ? "Nenhum resultado" : "Nenhuma nota lançada"}
            description={search ? `Sem resultados para "${search}"` : "As notas lançadas aparecerão aqui"}
          />
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Aluno</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Disciplina</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-4 uppercase tracking-wider">P1</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-4 uppercase tracking-wider">P2</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-4 uppercase tracking-wider hidden sm:table-cell">P3</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-4 uppercase tracking-wider hidden sm:table-cell">P4</th>
                  <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-4 uppercase tracking-wider">Média</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((nota) => (
                  <tr key={nota.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{nota.aluno?.profile?.full_name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{nota.disciplinas?.nome || "—"}</td>
                    <td className={cn("px-4 py-4 text-sm text-center", getNotaColor(nota.nota1))}>{formatNota(nota.nota1)}</td>
                    <td className={cn("px-4 py-4 text-sm text-center", getNotaColor(nota.nota2))}>{formatNota(nota.nota2)}</td>
                    <td className={cn("px-4 py-4 text-sm text-center hidden sm:table-cell", getNotaColor(nota.nota3))}>{formatNota(nota.nota3)}</td>
                    <td className={cn("px-4 py-4 text-sm text-center hidden sm:table-cell", getNotaColor(nota.nota4))}>{formatNota(nota.nota4)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={cn(
                        "text-sm font-bold px-2.5 py-1 rounded-lg",
                        nota.media != null && nota.media >= 7 ? "bg-success/10 text-success" :
                        nota.media != null && nota.media >= 5 ? "bg-warning/10 text-warning" :
                        nota.media != null ? "bg-destructive/10 text-destructive" : "text-foreground"
                      )}>
                        {formatNota(nota.media)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={nota.status || "cursando"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-border/50 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Notas;
