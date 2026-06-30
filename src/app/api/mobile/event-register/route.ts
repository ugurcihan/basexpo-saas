import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "Yetkilendirme token'ı eksik." }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Geçersiz oturum." }, { status: 401 });
    }

    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "eventId zorunlu." }, { status: 400 });
    }

    const { data: event, error: eventErr } = await adminClient
      .from("events")
      .select("id, status, capacity, requires_approval")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Etkinlik bulunamadı." }, { status: 404 });
    }

    if (!["published", "active"].includes(event.status)) {
      return NextResponse.json({ error: "Bu etkinliğe kayıt açık değil." }, { status: 400 });
    }

    const { data: existing } = await adminClient
      .from("event_registrations")
      .select("id, status, ticket_code")
      .eq("event_id", eventId)
      .eq("visitor_id", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        status: existing.status,
        ticket_code: existing.ticket_code,
        registration_id: existing.id,
        already_registered: true,
      });
    }

    let regStatus: string;
    let ticketCode: string | null = null;

    if (event.requires_approval) {
      regStatus = "pending_approval";
    } else if (event.capacity !== null && event.capacity <= 0) {
      regStatus = "waitlisted";
    } else {
      regStatus = "confirmed";
      ticketCode = Math.random().toString(36).substring(2, 12).toUpperCase();
    }

    const { data: inserted, error: insertErr } = await adminClient
      .from("event_registrations")
      .insert({
        event_id: eventId,
        visitor_id: user.id,
        status: regStatus,
        ticket_code: ticketCode,
        kvkk_consent: true,
      })
      .select("id")
      .single();

    if (insertErr) {
      return NextResponse.json({ error: "Kayıt oluşturulamadı: " + insertErr.message }, { status: 500 });
    }

    if (regStatus === "confirmed" && event.capacity !== null && event.capacity > 0) {
      await adminClient
        .from("events")
        .update({ capacity: event.capacity - 1 })
        .eq("id", eventId);
    }

    return NextResponse.json({
      status: regStatus,
      ticket_code: ticketCode,
      registration_id: inserted.id,
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
