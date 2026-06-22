import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyConnections, discoverVisitors } from "@/features/connections/actions";
import { ConnectionsClient } from "./ConnectionsClient";

export default async function ConnectionsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const [{ incoming, outgoing, accepted }, discoverable] = await Promise.all([
    getMyConnections(),
    discoverVisitors(),
  ]);

  return (
    <ConnectionsClient
      profile={profile}
      incoming={incoming}
      outgoing={outgoing}
      accepted={accepted}
      discoverable={discoverable}
    />
  );
}
