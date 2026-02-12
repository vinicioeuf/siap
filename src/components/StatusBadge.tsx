import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string; dot: string }> = {
  ativo: { label: 'Ativo', classes: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  inativo: { label: 'Inativo', classes: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
  trancado: { label: 'Trancado', classes: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  aprovado: { label: 'Aprovado', classes: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  reprovado: { label: 'Reprovado', classes: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  cursando: { label: 'Cursando', classes: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  pendente: { label: 'Pendente', classes: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning animate-pulse-soft' },
  em_analise: { label: 'Em Análise', classes: 'bg-info/10 text-info border-info/20', dot: 'bg-info animate-pulse-soft' },
  recusado: { label: 'Recusado', classes: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, classes: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
      config.classes,
      className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}
