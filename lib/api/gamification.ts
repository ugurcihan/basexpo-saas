import { supabase } from "@/lib/supabase";

const EDGE_BASE = "https://kskohdijsrurlsmxioug.supabase.co/functions/v1";

// ── Fuar kutu durumu ─────────────────────────────────────────

export type FairBoxStatus =
  | "not_registered"   // fuara kayıtlı değil
  | "no_boxes"         // fuar var ama organizatör kutu tanımlamamış
  | "locked"           // kayıtlı ama henüz check-in yok
  | "active";          // check-in yapıldı + kutular mevcut

export type FairWithBoxInfo = {
  event_id: string;
  event_name: string;
  event_start: string;
  event_end: string;
  event_location: string | null;
  status: FairBoxStatus;
  unopened_boxes: number;
  total_points: number;
  box_types: { tier: string; name: string; points_required: number }[];
};

export async function getMyFairsWithBoxInfo(): Promise<FairWithBoxInfo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Kullanıcının kayıtlı olduğu fuarlar
  const { data: regs } = await supabase
    .from("event_registrations")
    .select("event_id, events(id, name, starts_at, ends_at, location)")
    .eq("visitor_id", user.id);

  if (!regs?.length) return [];

  const eventIds = regs.map(r => r.event_id);

  // Paralel sorgular
  const [checkinRes, boxTypeRes, boxesRes, pointsRes] = await Promise.all([
    supabase
      .from("fair_checkins")
      .select("event_id")
      .eq("visitor_id", user.id)
      .in("event_id", eventIds),
    supabase
      .from("loot_box_types")
      .select("event_id, tier, name, points_required")
      .in("event_id", eventIds),
    supabase
      .from("user_loot_boxes")
      .select("event_id")
      .eq("user_id", user.id)
      .is("opened_at", null)
      .in("event_id", eventIds),
    supabase
      .from("loyalty_points")
      .select("event_id, points")
      .eq("visitor_id", user.id)
      .in("event_id", eventIds),
  ]);

  const checkedInEvents = new Set((checkinRes.data ?? []).map(c => c.event_id));
  const boxTypesByEvent = new Map<string, { tier: string; name: string; points_required: number }[]>();
  for (const bt of (boxTypeRes.data ?? [])) {
    const arr = boxTypesByEvent.get(bt.event_id) ?? [];
    arr.push({ tier: bt.tier, name: bt.name, points_required: bt.points_required });
    boxTypesByEvent.set(bt.event_id, arr);
  }
  const unopenedByEvent = new Map<string, number>();
  for (const b of (boxesRes.data ?? [])) {
    unopenedByEvent.set(b.event_id, (unopenedByEvent.get(b.event_id) ?? 0) + 1);
  }
  const pointsByEvent = new Map<string, number>();
  for (const p of (pointsRes.data ?? [])) {
    pointsByEvent.set(p.event_id, (pointsByEvent.get(p.event_id) ?? 0) + p.points);
  }

  return regs.map(reg => {
    const ev = Array.isArray(reg.events) ? reg.events[0] : reg.events;
    const hasBoxTypes = (boxTypesByEvent.get(reg.event_id)?.length ?? 0) > 0;
    const checkedIn   = checkedInEvents.has(reg.event_id);

    let status: FairBoxStatus;
    if (!hasBoxTypes)   status = "no_boxes";
    else if (!checkedIn) status = "locked";
    else                 status = "active";

    return {
      event_id:       reg.event_id,
      event_name:     ev?.name ?? "Fuar",
      event_start:    ev?.starts_at ?? "",
      event_end:      ev?.ends_at ?? "",
      event_location: ev?.location ?? null,
      status,
      unopened_boxes: unopenedByEvent.get(reg.event_id) ?? 0,
      total_points:   pointsByEvent.get(reg.event_id) ?? 0,
      box_types:      boxTypesByEvent.get(reg.event_id) ?? [],
    };
  });
}

async function callEdge(path: string, body: object) {
  const session = (await supabase.auth.getSession()).data.session;
  const res = await fetch(`${EDGE_BASE}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function earnPoints(params: {
  event_id: string;
  activity_type: string;
  exhibitor_id?: string;
}) {
  return callEdge("earn-points", params);
}

export async function openBox(box_id: string) {
  return callEdge("open-box", { box_id });
}

export async function getMyBoxes(event_id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("user_loot_boxes")
    .select("*, loot_box_types(name, tier)")
    .eq("user_id", user.id)
    .eq("event_id", event_id)
    .is("opened_at", null)
    .order("earned_at", { ascending: false });
  return data ?? [];
}

export async function getMyPoints(event_id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase
    .from("loyalty_points")
    .select("points")
    .eq("visitor_id", user.id)
    .eq("event_id", event_id);
  return data?.reduce((s, r) => s + r.points, 0) ?? 0;
}

export type LeaderboardType = "fair" | "turkey" | "world";

export async function getLeaderboard(type: LeaderboardType, event_id?: string) {
  if (type === "fair" && event_id) {
    const { data } = await supabase
      .from("v_fair_leaderboard")
      .select("user_id, full_name, avatar_url, points, rank")
      .eq("event_id", event_id)
      .order("rank")
      .limit(100);
    return data ?? [];
  }
  if (type === "turkey") {
    const { data } = await supabase
      .from("v_turkey_leaderboard")
      .select("user_id, full_name, avatar_url, city, points, rank")
      .order("rank")
      .limit(100);
    return data ?? [];
  }
  const { data } = await supabase
    .from("v_world_leaderboard")
    .select("user_id, full_name, avatar_url, country_code, city, points, rank")
    .order("rank")
    .limit(100);
  return data ?? [];
}
