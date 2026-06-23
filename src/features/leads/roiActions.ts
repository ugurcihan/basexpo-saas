"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export interface LeadConversion {
  id: string;
  exhibitor_id: string;
  visitor_id: string;
  event_id: string | null;
  deal_status: "lead" | "contacted" | "meeting_held" | "proposal_sent" | "won" | "lost";
  deal_value_tl: number | null;
  cost_basis_tl: number | null;
  notes: string | null;
  contacted_at: string | null;
  meeting_held_at: string | null;
  closed_at: string | null;
  created_at: string;
  visitor?: {
    full_name: string | null;
    email: string;
    interests: string[];
  };
  event?: {
    name: string;
    start_date: string;
    end_date: string;
    location: string;
  } | null;
}

export interface FairROI {
  investment_tl: number;
  total_leads: number;
  contacted: number;
  meetings_held: number;
  proposals_sent: number;
  deals_won: number;
  deals_lost: number;
  revenue_tl: number;
  roi_percent: number | null;
  cost_per_lead: number | null;
  conversion_rate: number;
  event_name: string | null;
  event_start: string | null;
  event_end: string | null;
  event_location: string | null;
  fair_score: number;
}

async function getExhibitorId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("exhibitors")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  return data?.id ?? null;
}

export async function getLeadConversions(eventId?: string): Promise<{
  conversions: LeadConversion[];
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const exhibitorId = await getExhibitorId(supabase);
  if (!exhibitorId) return { conversions: [], error: "Oturum açmanız gerekiyor." };

  let query = supabase
    .from("lead_conversions")
    .select(`
      *,
      visitor:profiles!lead_conversions_visitor_id_fkey(full_name, email, interests),
      event:events!lead_conversions_event_id_fkey(name, start_date, end_date, location)
    `)
    .eq("exhibitor_id", exhibitorId)
    .order("created_at", { ascending: false });

  if (eventId) {
    query = query.eq("event_id", eventId);
  }

  const { data, error } = await query;
  if (error) return { conversions: [], error: error.message };
  return { conversions: (data as LeadConversion[]) ?? [], error: null };
}

