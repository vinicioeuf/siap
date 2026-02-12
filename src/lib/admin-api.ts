// ========================================
// Admin API - User Creation via Edge Function
// ========================================
// Uses Supabase Edge Function "create-user" to bypass email rate limits.
// Falls back to signUp if Edge Function is not deployed.

import { supabase, supabaseAuth } from "@/integrations/supabase/client";

interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  phone?: string;
}

interface CreateUserResult {
  user: { id: string; email: string } | null;
  error: string | null;
}

/**
 * Creates a user via the admin Edge Function (recommended).
 * Falls back to signUp if Edge Function is unavailable.
 */
export async function adminCreateUser(params: CreateUserParams): Promise<CreateUserResult> {
  try {
    // Try Edge Function first (no rate limit, auto-confirmed)
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: params,
    });

    if (error) {
      // Edge Function not deployed or network error → fall back
      const msg = error.message || '';
      if (
        msg.includes('404') ||
        msg.includes('not found') ||
        msg.includes('Failed to send') ||
        msg.includes('FunctionsHttpError') ||
        msg.includes('FunctionsFetchError') ||
        msg.includes('non-2xx')
      ) {
        console.warn('[Admin API] Edge Function indisponível, usando signUp como fallback.');
        return await fallbackSignUp(params);
      }
      return { user: null, error: translateError(msg) };
    }

    if (data?.error) {
      return { user: null, error: translateError(data.error) };
    }

    return { user: data?.user || null, error: null };
  } catch (err: any) {
    console.warn('[Admin API] Erro ao chamar Edge Function:', err.message);
    return await fallbackSignUp(params);
  }
}

/**
 * Fallback: creates user via signUp (may hit rate limits on free plan).
 */
async function fallbackSignUp(params: CreateUserParams): Promise<CreateUserResult> {
  // Usa client isolado (supabaseAuth) para NÃO substituir a sessão do admin
  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.full_name,
        role: params.role || 'aluno',
      },
    },
  });

  if (authError) {
    return { user: null, error: translateError(authError.message) };
  }

  if (!authData.user) {
    return { user: null, error: "Erro ao criar usuário. Tente novamente." };
  }

  // Deslogar imediatamente do client isolado (não afeta o admin)
  await supabaseAuth.auth.signOut();

  // Update phone if provided (usa o client principal que ainda tem sessão admin)
  if (params.phone) {
    await supabase
      .from("profiles")
      .update({ phone: params.phone })
      .eq("user_id", authData.user.id);
  }

  return {
    user: { id: authData.user.id, email: authData.user.email || params.email },
    error: null,
  };
}

/**
 * Translates Supabase error messages to user-friendly Portuguese.
 */
function translateError(message: string): string {
  const errorMap: Record<string, string> = {
    'email rate limit exceeded':
      'Limite de envio de e-mails atingido. Vá em Supabase Dashboard → Authentication → Providers → Email e desmarque "Confirm email" para resolver.',
    'over_email_send_rate_limit':
      'Limite de envio de e-mails atingido. Desabilite "Confirm email" em Authentication → Providers → Email no Dashboard.',
    'user already registered':
      'Este e-mail já está cadastrado no sistema.',
    'a user with this email address has already been registered':
      'Este e-mail já está cadastrado no sistema.',
    'password should be at least 6 characters':
      'A senha deve ter pelo menos 6 caracteres.',
    'unable to validate email address':
      'Endereço de e-mail inválido.',
    'signup requires a valid password':
      'Informe uma senha válida.',
    'user not found':
      'Usuário não encontrado.',
    'invalid login credentials':
      'Credenciais inválidas.',
    'email not confirmed':
      'E-mail não confirmado. Desabilite "Confirm email" em Authentication → Providers → Email no Dashboard.',
  };

  const lowerMsg = message.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (lowerMsg.includes(key)) {
      return value;
    }
  }

  return message;
}
