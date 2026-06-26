import { notFound } from "next/navigation";
import { createSupabaseServerClient, getProfile } from "@/lib/supabase-server";
import { VisitorProfileClient } from "./VisitorProfileClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VisitorProfilePage({ params }: Props) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: visitor } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, interests, bio, city")
    .eq("id", id)
    .eq("role", "visitor")
    .maybeSingle();

  if (!visitor) notFound();

  const profile = await getProfile().catch(() => null);

  return (
    <VisitorProfileClient
      visitor={visitor}
      viewerRole={profile?.role ?? null}
      viewerId={profile?.id ?? null}
    />
  );
}
