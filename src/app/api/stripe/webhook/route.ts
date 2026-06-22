import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const adminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const exhibitorId = session.metadata?.exhibitor_id;
    if (!exhibitorId) return NextResponse.json({ received: true });

    const supabase = adminClient();
    await supabase
      .from("exhibitors")
      .update({
        paid_at: new Date().toISOString(),
        stripe_payment_id: session.payment_intent as string,
        booth_fee_cents: session.amount_total ?? 0,
      })
      .eq("id", exhibitorId);
  }

  return NextResponse.json({ received: true });
}

// Raw body needed for Stripe signature verification
export const runtime = "nodejs";
