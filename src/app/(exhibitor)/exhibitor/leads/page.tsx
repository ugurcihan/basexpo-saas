import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyExhibitorProfile } from "@/features/exhibitors/actions";
import { getExhibitorLeads } from "@/features/leads/actions";
import { LeadsClient } from "./LeadsClient";

export default async function LeadsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const exhibitor = await getMyExhibitorProfile();
  if (!exhibitor) redirect("/exhibitor/profile");

  const leads = await getExhibitorLeads(exhibitor.id);
  return <LeadsClient exhibitor={exhibitor} leads={leads} />;
}
