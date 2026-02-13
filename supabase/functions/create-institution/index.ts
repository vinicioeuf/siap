// Edge Function: create-institution
// Creates a new institution and its admin user (super_admin only)
// Deploy: supabase functions deploy create-institution
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.95.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // 1. Verify caller is super_admin
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

    const { data: roles } = await userClient.rpc('get_user_roles', { _user_id: caller.id })
    if (!roles?.includes('super_admin')) {
      return new Response(
        JSON.stringify({ error: 'Apenas Super Administradores podem criar instituições.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Parse body
    const {
      institution_name,
      institution_slug,
      institution_cnpj,
      institution_phone,
      institution_email,
      institution_address,
      plan_id,
      admin_name,
      admin_email,
      admin_password,
    } = await req.json()

    if (!institution_name || !institution_slug || !admin_email || !admin_password || !admin_name) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: institution_name, institution_slug, admin_name, admin_email, admin_password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Admin client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 4. Create institution
    const { data: institution, error: instError } = await adminClient
      .from('institutions')
      .insert({
        name: institution_name,
        slug: institution_slug,
        cnpj: institution_cnpj || null,
        phone: institution_phone || null,
        email: institution_email || null,
        address: institution_address || null,
        plan_id: plan_id || null,
        is_active: true,
      })
      .select()
      .single()

    if (instError) {
      return new Response(
        JSON.stringify({ error: `Erro ao criar instituição: ${instError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Create admin user for institution
    const { data: adminUser, error: userError } = await adminClient.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: admin_name,
        role: 'admin',
        institution_id: institution.id,
      },
    })

    if (userError) {
      // Rollback institution
      await adminClient.from('institutions').delete().eq('id', institution.id)
      return new Response(
        JSON.stringify({ error: `Erro ao criar administrador: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Create subscription if plan_id
    if (plan_id) {
      await adminClient.from('subscriptions').insert({
        institution_id: institution.id,
        plan_id,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      await adminClient.from('institutions').update({
        subscription_status: 'active',
      }).eq('id', institution.id)
    }

    return new Response(
      JSON.stringify({
        institution,
        admin: adminUser.user,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
