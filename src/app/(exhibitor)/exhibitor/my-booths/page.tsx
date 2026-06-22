import { redirect } from "next/navigation";
import { getProfile, createSupabaseServerClient } from "@/lib/supabase-server";
import { MyBoothsClient } from "./MyBoothsClient";

export default async function MyBoothsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: booths } = await supabase
    .from("booths")
    .select("id, code, hall:halls(id, name, floor, event:events(id, name, location, start_date, end_date, status))")
    .eq("exhibitor_id", profile.id);

  return <MyBoothsClient profile={profile} booths={(booths ?? []) as unknown as Parameters<typeof MyBoothsClient>[0]["booths"]} />;
}
