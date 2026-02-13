import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { School, ShieldAlert, Building2 } from "lucide-react";
import { hasPermission, type Permission, type AppRole } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, roles, institution, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/25">
            <School className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <h2 className="text-sm font-semibold text-foreground">SIAP</h2>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Institution active check (skip for super_admin)
  if (!isSuperAdmin && institution && !institution.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in text-center max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10">
            <Building2 className="h-7 w-7 text-warning" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Instituição Inativa</h2>
          <p className="text-sm text-muted-foreground">
            A instituição associada à sua conta está temporariamente inativa.
            Entre em contato com o suporte para mais informações.
          </p>
          <a href="/login" className="text-sm text-primary hover:text-primary/80 font-medium">
            Voltar ao login
          </a>
        </div>
      </div>
    );
  }

  // Permission check
  if (requiredPermission && !hasPermission(roles as AppRole[], requiredPermission)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in text-center max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <ShieldAlert className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Acesso Negado</h2>
          <p className="text-sm text-muted-foreground">
            Você não possui permissão para acessar esta página. Contate o administrador do sistema.
          </p>
          <a href="/" className="text-sm text-primary hover:text-primary/80 font-medium">
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
