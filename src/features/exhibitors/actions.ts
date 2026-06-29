"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase";
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
    .select(`
      id, name, location, start_date, end_date, status, capacity,
      description, cover_url, category,
      organizer:profiles!events_organizer_id_fkey(full_name, email)
    `)
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

export async function applyToFair(eventId: string, note?: string) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  // Check for existing application (prevents duplicates)
  const { data: existingApp } = await supabase
    .from("exhibitors")
    .select("id, status")
    .eq("owner_id", user.id)
    .eq("event_id", eventId)
    .maybeSingle();

  if (existingApp) {
    if (existingApp.status === "pending")  return { error: "Bu fuara başvurun zaten değerlendiriliyor" };
    if (existingApp.status === "approved") return { error: "Bu fuara zaten kayıtlısın" };
    if (existingApp.status === "rejected") return { error: "Bu fuara başvurunuz daha önce reddedildi" };
    return { error: "Bu fuara zaten kayıtlısın" };
  }

  const { data: existing } = await supabase
    .from("exhibitors")
    .select("company_name, description, logo_url, tags")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const company_name = existing?.company_name ?? "Firma";
  const description  = existing?.description  ?? (note ?? "");
  const logo_url     = existing?.logo_url     ?? null;
  const tags         = existing?.tags         ?? [];

  const { error } = await supabase.from("exhibitors").insert({
    event_id: eventId,
    owner_id: user.id,
    company_name,
    description,
    logo_url,
    tags,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") return { error: "Bu fuara zaten kayıtlısın" };
    return { error: error.message };
  }

  const { data: event } = await admin
    .from("events")
    .select("organizer_id, name")
    .eq("id", eventId)
    .single();

  if (event?.organizer_id) {
    await admin.from("notifications").insert({
      recipient_id: event.organizer_id,
      sender_id: user.id,
      type: "alert",
      title: `Yeni Firma Başvurusu: ${company_name}`,
      body: `${company_name} firması "${event.name}" fuarına katılım başvurusu yaptı.`,
      event_id: eventId,
    });
  }

  revalidatePath("/exhibitor/fairs");
  return { error: null };
}

export async function approveExhibitor(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const admin = createSupabaseAdminClient();

  const { data: exhibitor } = await admin
    .from("exhibitors")
    .select("owner_id, company_name, event:events(name)")
    .eq("id", exhibitorId)
    .single();

  const { error } = await admin
    .from("exhibitors")
    .update({ status: "approved" })
    .eq("id", exhibitorId);

  if (error) return { error: error.message };

  if (exhibitor?.owner_id) {
    const ev = Array.isArray(exhibitor.event) ? exhibitor.event[0] : exhibitor.event;
    await admin.from("notifications").insert({
      recipient_id: exhibitor.owner_id,
      sender_id: user.id,
      type: "alert",
      title: "Başvurunuz Onaylandı!",
      body: `${exhibitor.company_name} firmasının "${(ev as { name?: string } | null)?.name ?? "fuar"}" fuarına katılım başvurusu onaylandı. Stand tahsisi için organizatörle iletişime geçebilirsiniz.`,
    });
  }

  revalidatePath("/organizer/participants");
  revalidatePath("/exhibitor/fairs");
  return { error: null };
}

export async function rejectExhibitor(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const admin = createSupabaseAdminClient();

  const { data: exhibitor } = await admin
    .from("exhibitors")
    .select("owner_id, company_name, event:events(name)")
    .eq("id", exhibitorId)
    .single();

  const { error } = await admin
    .from("exhibitors")
    .update({ status: "rejected" })
    .eq("id", exhibitorId);

  if (error) return { error: error.message };

  if (exhibitor?.owner_id) {
    const ev = Array.isArray(exhibitor.event) ? exhibitor.event[0] : exhibitor.event;
    await admin.from("notifications").insert({
      recipient_id: exhibitor.owner_id,
      sender_id: user.id,
      type: "alert",
      title: "Başvurunuz Hakkında",
      body: `${exhibitor.company_name} firmasının "${(ev as { name?: string } | null)?.name ?? "fuar"}" fuarına katılım başvurusu bu aşamada uygun görülmedi.`,
    });
  }

  revalidatePath("/organizer/participants");
  revalidatePath("/exhibitor/fairs");
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
  contact_name?: string | null;
  job_title?: string | null;
  linkedin_url?: string | null;
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
      contact_name: input.contact_name ?? null,
      job_title: input.job_title ?? null,
      linkedin_url: input.linkedin_url ?? null,
    })
    .eq("id", input.id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/exhibitor");
  revalidatePath("/exhibitor/profile");
  revalidatePath("/exhibitor/card");
  return { error: null };
}

