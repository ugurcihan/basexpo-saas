"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createEmbedding } from "@/lib/openai";
import { revalidatePath } from "next/cache";

export async function updateVisitorInterests(interests: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("profiles")
    .update({ interests })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/visitor/recommendations");
  return { error: null };
}

export async function generateVisitorEmbedding() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("interests, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profil bulunamadı" };
  if (!profile.interests || profile.interests.length === 0) {
    return { error: "Önce ilgi alanlarını gir" };
  }

  const text = `Ziyaretçi ilgi alanları: ${profile.interests.join(", ")}`;

  try {
    const embedding = await createEmbedding(text);

    const { error } = await supabase
      .from("profiles")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/visitor/recommendations");
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return { error: `AI hatası: ${msg}` };
  }
}

export async function generateExhibitorEmbedding(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id, company_name, description, tags, owner_id, products(name)")
    .eq("id", exhibitorId)
    .eq("owner_id", user.id)
    .single();

  if (!exhibitor) return { error: "Firma bulunamadı veya yetkin yok" };

  const productNames = (exhibitor.products as { name: string }[])
    .map((p) => p.name)
    .join(", ");

  const text = [
    `Firma: ${exhibitor.company_name}`,
    exhibitor.description ? `Açıklama: ${exhibitor.description}` : "",
    exhibitor.tags.length ? `Etiketler: ${exhibitor.tags.join(", ")}` : "",
    productNames ? `Ürünler: ${productNames}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const embedding = await createEmbedding(text);

    const { error } = await supabase
      .from("exhibitors")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", exhibitorId);

    if (error) return { error: error.message };
    revalidatePath("/exhibitor/profile");
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    return { error: `AI hatası: ${msg}` };
  }
}

export interface AIRecommendation {
  id: string;
  company_name: string;
  description: string;
  logo_url: string | null;
  tags: string[];
  qr_token: string;
  event_name: string;
  event_location: string;
  similarity: number;
}

export interface EventRecommendation {
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  capacity: number | null;
  requires_approval: boolean;
  cover_url: string | null;
  status: string;
}

export async function getAIEventRecommendations(): Promise<{
  events: EventRecommendation[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { events: [], error: "Giriş yapmalısın" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("interests")
    .eq("id", user.id)
    .single();

  const interests = profile?.interests ?? [];

  // Aktif/yaklaşan fuarları getir, ilgi alanlarına göre ön sırala
  const { data, error } = await supabase
    .from("events")
    .select("id, name, description, location, start_date, end_date, capacity, cover_url, status, requires_approval")
    .in("status", ["published", "active"])
    .order("start_date", { ascending: true })
    .limit(20);

  if (error) return { events: [], error: error.message };

  const events = (data ?? []) as EventRecommendation[];

  if (interests.length === 0) {
    return { events, error: null };
  }

  // İlgi alanlarına göre basit metin eşleşmesi skoru
  const scored = events.map((ev) => {
    const text = `${ev.name} ${ev.description ?? ""}`.toLowerCase();
    const score = interests.filter((tag: string) => text.includes(tag.toLowerCase())).length;
    return { ev, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return { events: scored.map((s) => s.ev), error: null };
}

export async function getAIRecommendations(): Promise<{
  recommendations: AIRecommendation[];
  error: string | null;
  hasEmbedding: boolean;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { recommendations: [], error: "Giriş yapmalısın", hasEmbedding: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("embedding")
    .eq("id", user.id)
    .single();

  if (!profile?.embedding) {
    return { recommendations: [], error: null, hasEmbedding: false };
  }

  const { data, error } = await supabase.rpc("match_exhibitors", {
    query_embedding: profile.embedding as unknown as number[],
    match_count: 10,
    min_score: 0.2,
  });

  if (error) return { recommendations: [], error: error.message, hasEmbedding: true };

  return {
    recommendations: (data as AIRecommendation[]) ?? [],
    error: null,
    hasEmbedding: true,
  };
}
