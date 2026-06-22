"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function getExhibitorByToken(token: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exhibitors")
    .select(`
      id, company_name, description, logo_url, tags, qr_token,
      event:events(id, name, location, start_date, end_date),
      products(id, name, description, image_url)
    `)
    .eq("qr_token", token)
    .single();
  return data;
}

export async function checkExistingLead(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("leads")
    .select("id")
    .eq("exhibitor_id", exhibitorId)
    .eq("visitor_id", user.id)
    .maybeSingle();

  return !!data;
}

export async function createLeadFromScan(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "login_required" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "visitor") return { error: "visitor_only" };

  const { error } = await supabase.from("leads").insert({
    exhibitor_id: exhibitorId,
    visitor_id: user.id,
    source: "qr",
  });

  if (error) {
    if (error.code === "23505") return { error: null, alreadyExists: true };
    return { error: error.message };
  }

  // Heatmap için ayrıca qr_scans'a kayıt at (booth_id + event_id'yi exhibitor'dan çek)
  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("event_id, booths:booths(id)")
    .eq("id", exhibitorId)
    .single();

  if (exhibitor) {
    const boothId = (exhibitor.booths as { id: string }[] | null)?.[0]?.id ?? null;
    await supabase.from("qr_scans").insert({
      exhibitor_id: exhibitorId,
      booth_id: boothId,
      visitor_id: user.id,
      event_id: exhibitor.event_id,
    });
  }

  revalidatePath("/visitor");
  revalidatePath("/exhibitor/leads");
  revalidatePath("/organizer/booth-tracking");
  return { error: null, alreadyExists: false };
}

export async function getExhibitorLeads(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("leads")
    .select(`
      id, source, score, note, created_at,
      visitor:profiles!leads_visitor_id_fkey(id, full_name, email, interests, avatar_url)
    `)
    .eq("exhibitor_id", exhibitorId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getVisitorLeads() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("leads")
    .select(`
      id, source, created_at,
      exhibitor:exhibitors(id, company_name, logo_url, tags,
        event:events(name, location)
      )
    `)
    .eq("visitor_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
