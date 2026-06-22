import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createSupabaseServerClient, getProfile } from "@/lib/supabase-server";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, eventId, url } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // Get push subscriptions of all registered visitors for this event (or all if no eventId)
  let subsQuery = supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  if (eventId) {
    // Only notify visitors registered for this event
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("visitor_id")
      .eq("event_id", eventId);

    const visitorIds = registrations?.map((r) => r.visitor_id) ?? [];
    if (visitorIds.length > 0) {
      subsQuery = subsQuery.in("user_id", visitorIds);
    }
  }

  const { data: subscriptions, error } = await subsQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0, message: "No subscribers" });
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/favicon-32x32.png",
    url: url ?? "/visitor",
    timestamp: Date.now(),
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;

  return NextResponse.json({ sent, failed });
}
