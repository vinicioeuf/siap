// RBAC Permission System for SIAP
// Defines granular permissions per role

export type AppRole = "admin" | "secretaria" | "professor" | "aluno" | "coordenador";

export type Permission =
  // Users
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  // Courses
  | "cursos.view"
  | "cursos.create"
  | "cursos.edit"
  | "cursos.delete"
  // Disciplines
  | "disciplinas.view"
  | "disciplinas.create"
  | "disciplinas.edit"
  | "disciplinas.delete"
  // Classes
  | "turmas.view"
  | "turmas.create"
  | "turmas.edit"
  | "turmas.delete"
  // Students
  | "alunos.view"
  | "alunos.view_all"
  | "alunos.create"
  | "alunos.edit"
  | "alunos.delete"
  // Enrollments
  | "matriculas.view"
  | "matriculas.create"
  | "matriculas.edit"
  // Grades
  | "notas.view"
  | "notas.view_own"
  | "notas.create"
  | "notas.edit"
  // Attendance
  | "frequencia.view"
  | "frequencia.create"
  | "frequencia.edit"
  // Documents
  | "documentos.view"
  | "documentos.upload"
  | "documentos.generate"
  | "documentos.delete"
  // Requests
  | "requerimentos.view"
  | "requerimentos.view_own"
  | "requerimentos.create"
  | "requerimentos.respond"
  // Audit
  | "audit.view"
  // Dashboard
  | "dashboard.admin"
  | "dashboard.aluno";

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    "users.view", "users.create", "users.edit", "users.delete",
    "cursos.view", "cursos.create", "cursos.edit", "cursos.delete",
    "disciplinas.view", "disciplinas.create", "disciplinas.edit", "disciplinas.delete",
    "turmas.view", "turmas.create", "turmas.edit", "turmas.delete",
    "alunos.view", "alunos.view_all", "alunos.create", "alunos.edit", "alunos.delete",
    "matriculas.view", "matriculas.create", "matriculas.edit",
    "notas.view", "notas.view_own", "notas.create", "notas.edit",
    "frequencia.view", "frequencia.create", "frequencia.edit",
    "documentos.view", "documentos.upload", "documentos.generate", "documentos.delete",
    "requerimentos.view", "requerimentos.view_own", "requerimentos.create", "requerimentos.respond",
    "audit.view",
    "dashboard.admin",
    "dashboard.aluno",
  ],
  secretaria: [
    "cursos.view", "cursos.create", "cursos.edit",
    "disciplinas.view", "disciplinas.create", "disciplinas.edit",
    "turmas.view", "turmas.create", "turmas.edit",
    "alunos.view", "alunos.view_all", "alunos.create", "alunos.edit",
    "matriculas.view", "matriculas.create", "matriculas.edit",
    "notas.view", "notas.create", "notas.edit",
    "frequencia.view", "frequencia.create", "frequencia.edit",
    "documentos.view", "documentos.upload", "documentos.generate",
    "requerimentos.view", "requerimentos.view_own", "requerimentos.create", "requerimentos.respond",
    "dashboard.admin",
  ],
  coordenador: [
    "cursos.view",
    "disciplinas.view",
    "turmas.view",
    "alunos.view", "alunos.view_all",
    "matriculas.view",
    "notas.view",
    "frequencia.view",
    "documentos.view", "documentos.generate",
    "requerimentos.view", "requerimentos.view_own", "requerimentos.respond",
    "dashboard.admin",
  ],
  professor: [
    "turmas.view",
    "disciplinas.view",
    "alunos.view",
    "notas.view", "notas.view_own", "notas.create", "notas.edit",
    "frequencia.view", "frequencia.create", "frequencia.edit",
    "documentos.view", "documentos.generate",
    "requerimentos.view_own", "requerimentos.create",
    "dashboard.admin",
  ],
  aluno: [
    "notas.view_own",
    "frequencia.view",
    "documentos.view",
    "requerimentos.view_own", "requerimentos.view", "requerimentos.create",
    "dashboard.aluno",
  ],
};

export function hasPermission(roles: AppRole[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

export function getPermissions(roles: AppRole[]): Permission[] {
  const perms = new Set<Permission>();
  roles.forEach((role) => {
    ROLE_PERMISSIONS[role]?.forEach((p) => perms.add(p));
  });
  return Array.from(perms);
}

export function getRoleLabel(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    admin: "Administrador",
    secretaria: "Técnico Administrativo",
    professor: "Professor",
    aluno: "Aluno",
    coordenador: "Coordenador",
  };
  return labels[role] || role;
}

export function getRoleColor(role: AppRole): string {
  const colors: Record<AppRole, string> = {
    admin: "bg-destructive/10 text-destructive border-destructive/20",
    secretaria: "bg-info/10 text-info border-info/20",
    professor: "bg-accent/10 text-accent border-accent/20",
    aluno: "bg-success/10 text-success border-success/20",
    coordenador: "bg-warning/10 text-warning border-warning/20",
  };
  return colors[role] || "bg-muted text-muted-foreground";
}

// Navigation items filtered by role
export interface NavItem {
  to: string;
  label: string;
  icon: string; // icon name, resolved in component
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "LayoutDashboard", permission: "dashboard.admin" },
  { to: "/painel-aluno", label: "Meu Painel", icon: "GraduationCap", permission: "dashboard.aluno" },
  { to: "/usuarios", label: "Usuários", icon: "UserCog", permission: "users.view" },
  { to: "/alunos", label: "Alunos", icon: "Users", permission: "alunos.view" },
  { to: "/turmas", label: "Turmas", icon: "GraduationCap", permission: "turmas.view" },
  { to: "/notas", label: "Notas", icon: "BookOpen", permission: "notas.view" },
  { to: "/documentos", label: "Documentos", icon: "FileText", permission: "documentos.view" },
  { to: "/requerimentos", label: "Requerimentos", icon: "ClipboardList", permission: "requerimentos.view" },
  { to: "/auditoria", label: "Auditoria", icon: "ShieldCheck", permission: "audit.view" },
];
