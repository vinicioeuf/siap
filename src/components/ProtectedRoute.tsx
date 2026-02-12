import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { School } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

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

  return <>{children}</>;
}
