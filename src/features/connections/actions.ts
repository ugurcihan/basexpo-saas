"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface VisitorProfile {
  id: string;
  full_name: string;
  email: string;
  interests: string[];
  avatar_url: string | null;
}

export interface ConnectionRow {
  id: string;
  from_user: string;
  to_user: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  other: VisitorProfile;
}

export interface MeetingRow {
  id: string;
  from_user: string;
  to_user: string;
  proposed_at: string;
  location: string;
  note: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  other: VisitorProfile;
}

// ─── CONNECTIONS ──────────────────────────────────────────────

export async function getMyConnections() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { incoming: [], outgoing: [], accepted: [] };

  const { data } = await supabase
    .from("connections")
    .select(`
      id, from_user, to_user, status, created_at,
      from_profile:profiles!connections_from_user_fkey(id, full_name, email, interests, avatar_url),
      to_profile:profiles!connections_to_user_fkey(id, full_name, email, interests, avatar_url)
    `)
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Array<{
    id: string;
    from_user: string;
    to_user: string;
    status: "pending" | "accepted" | "rejected";
    created_at: string;
    from_profile: VisitorProfile | VisitorProfile[];
    to_profile: VisitorProfile | VisitorProfile[];
  }>;

  const normalize = (v: VisitorProfile | VisitorProfile[]): VisitorProfile =>
    Array.isArray(v) ? v[0] : v;

  const incoming: ConnectionRow[] = [];
  const outgoing: ConnectionRow[] = [];
  const accepted: ConnectionRow[] = [];

  for (const row of rows) {
    const other =
      row.from_user === user.id
        ? normalize(row.to_profile)
        : normalize(row.from_profile);

    const conn: ConnectionRow = {
      id: row.id,
      from_user: row.from_user,
      to_user: row.to_user,
      status: row.status,
      created_at: row.created_at,
      other,
    };

    if (row.status === "accepted") {
      accepted.push(conn);
    } else if (row.status === "pending") {
      if (row.to_user === user.id) incoming.push(conn);
      else outgoing.push(conn);
    }
  }

  return { incoming, outgoing, accepted };
}

export async function discoverVisitors(): Promise<VisitorProfile[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get IDs of already-connected users
  const { data: conns } = await supabase
    .from("connections")
    .select("from_user, to_user")
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`);

  const connectedIds = new Set<string>();
  (conns ?? []).forEach((c) => {
    connectedIds.add(c.from_user);
    connectedIds.add(c.to_user);
  });
  connectedIds.add(user.id);

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, interests, avatar_url")
    .eq("role", "visitor")
    .limit(50);

  return (data ?? []).filter((p) => !connectedIds.has(p.id)) as VisitorProfile[];
}

export async function sendConnectionRequest(toUserId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase.from("connections").insert({
    from_user: user.id,
    to_user: toUserId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Zaten istek gönderildi" };
    return { error: error.message };
  }

  revalidatePath("/visitor/connections");
  return { error: null };
}

export async function acceptConnection(connectionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .eq("to_user", user.id);

  if (error) return { error: error.message };
  revalidatePath("/visitor/connections");
  return { error: null };
}

export async function rejectConnection(connectionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("connections")
    .update({ status: "rejected" })
    .eq("id", connectionId)
    .eq("to_user", user.id);

  if (error) return { error: error.message };
  revalidatePath("/visitor/connections");
  return { error: null };
}

// ─── MEETINGS ─────────────────────────────────────────────────

export async function getMyMeetings(): Promise<MeetingRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("meetings")
    .select(`
      id, from_user, to_user, proposed_at, location, note, status, created_at,
      from_profile:profiles!meetings_from_user_fkey(id, full_name, email, interests, avatar_url),
      to_profile:profiles!meetings_to_user_fkey(id, full_name, email, interests, avatar_url)
    `)
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order("proposed_at", { ascending: true });

  const rows = data ?? [];

  const normalize = (v: VisitorProfile | VisitorProfile[]): VisitorProfile =>
    Array.isArray(v) ? v[0] : v;

  return rows.map((row: {
    id: string; from_user: string; to_user: string;
    proposed_at: string; location: string; note: string | null;
    status: "pending" | "accepted" | "declined"; created_at: string;
    from_profile: VisitorProfile | VisitorProfile[];
    to_profile: VisitorProfile | VisitorProfile[];
  }) => ({
    ...row,
    other:
      row.from_user === user.id
        ? normalize(row.to_profile)
        : normalize(row.from_profile),
  })) as MeetingRow[];
}

export async function requestMeeting(input: {
  to_user: string;
  proposed_at: string;
  location: string;
  note?: string;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase.from("meetings").insert({
    from_user: user.id,
    to_user: input.to_user,
    proposed_at: input.proposed_at,
    location: input.location,
    note: input.note ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/visitor/meetings");
  return { error: null };
}

export async function respondToMeeting(meetingId: string, status: "accepted" | "declined") {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("meetings")
    .update({ status })
    .eq("id", meetingId)
    .eq("to_user", user.id);

  if (error) return { error: error.message };
  revalidatePath("/visitor/meetings");
  return { error: null };
}
