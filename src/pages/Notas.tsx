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
        <div className="bg-card rounded-xl border border-border/50 shadow-sm">
          <EmptyState
            variant={search ? "search" : "default"}
            title={search ? "Nenhum resultado" : "Nenhuma nota lançada"}
            description={search ? `Sem resultados para "${search}"` : "As notas lançadas aparecerão aqui"}
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
                    <td className="px-5 py-3">
                      <StatusBadge status={nota.status || "cursando"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 border-t border-border/50 bg-muted/20 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "registro encontrado" : "registros encontrados"}
            </p>
            <p className="text-[11px] text-muted-foreground/60 hidden sm:block">
              Média para aprovação: 7.0
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Notas;
