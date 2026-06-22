import { NextRequest, NextResponse } from "next/server";
import { getStripe, BOOTH_FEE_CENTS, BOOTH_FEE_CURRENCY } from "@/lib/stripe";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exhibitorId, eventName } = await req.json();
  if (!exhibitorId) return NextResponse.json({ error: "exhibitorId required" }, { status: 400 });

  // Verify ownership
  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id, company_name, owner_id, paid_at")
    .eq("id", exhibitorId)
    .single();

  if (!exhibitor || exhibitor.owner_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (exhibitor.paid_at) {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  const stripe = getStripe();
  const origin = req.headers.get("origin") || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: BOOTH_FEE_CURRENCY,
          unit_amount: BOOTH_FEE_CENTS,
          product_data: {
            name: `${exhibitor.company_name} — Stand Aktivasyonu`,
            description: eventName
              ? `${eventName} fuarı için stand aktivasyon ücreti`
              : "Stand aktivasyon ücreti",
            images: [],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      exhibitor_id: exhibitorId,
      user_id: user.id,
    },
    success_url: `${origin}/exhibitor/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/exhibitor/payment/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
