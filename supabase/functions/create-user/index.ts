// Edge Function: create-user
// Creates users via admin API (no email confirmation, no rate limits)
// Deploy: supabase functions deploy create-user
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // 1. Verify calling user is admin/secretaria
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização ausente' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller } } = await userClient.auth.getUser()
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if calling user has admin, secretaria, or super_admin role
    const { data: roles } = await userClient.rpc('get_user_roles', { _user_id: caller.id })
    const isSuperAdmin = roles?.includes('super_admin')
    const isAuthorized = isSuperAdmin || roles?.includes('admin') || roles?.includes('secretaria')
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Permissão insuficiente. Apenas administradores podem criar usuários.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse request body
    const { email, password, full_name, role, phone, institution_id } = await req.json()

    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: email, password, full_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine institution_id: super_admin can specify any, others use their own
    let targetInstitutionId = institution_id
    if (!isSuperAdmin) {
      const { data: callerProfile } = await userClient
        .from('profiles')
        .select('institution_id')
        .eq('user_id', caller.id)
        .single()
      targetInstitutionId = callerProfile?.institution_id
    }

    // 3. Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 4. Create user via admin API (auto-confirmed, no email sent)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm - no verification email
      user_metadata: {
        full_name,
        role: role || 'aluno',
        institution_id: targetInstitutionId || undefined,
      },
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Update phone if provided
    if (phone && newUser.user) {
      await adminClient
        .from('profiles')
        .update({ phone })
        .eq('user_id', newUser.user.id)
    }

    return new Response(
      JSON.stringify({ user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
