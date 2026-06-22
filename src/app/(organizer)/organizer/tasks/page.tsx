import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { TasksClient } from "./TasksClient";

export default async function TasksPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "organizer") redirect("/login");
  return <TasksClient />;
}
