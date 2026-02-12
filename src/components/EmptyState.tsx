import { cn } from "@/lib/utils";
import { FileX, Inbox, Search, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "search" | "folder" | "inbox";
  className?: string;
}

const variantIcons: Record<string, LucideIcon> = {
  default: FileX,
  search: Search,
  folder: FolderOpen,
  inbox: Inbox,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant];

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 animate-fade-in", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 mb-5">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-5">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
