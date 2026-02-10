import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { mockTurmas } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Users, Clock, Sun, Moon, Sunset } from "lucide-react";

const turnoIcon: Record<string, typeof Sun> = {
  matutino: Sun,
  vespertino: Sunset,
  noturno: Moon,
};

const turnoLabel: Record<string, string> = {
  matutino: 'Matutino',
  vespertino: 'Vespertino',
  noturno: 'Noturno',
};

const Turmas = () => {
  return (
    <AppLayout>
      <PageHeader
        title="Turmas"
        description="Gestão de turmas e séries"
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Turma
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTurmas.map((turma) => {
          const TurnoIcon = turnoIcon[turma.turno] || Sun;
          return (
            <div
              key={turma.id}
              className="bg-card rounded-xl border border-border/50 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer animate-fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">{turma.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{turma.curso} · {turma.ano}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <TurnoIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{turma.totalAlunos} alunos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{turnoLabel[turma.turno]}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">{turma.professor}</p>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default Turmas;
