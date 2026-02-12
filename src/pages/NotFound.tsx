import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { School, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.05),transparent_60%)]" />
      <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative z-10 text-center max-w-md animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl gradient-primary shadow-lg">
            <School className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-8xl font-bold text-foreground/10 mb-2 tracking-tighter select-none">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Página não encontrada</h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
          A página <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md">{location.pathname}</span> não existe ou foi movida.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Link to="/">
            <Button className="gap-2 rounded-xl">
              <Home className="h-4 w-4" /> Ir ao Início
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-12">
          SIAP — Sistema Integrado de Administração Pedagógica
        </p>
      </div>
    </div>
  );
};

export default NotFound;
