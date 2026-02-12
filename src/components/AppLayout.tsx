import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Menu, Bell, Calendar, Clock } from "lucide-react";
import { getRoleLabel, type AppRole } from "@/lib/permissions";

interface AppLayoutProps {
  children: React.ReactNode;
}

function SystemClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = time.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="hidden xl:flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        <span className="capitalize">{dateStr}</span>
      </span>
      <span className="flex items-center gap-1.5 font-mono">
        <Clock className="h-3.5 w-3.5" />
        {timeStr}
      </span>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { profile, roles } = useAuth();

  const displayName = profile?.full_name || profile?.email || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const primaryRole = (roles[0] || "aluno") as AppRole;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && (
          <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted/50 text-foreground hover:bg-muted transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-center h-9 w-9 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold shadow-sm">
                {initials}
              </div>
            </div>
          </header>
        )}

        {/* Desktop Header Bar */}
        {!isMobile && (
          <header className="institutional-header sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8 py-2.5 no-print">
            <SystemClock />
            <div className="flex items-center gap-4">
              <span className="version-label">SIAP v2.0</span>
              <div className="h-4 w-px bg-border" />
              <button className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
              </button>
              <div className="flex items-center gap-2.5 pl-2 border-l border-border/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[11px] font-bold shadow-sm">
                  {initials}
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-foreground leading-none">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{getRoleLabel(primaryRole)}</p>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 px-6 py-3 flex items-center justify-between text-[11px] text-muted-foreground/60 no-print">
          <span>&copy; {new Date().getFullYear()} SIAP &mdash; Sistema Integrado de Administração Pedagógica</span>
          <span className="hidden sm:inline">Ambiente: <span className="font-mono">Produção</span> &middot; v2.0.0</span>
        </footer>
      </div>
    </div>
  );
}
