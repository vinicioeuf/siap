import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; positive: boolean };
  colorClass?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, colorClass = "text-primary" }: StatCardProps) {
  return (
    <div className="stat-card group animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-muted-foreground font-medium tracking-tight">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1.5 truncate">{description}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold mt-2 px-2 py-0.5 rounded-md",
              trend.positive
                ? "text-success bg-success/10"
                : "text-destructive bg-destructive/10"
            )}>
              <span>{trend.positive ? "+" : ""}{trend.value}%</span>
              <span className="text-[11px] font-normal opacity-70">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
          colorClass === "text-primary" && "bg-primary/10",
          colorClass === "text-accent" && "bg-accent/10",
          colorClass === "text-warning" && "bg-warning/10",
          colorClass === "text-info" && "bg-info/10",
          colorClass === "text-success" && "bg-success/10",
          colorClass === "text-destructive" && "bg-destructive/10",
          !["text-primary", "text-accent", "text-warning", "text-info", "text-success", "text-destructive"].includes(colorClass) && "bg-primary/10",
          colorClass
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
