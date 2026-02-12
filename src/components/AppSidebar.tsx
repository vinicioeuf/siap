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
  UserCog,
  ShieldCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { hasPermission, type Permission, type AppRole, getRoleLabel } from "@/lib/permissions";

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  UserCog,
  ShieldCheck,
};

interface NavItemDef {
  to: string;
  icon: string;
  label: string;
  permission: Permission;
}

const allNavItems: NavItemDef[] = [
  { to: "/dashboard", icon: "LayoutDashboard", label: "Dashboard", permission: "dashboard.admin" },
  { to: "/painel-aluno", icon: "GraduationCap", label: "Meu Painel", permission: "dashboard.aluno" },
  { to: "/usuarios", icon: "UserCog", label: "Usuários", permission: "users.view" },
  { to: "/alunos", icon: "Users", label: "Alunos", permission: "alunos.view" },
  { to: "/turmas", icon: "GraduationCap", label: "Turmas", permission: "turmas.view" },
  { to: "/notas", icon: "BookOpen", label: "Notas", permission: "notas.view" },
  { to: "/documentos", icon: "FileText", label: "Documentos", permission: "documentos.view" },
  { to: "/requerimentos", icon: "ClipboardList", label: "Requerimentos", permission: "requerimentos.view" },
  { to: "/auditoria", icon: "ShieldCheck", label: "Auditoria", permission: "audit.view" },
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

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter((item) =>
    hasPermission(roles as AppRole[], item.permission)
  );

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
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-lg shadow-primary/20">
            <School className="h-5 w-5 text-primary-foreground" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="animate-slide-in">
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">SIAP</h1>
              <p className="text-[10px] text-sidebar-foreground/30 font-medium tracking-wide">Sistema Acadêmico</p>
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
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          return (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard" || item.to === "/painel-aluno"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/15"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )
              }
            >
              <Icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {(!collapsed || isMobile) && (
                <span className="animate-slide-in truncate">{item.label}</span>
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User + Actions */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-sidebar-primary-foreground text-[11px] font-bold shadow-sm">
            {initials}
          </div>
          {(!collapsed || isMobile) && (
            <div className="animate-slide-in min-w-0 flex-1">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-sidebar-foreground/35 font-medium">{getRoleLabel(primaryRole as AppRole)}</p>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSignOut}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-lg text-sidebar-foreground/40 hover:bg-destructive/15 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="text-xs font-medium">Sair</span>}
          </button>
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex items-center justify-center py-2 px-2.5 rounded-lg text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
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
