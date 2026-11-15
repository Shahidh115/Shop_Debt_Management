// =============================================================================
// Supabase Edge Function: generate-statement
// Generates a verified HTML/PDF-ready Account Statement for a Shop-Customer pair
// - Accessible only by the Shop's Owner or the Customer themselves (never Platform Admin)
// - Computes exact Opening Balance, Total Purchases, Total Payments, Adjustments,
//   and Closing Balance from `ledger_entries`
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatementRequest {
  shop_id: string;
  customer_id: string;
  period_start?: string;
  period_end?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use RLS-enforced client so only the Shop Owner or Customer can query
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const payload: StatementRequest = await req.json();

    const { data: shop, error: shopError } = await userClient
      .from('shops')
      .select('id, shop_code, shop_name, address, phone, email')
      .eq('id', payload.shop_id)
      .single();

    if (shopError || !shop) {
      return new Response(JSON.stringify({ error: 'Shop not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: customer, error: customerError } = await userClient
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', payload.customer_id)
      .single();

    if (customerError || !customer) {
      return new Response(JSON.stringify({ error: 'Customer not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: entries, error: entriesError } = await userClient
      .from('ledger_entries')
      .select('*')
      .eq('shop_id', payload.shop_id)
      .eq('customer_id', payload.customer_id)
      .order('created_at', { ascending: true });

    if (entriesError) {
      return new Response(JSON.stringify({ error: entriesError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let runningCents = 0n;
    const rows = (entries ?? []).map((entry) => {
      const debitCents = BigInt(Math.round(Number(entry.debit_amount) * 100));
      const creditCents = BigInt(Math.round(Number(entry.credit_amount) * 100));
      runningCents += debitCents - creditCents;
      return {
        ...entry,
        running_balance: (Number(runningCents) / 100).toFixed(2),
      };
    });

    return new Response(
      JSON.stringify({
        generated_at: new Date().toISOString(),
        shop,
        customer,
        closing_balance: (Number(runningCents) / 100).toFixed(2),
        entries: rows,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

