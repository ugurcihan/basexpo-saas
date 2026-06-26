"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function sendNotification(params: {
  eventId: string;
  targetType: "exhibitors" | "visitors" | "both";
  type: "announcement" | "reminder" | "alert";
  title: string;
  body: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const recipientIds: string[] = [];

  if (params.targetType === "exhibitors" || params.targetType === "both") {
    const { data: exhibitors } = await supabase
      .from("exhibitors")
      .select("owner_id")
      .eq("event_id", params.eventId);
    (exhibitors ?? []).forEach((ex) => {
      if (ex.owner_id && ex.owner_id !== user.id) recipientIds.push(ex.owner_id);
    });
  }

  if (params.targetType === "visitors" || params.targetType === "both") {
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select("visitor_id")
      .eq("event_id", params.eventId);
    (registrations ?? []).forEach((r) => {
      if (r.visitor_id && !recipientIds.includes(r.visitor_id)) recipientIds.push(r.visitor_id);
    });
  }

  if (recipientIds.length === 0) return { error: "Bu fuarda hedef alacak kişi bulunamadı." };

  const rows = recipientIds.map((id) => ({
    recipient_id: id,
    sender_id: user.id,
    event_id: params.eventId,
    type: params.type,
    title: params.title,
    body: params.body,
  }));

  const { error } = await supabase.from("notifications").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/organizer/messages");
  return { success: true, count: recipientIds.length };
}

export async function sendAIInsightNotification(
  eventId: string,
  insightText: string,
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase.from("notifications").insert({
    recipient_id: user.id,
    sender_id: user.id,
    event_id: eventId,
    type: "announcement",
    title: "AI Öngörüsü",
    body: insightText,
  });

  if (error) return { error: error.message };
  revalidatePath("/organizer/reports");
  return { error: null };
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  revalidatePath("/exhibitor/messages");
  revalidatePath("/visitor/upcoming-fairs");
}

export async function markAllRead() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user.id).eq("is_read", false);
  revalidatePath("/exhibitor/messages");
  revalidatePath("/visitor/upcoming-fairs");
}

export async function getMyNotifications() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, is_read, created_at, event:events(id, name), sender:profiles!notifications_sender_id_fkey(full_name)")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export async function getUnreadCount() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

export async function getSentNotifications(limit = 20) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, created_at, event:events(name)")
    .eq("sender_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Gönderilen bildirim grubunu (aynı title + event + created_at yakın olanlar) tekil göster
  const seen = new Set<string>();
  return (data ?? []).filter((n) => {
    const key = `${n.title}|${(n.event as unknown as { name: string } | null)?.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
