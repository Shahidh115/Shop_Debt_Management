// =============================================================================
// Supabase Edge Function: owner-invite-customer
// Multi-Shop Customer Invitation & Linking Flow (Phase 4 & Phase 7.2)
// - Verifies caller is an active `shop_owner` for the target `shop_id`
// - Checks if a customer profile already exists with the email:
//   * If exists -> links existing customer to this shop in `shop_customers`
//     (1 login identity across multiple independent shops; never creates duplicate auth accounts)
//   * If new -> invites customer via Supabase Auth, creates `profiles` + `user_roles`,
//     and creates `shop_customers` relationship
// - Optionally records an atomic `opening_balance` ledger entry if opening_balance > 0
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteCustomerPayload {
  shop_id: string;
  full_name: string;
  email: string;
  phone: string;
  opening_balance?: string;
  notes?: string;
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

    const payload: InviteCustomerPayload = await req.json();
    const normalizedEmail = payload.email.trim().toLowerCase();

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Verify caller owns the target shop and the shop is active
    const { data: shop } = await adminClient
      .from('shops')
      .select('id, shop_name, shop_code, owner_id, status')
      .eq('id', payload.shop_id)
      .maybeSingle();

    if (!shop || shop.owner_id !== caller.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this shop.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (shop.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Suspended shops cannot invite or link customers.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if customer already has a ShopLedger account
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, full_name, email, phone, status')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    let customerId: string;
    let isExistingPlatformCustomer = false;

    if (existingProfile) {
      customerId = existingProfile.id;
      isExistingPlatformCustomer = true;
    } else {
      const { data: invitedAuth, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
          data: {
            full_name: payload.full_name.trim(),
            phone: payload.phone.trim(),
            invited_role: 'customer',
            invited_by_shop: shop.shop_name,
          },
        });

      if (inviteError || !invitedAuth.user) {
        return new Response(
          JSON.stringify({ error: inviteError?.message ?? 'Failed to invite customer' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      customerId = invitedAuth.user.id;

      await adminClient.from('profiles').upsert({
        id: customerId,
        full_name: payload.full_name.trim(),
        email: normalizedEmail,
        phone: payload.phone.trim(),
        status: 'active',
      });
    }

    // 3. Ensure `customer` role exists
    await adminClient.from('user_roles').upsert(
      {
        user_id: customerId,
        role: 'customer',
      },
      { onConflict: 'user_id,role' }
    );

    // 4. Prevent duplicate shop-customer link
    const { data: existingLink } = await adminClient
      .from('shop_customers')
      .select('id')
      .eq('shop_id', shop.id)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (existingLink) {
      return new Response(
        JSON.stringify({ error: 'This customer is already linked to your shop.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Create shop_customers link
    const { data: shopCustomer, error: linkError } = await adminClient
      .from('shop_customers')
      .insert({
        shop_id: shop.id,
        customer_id: customerId,
        status: isExistingPlatformCustomer ? 'active' : 'pending_invitation',
        joined_at: isExistingPlatformCustomer ? new Date().toISOString() : null,
      })
      .select('*')
      .single();

    if (linkError || !shopCustomer) {
      return new Response(
        JSON.stringify({ error: linkError?.message ?? 'Failed to link customer to shop' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Optional Opening Balance Ledger Entry
    const openingBalanceAmount = Number(payload.opening_balance ?? '0');
    if (openingBalanceAmount > 0) {
      await adminClient.from('ledger_entries').insert({
        shop_id: shop.id,
        customer_id: customerId,
        transaction_type: 'opening_balance',
        reference_id: null,
        debit_amount: openingBalanceAmount.toFixed(2),
        credit_amount: '0.00',
        description: payload.notes?.trim()
          ? `Opening balance — ${payload.notes.trim()}`
          : 'Opening balance',
        created_by: caller.id,
      });
    }

    // 7. Record Audit Log
    await adminClient.from('audit_logs').insert({
      shop_id: shop.id,
      user_id: caller.id,
      actor_name: caller.user_metadata?.full_name ?? caller.email ?? 'Shop Owner',
      actor_email: caller.email ?? null,
      action: isExistingPlatformCustomer
        ? 'Existing customer linked to shop'
        : 'New customer invited to shop',
      entity_type: 'shop_customer',
      entity_id: shopCustomer.id,
      target_label: `${payload.full_name} (${normalizedEmail})`,
      new_values: {
        customer_id: customerId,
        is_existing_platform_customer: isExistingPlatformCustomer,
        opening_balance: openingBalanceAmount.toFixed(2),
      },
    });

    return new Response(
      JSON.stringify({
        shop_customer: shopCustomer,
        customer_id: customerId,
        is_existing_platform_customer: isExistingPlatformCustomer,
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

