import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "create" | "update" | "delete" | "soft_delete" | "restore" | "login" | "logout" | "generate_document";
export type EntityType = "curso" | "disciplina" | "aluno" | "turma" | "nota" | "documento" | "requerimento" | "user" | "generated_document" | "institution" | "subscription";

interface AuditLogEntry {
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string;
  entity_name?: string;
  details?: Record<string, any>;
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, institution_id")
      .eq("user_id", user.id)
      .single();

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email || "Desconhecido",
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      entity_name: entry.entity_name,
      details: entry.details || {},
      institution_id: profile?.institution_id || null,
    });
  } catch (error) {
    console.error("Erro ao registrar log de auditoria:", error);
  }
}

export async function fetchAuditLogs(filters?: {
  entity_type?: string;
  action?: string;
  limit?: number;
}) {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.entity_type) {
    query = query.eq("entity_type", filters.entity_type);
  }
  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(100);
  }

  const { data, error } = await query;
  return { data, error };
}
