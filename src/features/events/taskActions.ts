"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getProfile } from "@/lib/supabase-server";

export interface FairTask {
  id: string;
  event_id: string;
  title: string;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
}

async function getOrganizerEventIds(): Promise<string[]> {
  const profile = await getProfile();
  if (!profile) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", profile.id);
  return (data ?? []).map((e) => e.id);
}

export async function getTasksByEvent(eventId: string): Promise<FairTask[]> {
  const ids = await getOrganizerEventIds();
  if (!ids.includes(eventId)) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("fair_tasks")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data ?? []) as FairTask[];
}

export async function createTask(eventId: string, title: string, dueDate?: string) {
  const ids = await getOrganizerEventIds();
  if (!ids.includes(eventId)) return { error: "Yetki yok." };
  if (!title.trim()) return { error: "Görev başlığı boş olamaz." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("fair_tasks").insert({
    event_id: eventId,
    title: title.trim(),
    due_date: dueDate || null,
  });
  if (error) return { error: "Görev oluşturulamadı." };
  revalidatePath("/organizer/tools");
  return { success: true };
}

export async function createTasksBulk(eventId: string, titles: string[]) {
  const ids = await getOrganizerEventIds();
  if (!ids.includes(eventId)) return { error: "Yetki yok." };
  const supabase = await createSupabaseServerClient();
  const rows = titles.map((title) => ({ event_id: eventId, title }));
  const { error } = await supabase.from("fair_tasks").insert(rows);
  if (error) return { error: "Görevler oluşturulamadı." };
  revalidatePath("/organizer/tools");
  return { success: true };
}

export async function toggleTask(taskId: string, isDone: boolean) {
  const supabase = await createSupabaseServerClient();
  const profile = await getProfile();
  if (!profile) return { error: "Oturum gerekli." };

  const { data: task } = await supabase
    .from("fair_tasks").select("event_id").eq("id", taskId).maybeSingle();
  if (!task) return { error: "Görev bulunamadı." };

  const ids = await getOrganizerEventIds();
  if (!ids.includes(task.event_id)) return { error: "Yetki yok." };

  const { error } = await supabase.from("fair_tasks").update({ is_done: isDone }).eq("id", taskId);
  if (error) return { error: "Güncelleme başarısız." };
  revalidatePath("/organizer/tools");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createSupabaseServerClient();
  const profile = await getProfile();
  if (!profile) return { error: "Oturum gerekli." };

  const { data: task } = await supabase
    .from("fair_tasks").select("event_id").eq("id", taskId).maybeSingle();
  if (!task) return { error: "Görev bulunamadı." };

  const ids = await getOrganizerEventIds();
  if (!ids.includes(task.event_id)) return { error: "Yetki yok." };

  const { error } = await supabase.from("fair_tasks").delete().eq("id", taskId);
  if (error) return { error: "Silme başarısız." };
  revalidatePath("/organizer/tools");
  return { success: true };
}
