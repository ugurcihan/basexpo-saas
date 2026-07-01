import { supabase } from "@/lib/supabase";

export type EventListItem = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity: number | null;
  requires_approval: boolean;
  cover_url: string | null;
  category: string | null;
  tags: string[] | null;
  organizer_id: string;
};

export type SponsorRow = {
  tier: number;
  tier_name: string | null;
  exhibitor: { company_name: string; logo_url: string | null } | null;
};

export type RewardTierRow = {
  points_required: number;
  reward_title: string;
  reward_description: string | null;
};

export type ExhibitorRow = {
  id: string;
  company_name: string;
  logo_url: string | null;
  tags: string[] | null;
};

export type OrganizerInfo = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type EventDetail = EventListItem & {
  gallery_urls: string[] | null;
  maps_url: string | null;
  youtube_url: string | null;
  social_links: {
    website?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  } | null;
  organizer: OrganizerInfo | null;
  sponsors: SponsorRow[];
  reward_tiers: RewardTierRow[];
  exhibitors: ExhibitorRow[];
};

const CATEGORIES = ["Teknoloji", "Gıda", "Tekstil", "İnşaat", "Savunma", "Tarım", "Enerji", "Sağlık"];

export async function fetchPublishedEvents(category?: string | null): Promise<EventListItem[]> {
  let query = supabase
    .from("events")
    .select("id, name, description, location, start_date, end_date, status, capacity, requires_approval, cover_url, category, tags, organizer_id")
    .in("status", ["published", "active"])
    .order("start_date", { ascending: true })
    .limit(30);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    console.error("fetchPublishedEvents error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function fetchEventDetail(eventId: string): Promise<EventDetail | null> {
  const { data, error } = await supabase
    .from("events")
    .select(`
      id, name, description, location, start_date, end_date, status,
      capacity, requires_approval, cover_url, gallery_urls, maps_url,
      youtube_url, social_links, tags, category, organizer_id,
      sponsors:event_sponsors(tier, tier_name, exhibitor:exhibitors(company_name, logo_url)),
      reward_tiers(points_required, reward_title, reward_description),
      exhibitors(id, company_name, logo_url, tags)
    `)
    .eq("id", eventId)
    .single();

  if (error || !data) {
    console.error("fetchEventDetail error:", error?.message);
    return null;
  }

  const organizer = await fetchOrganizerInfo(data.organizer_id);

  return {
    ...data,
    organizer,
    sponsors: ((data.sponsors as unknown) as SponsorRow[]) ?? [],
    reward_tiers: ((data.reward_tiers as unknown) as RewardTierRow[]) ?? [],
    exhibitors: ((data.exhibitors as unknown) as ExhibitorRow[]) ?? [],
  } as EventDetail;
}

export async function fetchOrganizerInfo(organizerId: string): Promise<OrganizerInfo | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", organizerId)
    .single();
  if (error || !data) return null;
  return data as OrganizerInfo;
}

export async function fetchOrganizerProfile(organizerId: string): Promise<{
  profile: OrganizerInfo | null;
  events: EventListItem[];
}> {
  const [profileRes, eventsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").eq("id", organizerId).single(),
    supabase
      .from("events")
      .select("id, name, description, location, start_date, end_date, status, capacity, requires_approval, cover_url, category, tags, organizer_id")
      .eq("organizer_id", organizerId)
      .in("status", ["published", "active", "ended"])
      .order("start_date", { ascending: false })
      .limit(20),
  ]);

  return {
    profile: profileRes.data as OrganizerInfo | null,
    events: (eventsRes.data as EventListItem[]) ?? [],
  };
}

export { CATEGORIES };
