import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { calculateFairROI, getLeadConversions } from "@/features/leads/roiActions";
import { ROIReportClient, type ExhibitorInfo } from "./ROIReportClient";

export default async function ROIReportPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [{ roi }, { conversions }, exhibitorResult, profileResult] = await Promise.all([
    calculateFairROI(),
    getLeadConversions(),
    supabase
      .from("exhibitors")
      .select("company_name, description, logo_url, tags, website, phone, address, brand_color")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, job_title, company_name_v, company_size, industry")
      .eq("id", profile.id)
      .single(),
  ]);

  const exhibitor = exhibitorResult.data;
  const profileExtra = profileResult.data;

  const exhibitorInfo: ExhibitorInfo = {
    company_name: exhibitor?.company_name ?? profileExtra?.company_name_v ?? profile.full_name ?? "—",
    contact_name: profileExtra?.full_name ?? profile.full_name ?? "—",
    job_title: profileExtra?.job_title ?? "—",
    company_size: profileExtra?.company_size ?? null,
    industry: profileExtra?.industry ?? null,
    description: exhibitor?.description ?? null,
    logo_url: exhibitor?.logo_url ?? null,
    website: exhibitor?.website ?? null,
    phone: exhibitor?.phone ?? null,
    address: exhibitor?.address ?? null,
    tags: exhibitor?.tags ?? [],
  };

  return <ROIReportClient profile={profile} roi={roi} conversions={conversions} exhibitorInfo={exhibitorInfo} />;
}
