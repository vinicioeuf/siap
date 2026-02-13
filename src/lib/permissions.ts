// ========================================
// RBAC Permission System - SaaS Multi-Tenant
// ========================================

export type AppRole =
  | "super_admin"
  | "admin"
  | "coordenador"
  | "secretaria"
  | "tecnico"
  | "professor"
  | "aluno";

export type Permission =
  // Dashboard
  | "dashboard.admin"
  | "dashboard.aluno"
  | "dashboard.platform"
  // Users
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  // Students
  | "alunos.view"
  | "alunos.create"
  | "alunos.edit"
  | "alunos.delete"
  // Classes
  | "turmas.view"
  | "turmas.create"
  | "turmas.edit"
  | "turmas.delete"
  // Courses
  | "cursos.view"
  | "cursos.create"
  | "cursos.edit"
  | "cursos.delete"
  // Subjects
  | "disciplinas.view"
  | "disciplinas.create"
  | "disciplinas.edit"
  | "disciplinas.delete"
  // Grades
  | "notas.view"
  | "notas.create"
  | "notas.edit"
  | "notas.delete"
  // Documents
  | "documentos.view"
  | "documentos.create"
  | "documentos.generate"
  // Requests
  | "requerimentos.view"
  | "requerimentos.create"
  | "requerimentos.respond"
  // Audit
  | "audit.view"
  // Institutions (super_admin)
  | "institutions.view"
  | "institutions.create"
  | "institutions.edit"
  | "institutions.delete"
  // Platform (super_admin)
  | "platform.view"
  | "platform.manage"
  | "plans.manage";

const rolePermissions: Record<AppRole, Permission[]> = {
  super_admin: [
    "dashboard.admin",
    "dashboard.platform",
    "users.view", "users.create", "users.edit", "users.delete",
    "alunos.view", "alunos.create", "alunos.edit", "alunos.delete",
    "turmas.view", "turmas.create", "turmas.edit", "turmas.delete",
    "cursos.view", "cursos.create", "cursos.edit", "cursos.delete",
    "disciplinas.view", "disciplinas.create", "disciplinas.edit", "disciplinas.delete",
    "notas.view", "notas.create", "notas.edit", "notas.delete",
    "documentos.view", "documentos.create", "documentos.generate",
    "requerimentos.view", "requerimentos.create", "requerimentos.respond",
    "audit.view",
    "institutions.view", "institutions.create", "institutions.edit", "institutions.delete",
    "platform.view", "platform.manage", "plans.manage",
  ],
  admin: [
    "dashboard.admin",
    "users.view", "users.create", "users.edit", "users.delete",
    "alunos.view", "alunos.create", "alunos.edit", "alunos.delete",
    "turmas.view", "turmas.create", "turmas.edit", "turmas.delete",
    "cursos.view", "cursos.create", "cursos.edit", "cursos.delete",
    "disciplinas.view", "disciplinas.create", "disciplinas.edit", "disciplinas.delete",
    "notas.view", "notas.create", "notas.edit", "notas.delete",
    "documentos.view", "documentos.create", "documentos.generate",
    "requerimentos.view", "requerimentos.create", "requerimentos.respond",
    "audit.view",
  ],
  coordenador: [
    "dashboard.admin",
    "alunos.view", "alunos.edit",
    "turmas.view", "turmas.create", "turmas.edit",
    "cursos.view",
    "disciplinas.view", "disciplinas.create", "disciplinas.edit",
    "notas.view", "notas.create", "notas.edit",
    "documentos.view", "documentos.generate",
    "requerimentos.view", "requerimentos.respond",
    "audit.view",
  ],
  secretaria: [
    "dashboard.admin",
    "users.view", "users.create",
    "alunos.view", "alunos.create", "alunos.edit",
    "turmas.view", "turmas.create", "turmas.edit",
    "cursos.view", "cursos.create",
    "disciplinas.view", "disciplinas.create", "disciplinas.edit",
    "notas.view",
    "documentos.view", "documentos.create", "documentos.generate",
    "requerimentos.view", "requerimentos.create", "requerimentos.respond",
    "audit.view",
  ],
  tecnico: [
    "dashboard.admin",
    "users.view",
    "alunos.view", "alunos.create", "alunos.edit",
    "turmas.view", "turmas.create", "turmas.edit",
    "cursos.view",
    "disciplinas.view",
    "notas.view",
    "documentos.view", "documentos.create", "documentos.generate",
    "requerimentos.view", "requerimentos.create", "requerimentos.respond",
  ],
  professor: [
    "dashboard.admin",
    "alunos.view",
    "turmas.view",
    "disciplinas.view",
    "notas.view", "notas.create", "notas.edit",
    "documentos.view",
    "requerimentos.view", "requerimentos.create",
  ],
  aluno: [
    "dashboard.aluno",
    "notas.view",
    "documentos.view",
    "requerimentos.view", "requerimentos.create",
  ],
};

export function hasPermission(roles: AppRole[], permission: Permission): boolean {
  return roles.some((role) => rolePermissions[role]?.includes(permission));
}

export function getAllPermissions(roles: AppRole[]): Permission[] {
  const perms = new Set<Permission>();
  roles.forEach((role) => {
    rolePermissions[role]?.forEach((p) => perms.add(p));
  });
  return Array.from(perms);
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  coordenador: "Coordenador",
  secretaria: "Secretária",
  tecnico: "Técnico Administrativo",
  professor: "Professor",
  aluno: "Aluno",
};

export function getRoleLabel(role: AppRole): string {
  return roleLabels[role] || role;
}

const roleColors: Record<AppRole, string> = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  admin: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  coordenador: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  secretaria: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  tecnico: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
  professor: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  aluno: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800",
};

export function getRoleColor(role: AppRole): string {
  return roleColors[role] || "bg-muted text-muted-foreground border-border";
}

/** Roles available for institutional admin to assign (excludes super_admin) */
export const assignableRoles: AppRole[] = [
  "admin", "coordenador", "secretaria", "tecnico", "professor", "aluno",
];

/** Roles available for super_admin to assign (includes all) */
export const allRoles: AppRole[] = [
  "super_admin", "admin", "coordenador", "secretaria", "tecnico", "professor", "aluno",
];
