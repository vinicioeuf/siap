import { NavLink as RouterNavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  School,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  secretaria: "Secretaria Acadêmica",
  professor: "Professor",
  aluno: "Aluno",
  coordenador: "Coordenador",
};

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/alunos", icon: Users, label: "Alunos" },
  { to: "/turmas", icon: GraduationCap, label: "Turmas" },
  { to: "/notas", icon: BookOpen, label: "Notas" },
  { to: "/documentos", icon: FileText, label: "Documentos" },
  { to: "/requerimentos", icon: ClipboardList, label: "Requerimentos" },
];

interface AppSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const displayName = profile?.full_name || profile?.email || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const primaryRole = roles[0] || "aluno";

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const sidebarContent = (
    <aside
      className={cn(
        "gradient-sidebar flex flex-col h-screen",
        isMobile
          ? "w-72"
          : cn(
              "border-r border-sidebar-border transition-all duration-300 sticky top-0",
              collapsed ? "w-[72px]" : "w-64"
            )
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
            <School className="h-5 w-5 text-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="animate-slide-in">
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">SIAP</h1>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium">Gestão Acadêmica</p>
            </div>
          )}
        </div>
        {isMobile && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="flex items-center justify-center p-1.5 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Section label */}
      {(!collapsed || isMobile) && (
        <div className="px-5 pt-5 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
            Menu Principal
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {(!collapsed || isMobile) && (
              <span className="animate-slide-in truncate">{item.label}</span>
            )}
          </RouterNavLink>
        ))}
      </nav>

      {/* User + Actions */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-sidebar-accent/50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-sidebar-primary-foreground text-xs font-bold shadow-sm">
            {initials}
          </div>
          {(!collapsed || isMobile) && (
            <div className="animate-slide-in min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium">{roleLabels[primaryRole] || primaryRole}</p>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSignOut}
            className="flex flex-1 items-center justify-center gap-2 py-2.5 rounded-xl text-sidebar-foreground/40 hover:bg-destructive/15 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="text-xs font-medium">Sair</span>}
          </button>
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center py-2.5 px-2.5 rounded-xl text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  // Mobile: render as drawer overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onMobileClose}
        />
        {/* Drawer */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  // Desktop: render inline
  return sidebarContent;
}
