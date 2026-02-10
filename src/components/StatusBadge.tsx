import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  ativo: { label: 'Ativo', classes: 'bg-success/10 text-success border-success/20' },
  inativo: { label: 'Inativo', classes: 'bg-muted text-muted-foreground border-border' },
  trancado: { label: 'Trancado', classes: 'bg-warning/10 text-warning border-warning/20' },
  aprovado: { label: 'Aprovado', classes: 'bg-success/10 text-success border-success/20' },
  reprovado: { label: 'Reprovado', classes: 'bg-destructive/10 text-destructive border-destructive/20' },
  cursando: { label: 'Cursando', classes: 'bg-info/10 text-info border-info/20' },
  pendente: { label: 'Pendente', classes: 'bg-warning/10 text-warning border-warning/20' },
  em_analise: { label: 'Em Análise', classes: 'bg-info/10 text-info border-info/20' },
  recusado: { label: 'Recusado', classes: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, classes: 'bg-muted text-muted-foreground border-border' };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      config.classes,
      className
    )}>
      {config.label}
    </span>
  );
}
