import { NavLink as RouterNavLink, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || profile?.email || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const primaryRole = roles[0] || "aluno";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "gradient-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 h-screen sticky top-0",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <School className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="animate-slide-in">
            <h1 className="text-sm font-bold text-sidebar-foreground">EduGestão</h1>
            <p className="text-[10px] text-sidebar-foreground/50">Sistema Acadêmico</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="animate-slide-in">{item.label}</span>}
          </RouterNavLink>
        ))}
      </nav>

      {/* User + Actions */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
            {initials}
          </div>
          {!collapsed && (
            <div className="animate-slide-in min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-sidebar-foreground/50">{roleLabels[primaryRole] || primaryRole}</p>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleSignOut}
            className="flex flex-1 items-center justify-center gap-2 py-2 rounded-lg text-sidebar-foreground/50 hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="text-xs">Sair</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center py-2 px-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
