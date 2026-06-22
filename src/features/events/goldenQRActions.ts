"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createGoldenQR(params: {
  eventId: string;
  boothId?: string | null;
  label: string;
  prizeDescription?: string;
  scanLimit?: number | null;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { data, error } = await supabase
    .from("golden_qr_codes")
    .insert({
      event_id: params.eventId,
      organizer_id: user.id,
      booth_id: params.boothId ?? null,
      label: params.label,
      prize_description: params.prizeDescription ?? null,
      scan_limit: params.scanLimit ?? null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/organizer/golden-qr");
  return { data };
}

export async function deleteGoldenQR(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("golden_qr_codes")
    .delete()
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/organizer/golden-qr");
  return { success: true };
}

export async function toggleGoldenQR(id: string, isActive: boolean) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum açık değil." };

  const { error } = await supabase
    .from("golden_qr_codes")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/organizer/golden-qr");
  return { success: true };
}

export async function getGoldenQRsForOrganizer(eventId?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from("golden_qr_codes")
    .select(`
      id, token, label, prize_description, is_active, scan_limit, created_at,
      event:events(id, name),
      booth:booths(id, code, hall:halls(name)),
      golden_qr_scans(count)
    `)
    .eq("organizer_id", user.id)
    .order("created_at", { ascending: false });

  if (eventId) q = q.eq("event_id", eventId);

  const { data } = await q;
  return data ?? [];
}

export async function scanGoldenQR(token: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: qr, error: qrErr } = await supabase
    .from("golden_qr_codes")
    .select("id, label, prize_description, is_active, scan_limit, golden_qr_scans(count)")
    .eq("token", token)
    .single();

  if (qrErr || !qr) return { error: "QR kodu bulunamadı." };
  if (!qr.is_active) return { error: "Bu QR kodu artık aktif değil." };

  const scanCount = (qr.golden_qr_scans as unknown as { count: number }[])?.[0]?.count ?? 0;
  if (qr.scan_limit && scanCount >= qr.scan_limit) return { error: "Bu QR kodunun tarama limiti doldu." };

  if (!user) {
    return {
      qr: { label: qr.label, prize_description: qr.prize_description },
      requiresLogin: true,
    };
  }

  const { error: insertErr } = await supabase
    .from("golden_qr_scans")
    .insert({ golden_qr_id: qr.id, visitor_id: user.id });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return {
        qr: { label: qr.label, prize_description: qr.prize_description },
        alreadyScanned: true,
      };
    }
    return { error: insertErr.message };
  }

  return {
    qr: { label: qr.label, prize_description: qr.prize_description },
    success: true,
  };
}
