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
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-1", trend.positive ? "text-success" : "text-destructive")}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% em relação ao mês anterior
            </p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
