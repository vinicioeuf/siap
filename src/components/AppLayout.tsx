import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Menu, Bell } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  const displayName = profile?.full_name || profile?.email || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
