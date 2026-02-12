import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  loading?: boolean;
  details?: { label: string; value: string | number }[];
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  onConfirm,
  loading = false,
  details,
}: ConfirmDialogProps) {
  const iconMap = {
    danger: <Trash2 className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-info" />,
  };

  const bgMap = {
    danger: "bg-destructive/10",
    warning: "bg-warning/10",
    info: "bg-info/10",
  };

  const btnMap = {
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    info: "bg-primary text-primary-foreground hover:bg-primary/90",
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bgMap[variant]} shrink-0`}>
              {iconMap[variant]}
            </div>
            <div className="space-y-1">
              <AlertDialogTitle className="text-base font-bold">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {details && details.length > 0 && (
          <div className="mx-4 my-2 p-3 bg-muted/40 rounded-xl space-y-1.5">
            {details.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{d.label}</span>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        )}

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl" disabled={loading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={`rounded-xl ${btnMap[variant]}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Processando...
              </span>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
