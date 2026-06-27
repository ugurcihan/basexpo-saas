"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function getMyExhibitorProfile() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("exhibitors")
    .select("*, event:events(id,name,location,start_date,end_date)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getAvailableEvents() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select("id, name, location, start_date, end_date")
    .in("status", ["published", "active"])
    .order("start_date", { ascending: true });
  return data ?? [];
}

export async function createExhibitorProfile(input: {
  event_id: string;
  company_name: string;
  description: string;
  logo_url: string | null;
  tags: string[];
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase.from("exhibitors").insert({
    ...input,
    owner_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return { error: "Bu fuara zaten kayıtlısın" };
    return { error: error.message };
  }

  revalidatePath("/exhibitor");
  revalidatePath("/exhibitor/profile");
  return { error: null };
}

export async function updateExhibitorProfile(input: {
  id: string;
  company_name: string;
  description: string;
  logo_url: string | null;
  tags: string[];
  website?: string | null;
  phone?: string | null;
  city?: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("exhibitors")
    .update({
      company_name: input.company_name,
      description: input.description,
      logo_url: input.logo_url,
      tags: input.tags,
      website: input.website ?? null,
      phone: input.phone ?? null,
      city: input.city ?? null,
    })
    .eq("id", input.id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/exhibitor");
  revalidatePath("/exhibitor/profile");
  return { error: null };
}

export async function getExhibitorProducts(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("exhibitor_id", exhibitorId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function createProduct(input: {
  exhibitor_id: string;
  name: string;
  description: string;
  image_url: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id")
    .eq("id", input.exhibitor_id)
    .eq("owner_id", user.id)
    .single();

  if (!exhibitor) return { error: "Yetki yok" };

  const { error } = await supabase.from("products").insert(input);
  if (error) return { error: error.message };

  revalidatePath("/exhibitor/products");
  return { error: null };
}

export async function getExhibitorDashboardStats() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id, event:events(end_date)")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!exhibitor) return null;
  const exhibitorId = exhibitor.id;

  const [
    { data: leads },
    { data: matchScores },
    { count: scanCount },
    { data: conversions },
  ] = await Promise.all([
    supabase.from("leads").select("score, visitor_id").eq("exhibitor_id", exhibitorId),
    supabase.from("match_scores").select("score").eq("exhibitor_id", exhibitorId).limit(100),
    supabase.from("qr_scans").select("*", { count: "exact", head: true }).eq("exhibitor_id", exhibitorId),
    supabase.from("lead_conversions").select("visitor_id, deal_status").eq("exhibitor_id", exhibitorId),
  ]);

  const leadCount = leads?.length ?? 0;
  const avgLeadScore = leadCount
    ? Math.round(leads!.reduce((a, l) => a + ((l.score as number) || 0), 0) / leadCount)
    : null;
  const avgMatchScore = matchScores?.length
    ? Math.round(matchScores.reduce((a, m) => a + (m.score as number), 0) / matchScores.length)
    : null;

  const calledVisitorIds = new Set(
    (conversions ?? []).filter(c => c.deal_status !== "lead").map(c => c.visitor_id),
  );
  const uncalledCount = (leads ?? []).filter(l => !calledVisitorIds.has(l.visitor_id)).length;

  const ev = exhibitor.event as { end_date: string } | { end_date: string }[] | null;
  const eventEndDate = Array.isArray(ev) ? (ev[0]?.end_date ?? null) : (ev?.end_date ?? null);
  const fairEnded = eventEndDate ? new Date(eventEndDate) < new Date() : false;

  return { leadCount, scanCount: scanCount ?? 0, avgLeadScore, avgMatchScore, uncalledCount, fairEnded };
}

export async function deleteProduct(productId: string, exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id")
    .eq("id", exhibitorId)
    .eq("owner_id", user.id)
    .single();

  if (!exhibitor) return { error: "Yetki yok" };

  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/exhibitor/products");
  return { error: null };
}
