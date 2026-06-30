import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// RevenueCat event types we care about
const ACTIVE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
]);

const INACTIVE_EVENTS = new Set([
  'CANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
  'SUBSCRIBER_ALIAS',
]);

// Maps RC product identifier → plan_name in Supabase
const PRODUCT_TO_PLAN: Record<string, string> = {
  pro_monthly:      'pro',
  pro_yearly:       'pro',
  pro_plus_monthly: 'pro_plus',
  pro_plus_yearly:  'pro_plus',
};

serve(async (req) => {
  // Verify the RevenueCat webhook authorization header
  const authHeader = req.headers.get('Authorization');
  const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');

  if (webhookSecret && authHeader !== webhookSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = body?.event;
  if (!event) {
    return new Response('No event', { status: 400 });
  }

  const eventType: string = event.type ?? '';
  const appUserId: string = event.app_user_id ?? '';
  const productId: string = event.product_id ?? '';
  const expiresAt: string | null = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  if (!appUserId) {
    return new Response('No app_user_id', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (ACTIVE_EVENTS.has(eventType)) {
    const planName = PRODUCT_TO_PLAN[productId] ?? 'pro';

    await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id:            appUserId,
          plan_name:          planName,
          status:             'active',
          revenuecat_customer_id: appUserId,
          current_product_id: productId,
          expires_at:         expiresAt,
          updated_at:         new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

  } else if (INACTIVE_EVENTS.has(eventType)) {
    await supabase
      .from('subscriptions')
      .update({
        plan_name:  'free',
        status:     'inactive',
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', appUserId);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
