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
