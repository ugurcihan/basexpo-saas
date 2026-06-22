import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { BoothsClient } from "./BoothsClient";

export default async function BoothsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");
  return <BoothsClient />;
}
