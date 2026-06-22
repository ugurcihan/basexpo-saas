import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { BadgeClient } from "./BadgeClient";

export default async function BadgePage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");
  return <BadgeClient profile={profile} />;
}
