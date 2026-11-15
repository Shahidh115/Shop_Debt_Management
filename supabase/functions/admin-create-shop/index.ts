// =============================================================================
// Supabase Edge Function: admin-create-shop
// Trusted Server-Side Shop & Shop Owner Provisioning (Phase 4 & Phase 6)
// - Verifies caller JWT has `platform_admin` role
// - Uses SUPABASE_SERVICE_ROLE_KEY strictly on server-side
// - Creates or links Shop Owner auth user, assigns `shop_owner` role,
//   creates `shops` record, logs to `audit_logs`, and sends invitation email
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateShopPayload {
  shop_name: string;
  category?: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  owner_full_name: string;
  owner_email: string;
  owner_phone: string;
  send_invitation_email?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify caller identity using caller's JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Service role client for trusted role verification & provisioning
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: adminRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'platform_admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only platform administrators can create shops.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: CreateShopPayload = await req.json();
    if (!payload.shop_name || !payload.owner_email || !payload.owner_full_name) {
      return new Response(JSON.stringify({ error: 'Missing required shop or owner fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedOwnerEmail = payload.owner_email.trim().toLowerCase();

    // 3. Check if owner profile already exists, otherwise invite/create auth user
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', normalizedOwnerEmail)
      .maybeSingle();

    let ownerId: string;

    if (existingProfile) {
      ownerId = existingProfile.id;
    } else {
      const { data: invitedAuth, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(normalizedOwnerEmail, {
          data: {
            full_name: payload.owner_full_name.trim(),
            phone: payload.owner_phone.trim(),
            invited_role: 'shop_owner',
          },
        });

      if (inviteError || !invitedAuth.user) {
        return new Response(
          JSON.stringify({ error: inviteError?.message ?? 'Failed to provision shop owner auth account' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      ownerId = invitedAuth.user.id;

      await adminClient.from('profiles').upsert({
        id: ownerId,
        full_name: payload.owner_full_name.trim(),
        email: normalizedOwnerEmail,
        phone: payload.owner_phone.trim(),
        status: 'active',
      });
    }

    // 4. Assign shop_owner role
    await adminClient.from('user_roles').upsert(
      {
        user_id: ownerId,
        role: 'shop_owner',
      },
      { onConflict: 'user_id,role' }
    );

    // 5. Create Shop record
    const { data: shop, error: shopError } = await adminClient
      .from('shops')
      .insert({
        shop_name: payload.shop_name.trim(),
        category: payload.category?.trim() || 'Grocery & provisions',
        owner_id: ownerId,
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        address: payload.address.trim(),
        city: payload.city?.trim() || 'Colombo',
        status: 'active',
      })
      .select('*')
      .single();

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: shopError?.message ?? 'Failed to create shop record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Record Audit Log
    await adminClient.from('audit_logs').insert({
      shop_id: shop.id,
      user_id: caller.id,
      actor_name: caller.user_metadata?.full_name ?? caller.email ?? 'Platform Admin',
      actor_email: caller.email ?? null,
      action: 'Shop created & owner invited',
      entity_type: 'shop',
      entity_id: shop.id,
      target_label: `${shop.shop_name} (${shop.shop_code})`,
      new_values: {
        shop_id: shop.id,
        shop_code: shop.shop_code,
        shop_name: shop.shop_name,
        owner_id: ownerId,
        owner_email: normalizedOwnerEmail,
      },
    });

    return new Response(
      JSON.stringify({
        shop,
        owner_id: ownerId,
        invitation_sent: payload.send_invitation_email !== false,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

