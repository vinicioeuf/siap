import { supabase } from "@/integrations/supabase/client";

interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  phone?: string;
  institution_id?: string;
}

interface CreateUserResult {
  user: { id: string; email: string } | null;
  error: string | null;
}

// Creates a user in Firebase Auth and its related profile/role in Firestore.
export async function adminCreateUser(params: CreateUserParams): Promise<CreateUserResult> {
  try {
    const { data, error } = await supabase.functions.invoke("create-user", {
      body: params,
    });

    if (error) {
      return { user: null, error: translateError(error.message || "Erro ao criar usuário") };
    }

    if (!data?.user) {
      return { user: null, error: "Erro ao criar usuário. Tente novamente." };
    }

    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: translateError(err?.message || "Erro inesperado") };
  }
}

function translateError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("email-already-in-use") || lower.includes("already")) {
    return "Este e-mail já está cadastrado no sistema.";
  }
  if (lower.includes("invalid-email")) {
    return "Endereço de e-mail inválido.";
  }
  if (lower.includes("weak-password")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  return message;
}