export async function updateLeadConversion(
  conversionId: string,
  updates: {
    deal_status?: LeadConversion["deal_status"];
    deal_value_tl?: number | null;
    notes?: string | null;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const exhibitorId = await getExhibitorId(supabase);
  if (!exhibitorId) return { error: "Oturum açmanız gerekiyor." };

  const timestampUpdates: Record<string, string | null> = {};
  if (updates.deal_status === "contacted") timestampUpdates.contacted_at = new Date().toISOString();
  if (updates.deal_status === "meeting_held") timestampUpdates.meeting_held_at = new Date().toISOString();
  if (updates.deal_status === "won" || updates.deal_status === "lost") {
    timestampUpdates.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("lead_conversions")
    .update({
      ...updates,
      ...timestampUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversionId)
    .eq("exhibitor_id", exhibitorId);

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/roi-report");
  return { error: null };
}

export async function upsertLeadConversion(
  visitorId: string,
  eventId: string | null,
  data: {
    deal_status?: LeadConversion["deal_status"];
    deal_value_tl?: number | null;
    cost_basis_tl?: number | null;
    notes?: string | null;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const exhibitorId = await getExhibitorId(supabase);
  if (!exhibitorId) return { error: "Oturum açmanız gerekiyor." };

  const { error } = await supabase.from("lead_conversions").upsert(
    {
      exhibitor_id: exhibitorId,
      visitor_id: visitorId,
      event_id: eventId,
      ...data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "exhibitor_id,visitor_id,event_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/roi-report");
  return { error: null };
}

export async function calculateFairROI(eventId?: string): Promise<{
  roi: FairROI | null;
  error: string | null;
}> {
  const supabase = await createSupabaseServerClient();
  const exhibitorId = await getExhibitorId(supabase);
  if (!exhibitorId) return { roi: null, error: "Oturum açmanız gerekiyor." };

  // Get payment info
  const { data: paymentData } = await supabase
    .from("exhibitor_payment_status")
    .select("booth_fee_cents, event_name, event_id")
    .eq("exhibitor_id", exhibitorId)
    .maybeSingle();

  // Get event info
  let eventInfo: { name: string; start_date: string; end_date: string; location: string } | null = null;
  const targetEventId = eventId ?? paymentData?.event_id;
  if (targetEventId) {
    const { data: ev } = await supabase
      .from("events")
      .select("name, start_date, end_date, location")
      .eq("id", targetEventId)
      .single();
    eventInfo = ev;
  }

  // Total leads for this exhibitor (filtered by event if provided)
  let leadsQuery = supabase
    .from("leads")
    .select("id", { count: "exact" })
    .eq("exhibitor_id", exhibitorId);
  if (targetEventId) {
    const { data: boothData } = await supabase
      .from("booths")
      .select("id")
      .eq("exhibitor_id", exhibitorId);
    const boothIds = boothData?.map((b) => b.id) ?? [];
    if (boothIds.length > 0) {
      const { data: scanVisitors } = await supabase
        .from("qr_scans")
        .select("visitor_id")
        .in("booth_id", boothIds)
        .eq("event_id", targetEventId);
      const visitorIds = [...new Set(scanVisitors?.map((s) => s.visitor_id) ?? [])];
      if (visitorIds.length > 0) {
        leadsQuery = leadsQuery.in("visitor_id", visitorIds);
      }
    }
  }
  const { count: totalLeads } = await leadsQuery;

  // Lead conversion stats
  let convQuery = supabase
    .from("lead_conversions")
    .select("deal_status, deal_value_tl")
    .eq("exhibitor_id", exhibitorId);
  if (targetEventId) convQuery = convQuery.eq("event_id", targetEventId);
  const { data: convData } = await convQuery;

  const convRows = convData ?? [];
  const contacted = convRows.filter((r) => ["contacted","meeting_held","proposal_sent","won"].includes(r.deal_status)).length;
  const meetingsHeld = convRows.filter((r) => ["meeting_held","proposal_sent","won"].includes(r.deal_status)).length;
  const proposalsSent = convRows.filter((r) => ["proposal_sent","won"].includes(r.deal_status)).length;
  const dealsWon = convRows.filter((r) => r.deal_status === "won").length;
  const dealsLost = convRows.filter((r) => r.deal_status === "lost").length;
  const revenueTl = convRows
    .filter((r) => r.deal_status === "won" && r.deal_value_tl)
    .reduce((sum, r) => sum + (r.deal_value_tl ?? 0), 0);

  const investmentTl = (paymentData?.booth_fee_cents ?? 0) / 100;
  const roiPercent = investmentTl > 0 && revenueTl > 0
    ? Math.round(((revenueTl - investmentTl) / investmentTl) * 100)
    : null;
  const costPerLead = investmentTl > 0 && (totalLeads ?? 0) > 0
    ? Math.round(investmentTl / (totalLeads ?? 1))
    : null;
  const conversionRate = (totalLeads ?? 0) > 0
    ? Math.round((dealsWon / (totalLeads ?? 1)) * 100)
    : 0;

  // Fair performance score (0-100)
  const leadScore = Math.min(25, ((totalLeads ?? 0) / 50) * 25);
  const engagementScore = (totalLeads ?? 0) > 0 ? Math.min(25, (meetingsHeld / (totalLeads ?? 1)) * 25 * 4) : 0;
  const convScore = (totalLeads ?? 0) > 0 ? Math.min(20, (dealsWon / (totalLeads ?? 1)) * 20 * 10) : 0;
  const qualityScore = 30; // baseline — would use AI similarity in v2
  const fairScore = Math.round(leadScore + engagementScore + convScore + qualityScore);

  return {
    roi: {
      investment_tl: investmentTl,
      total_leads: totalLeads ?? 0,
      contacted,
      meetings_held: meetingsHeld,
      proposals_sent: proposalsSent,
      deals_won: dealsWon,
      deals_lost: dealsLost,
      revenue_tl: revenueTl,
      roi_percent: roiPercent,
      cost_per_lead: costPerLead,
      conversion_rate: conversionRate,
      event_name: eventInfo?.name ?? paymentData?.event_name ?? null,
      event_start: eventInfo?.start_date ?? null,
      event_end: eventInfo?.end_date ?? null,
      event_location: eventInfo?.location ?? null,
      fair_score: Math.min(100, fairScore),
    },
    error: null,
  };
}
