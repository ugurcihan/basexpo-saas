import { supabase } from "@/lib/supabase";

const EVENT_REGISTER_URL = "https://basexpo.site/api/mobile/event-register";

export type RegistrationStatus = "confirmed" | "pending_approval" | "waitlisted";

export type RegistrationRow = {
  id: string;
  status: RegistrationStatus;
  ticket_code: string | null;
  created_at: string;
  event: {
    id: string;
    name: string;
    location: string;
    start_date: string;
    end_date: string;
    cover_url: string | null;
  } | null;
};

export async function fetchMyRegistrations(userId: string): Promise<RegistrationRow[]> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, status, ticket_code, created_at, event:events(id, name, location, start_date, end_date, cover_url)")
    .eq("visitor_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchMyRegistrations error:", error.message);
    return [];
  }
  return ((data ?? []) as unknown) as RegistrationRow[];
}

export async function checkMyRegistration(
  userId: string,
  eventId: string
): Promise<{ status: RegistrationStatus; ticket_code: string | null } | null> {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("status, ticket_code")
    .eq("visitor_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) return null;
  return data as { status: RegistrationStatus; ticket_code: string | null };
}

export async function registerForEvent(
  eventId: string,
  accessToken: string
): Promise<{ status: RegistrationStatus; ticket_code: string | null; registration_id: string; already_registered?: boolean } | { error: string }> {
  try {
    const res = await fetch(EVENT_REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ eventId }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      return { error: data.error ?? "Kayıt oluşturulamadı." };
    }
    return data;
  } catch {
    return { error: "Sunucuya bağlanılamadı." };
  }
}
