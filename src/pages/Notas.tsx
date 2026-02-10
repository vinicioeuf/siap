import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { mockNotas } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Notas = () => {
  const [search, setSearch] = useState("");
  const filtered = mockNotas.filter(n =>
    n.alunoNome.toLowerCase().includes(search.toLowerCase()) ||
    n.disciplina.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader
        title="Notas e Médias"
        description="Controle de notas por aluno e disciplina"
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno ou disciplina..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Aluno</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Disciplina</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">P1</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">P2</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">P3</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">P4</th>
                <th className="text-center text-xs font-semibold text-muted-foreground px-4 py-3">Média</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((nota) => (
                <tr key={nota.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{nota.alunoNome}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{nota.disciplina}</td>
                  <td className="px-4 py-3 text-sm text-center text-foreground">{nota.nota1.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-center text-foreground">{nota.nota2.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-center text-foreground">{nota.nota3.toFixed(1)}</td>
                  <td className="px-4 py-3 text-sm text-center text-foreground">{nota.nota4.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-foreground">{nota.media.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={nota.situacao} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Notas;