export async function getAllMyExhibitorProfiles() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("exhibitors")
    .select("id, company_name, qr_token, contact_name, job_title, linkedin_url, website, phone, city, logo_url, tags, description, event:events(id, name, location, start_date, end_date)")
    .eq("owner_id", user.id)
    .order("event_id", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return data ?? [];
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
  video_url: string | null;
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

export async function getExhibitorContacts(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exhibitor_contacts")
    .select("id, full_name, email, phone, job_title, contact_type, sort_order")
    .eq("exhibitor_id", exhibitorId)
    .order("contact_type")
    .order("sort_order");
  return data ?? [];
}

export async function upsertContact(input: {
  id?: string;
  exhibitor_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  contact_type: "official" | "booth";
  sort_order: number;
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

  if (input.id) {
    const { error } = await supabase
      .from("exhibitor_contacts")
      .update({
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        job_title: input.job_title,
        contact_type: input.contact_type,
        sort_order: input.sort_order,
      })
      .eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("exhibitor_contacts")
      .insert({
        exhibitor_id: input.exhibitor_id,
        full_name: input.full_name,
        email: input.email,
        phone: input.phone,
        job_title: input.job_title,
        contact_type: input.contact_type,
        sort_order: input.sort_order,
      });
    if (error) return { error: error.message };
  }

  revalidatePath("/exhibitor/card");
  return { error: null };
}

export async function deleteContact(contactId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  // RLS policy on exhibitor_contacts enforces ownership via exhibitors.owner_id = auth.uid()
  const { error } = await supabase
    .from("exhibitor_contacts")
    .delete()
    .eq("id", contactId);

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/card");
  return { error: null };
}

export async function getExhibitorDashboardStats() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: exhibitor } = await supabase
    .from("exhibitors")
    .select("id, event:events(id, name, location, start_date, end_date, status)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!exhibitor) return null;
  const exhibitorId = exhibitor.id;

  const ev = Array.isArray(exhibitor.event) ? exhibitor.event[0] : exhibitor.event;

  const [
    { data: leads },
    { data: matchScores },
    { count: scanCount },
    { data: conversions },
    { data: survey },
  ] = await Promise.all([
    supabase.from("leads").select("score, visitor_id").eq("exhibitor_id", exhibitorId),
    supabase.from("match_scores").select("score").eq("exhibitor_id", exhibitorId).limit(100),
    supabase.from("qr_scans").select("*", { count: "exact", head: true }).eq("exhibitor_id", exhibitorId),
    supabase.from("lead_conversions").select("visitor_id, deal_status").eq("exhibitor_id", exhibitorId),
    supabase.from("exhibitor_surveys").select("id, is_active").eq("exhibitor_id", exhibitorId).maybeSingle(),
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

  const eventEndDate = (ev as { end_date?: string } | null)?.end_date ?? null;
  const fairEnded = eventEndDate ? new Date(eventEndDate) < new Date() : false;

  let surveyResponseCount = 0;
  if (survey?.id) {
    const { count } = await supabase
      .from("survey_responses")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", survey.id);
    surveyResponseCount = count ?? 0;
  }

  const activeFair = ev && !fairEnded
    ? {
        name: (ev as { name?: string }).name ?? "",
        location: (ev as { location?: string }).location ?? "",
        start_date: (ev as { start_date?: string }).start_date ?? "",
        end_date: eventEndDate ?? "",
      }
    : null;

  return {
    leadCount,
    scanCount: scanCount ?? 0,
    avgLeadScore,
    avgMatchScore,
    uncalledCount,
    fairEnded,
    surveyResponseCount,
    surveyIsActive: survey?.is_active ?? false,
    activeFair,
  };
}

export async function createStandaloneExhibitor(label: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın", exhibitorId: null, qrToken: null };

  const { data: existing } = await supabase
    .from("exhibitors")
    .select("company_name, description, logo_url, tags, contact_name, job_title, linkedin_url, website, phone")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase.from("exhibitors").insert({
    event_id: null,
    owner_id: user.id,
    company_name: label || (existing?.company_name ?? "Bağımsız QR"),
    description: existing?.description ?? "",
    logo_url: existing?.logo_url ?? null,
    tags: existing?.tags ?? [],
    status: "approved",
  }).select("id, qr_token").single();

  if (error) return { error: error.message, exhibitorId: null, qrToken: null };

  revalidatePath("/exhibitor/fairs");
  return { error: null, exhibitorId: data.id, qrToken: data.qr_token };
}

export async function deleteStandaloneExhibitor(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("exhibitors")
    .delete()
    .eq("id", exhibitorId)
    .eq("owner_id", user.id)
    .is("event_id", null);

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/fairs");
  return { error: null };
}

// ─── EXHIBITOR INVITATIONS ──────────────────────────────────────

export interface InvitationRow {
  id: string;
  event_id: string;
  from_organizer_id: string;
  to_user_id: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  event: { id: string; name: string; start_date: string; location: string } | null;
  organizer: { full_name: string | null; email: string } | null;
}

export async function sendExhibitorInvitation(input: {
  event_id: string;
  to_user_id: string;
  message?: string;
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase.from("exhibitor_invitations").insert({
    event_id: input.event_id,
    from_organizer_id: user.id,
    to_user_id: input.to_user_id,
    message: input.message ?? null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Bu firmaya bu etkinlik için zaten davet gönderildi" };
    return { error: error.message };
  }

  const admin = createSupabaseAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("name")
    .eq("id", input.event_id)
    .single();

  await admin.from("notifications").insert({
    recipient_id: input.to_user_id,
    sender_id: user.id,
    type: "alert",
    title: "Fuar Daveti Aldınız",
    body: `"${event?.name ?? "Fuar"}" fuarına davet edildiniz. Fuarlarım → Randevular sekmesinden görüntüleyebilirsiniz.`,
    event_id: input.event_id,
  });

  revalidatePath("/organizer/invitations");
  return { error: null };
}

export async function getEventInvitations(event_id: string): Promise<InvitationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("exhibitor_invitations")
    .select(`
      id, event_id, from_organizer_id, to_user_id, message, status, created_at,
      event:events(id, name, start_date, location),
      organizer:profiles!exhibitor_invitations_from_organizer_id_fkey(full_name, email)
    `)
    .eq("event_id", event_id)
    .eq("from_organizer_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map(normalize);
}

export async function getMyInvitations(): Promise<InvitationRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("exhibitor_invitations")
    .select(`
      id, event_id, from_organizer_id, to_user_id, message, status, created_at,
      event:events(id, name, start_date, location),
      organizer:profiles!exhibitor_invitations_from_organizer_id_fkey(full_name, email)
    `)
    .eq("to_user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map(normalize);
}

export async function respondToInvitation(
  invitationId: string,
  status: "accepted" | "rejected",
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { data: inv, error: fetchErr } = await supabase
    .from("exhibitor_invitations")
    .select("event_id, from_organizer_id")
    .eq("id", invitationId)
    .eq("to_user_id", user.id)
    .single();

  if (fetchErr || !inv) return { error: "Davet bulunamadı" };

  const { error } = await supabase
    .from("exhibitor_invitations")
    .update({ status })
    .eq("id", invitationId)
    .eq("to_user_id", user.id);

  if (error) return { error: error.message };

  if (status === "accepted") {
    await applyToFair(inv.event_id);
  }

  revalidatePath("/exhibitor/fairs");
  revalidatePath("/organizer/invitations");
  return { error: null };
}

function normalize(row: Record<string, unknown>): InvitationRow {
  const ev = row.event as { id: string; name: string; start_date: string; location: string } | Array<{ id: string; name: string; start_date: string; location: string }> | null;
  const org = row.organizer as { full_name: string | null; email: string } | Array<{ full_name: string | null; email: string }> | null;
  return {
    id: row.id as string,
    event_id: row.event_id as string,
    from_organizer_id: row.from_organizer_id as string,
    to_user_id: row.to_user_id as string,
    message: row.message as string | null,
    status: row.status as "pending" | "accepted" | "rejected",
    created_at: row.created_at as string,
    event: ev ? (Array.isArray(ev) ? (ev[0] ?? null) : ev) : null,
    organizer: org ? (Array.isArray(org) ? (org[0] ?? null) : org) : null,
  };
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
