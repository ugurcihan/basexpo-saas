import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyExhibitorProfile } from "@/features/exhibitors/actions";
import { QRClient } from "./QRClient";

export default async function QRPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "exhibitor") redirect("/login");

  const exhibitor = await getMyExhibitorProfile();
  if (!exhibitor) redirect("/exhibitor/profile");

  return <QRClient exhibitor={exhibitor} />;
}
