import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { calculateFairROI, getLeadConversions } from "@/features/leads/roiActions";
import { ROIReportClient } from "./ROIReportClient";

export default async function ROIReportPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const [{ roi }, { conversions }] = await Promise.all([
    calculateFairROI(),
    getLeadConversions(),
  ]);

  return <ROIReportClient profile={profile} roi={roi} conversions={conversions} />;
}
