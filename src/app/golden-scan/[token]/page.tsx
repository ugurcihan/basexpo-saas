import { notFound } from "next/navigation";
import { createSupabaseServerClient, getProfile } from "@/lib/supabase-server";
import { GoldenScanClient } from "./GoldenScanClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function GoldenScanPage({ params }: Props) {
  const { token } = await params;

  const supabase = await createSupabaseServerClient();
  const profile = await getProfile();

  const { data: qr } = await supabase
    .from("golden_qr_codes")
    .select("id, label, prize_description, is_active, scan_limit, golden_qr_scans(count)")
    .eq("token", token)
    .single();

  if (!qr) notFound();

  if (!qr.is_active) {
    return (
      <GoldenScanClient
        token={token}
        initialResult={{ error: "Bu QR kodu artık aktif değil." }}
      />
    );
  }

  const scanCount = (qr.golden_qr_scans as unknown as { count: number }[])?.[0]?.count ?? 0;
  if (qr.scan_limit && scanCount >= qr.scan_limit) {
    return (
      <GoldenScanClient
        token={token}
        initialResult={{ error: "Bu QR kodunun tarama limiti doldu." }}
      />
    );
  }

  if (!profile) {
    return (
      <GoldenScanClient
        token={token}
        initialResult={{
          qr: { label: qr.label, prize_description: qr.prize_description },
          requiresLogin: true,
        }}
      />
    );
  }

  // Ziyaretçi giriş yapmış — daha önce taramış mı kontrol et
  const { data: existingScan } = await supabase
    .from("golden_qr_scans")
    .select("id")
    .eq("golden_qr_id", qr.id)
    .eq("visitor_id", profile.id)
    .maybeSingle();

  if (existingScan) {
    return (
      <GoldenScanClient
        token={token}
        initialResult={{
          qr: { label: qr.label, prize_description: qr.prize_description },
          alreadyScanned: true,
        }}
      />
    );
  }

  // Kaydet
  await supabase.from("golden_qr_scans").insert({
    golden_qr_id: qr.id,
    visitor_id: profile.id,
  });

  return (
    <GoldenScanClient
      token={token}
      initialResult={{
        qr: { label: qr.label, prize_description: qr.prize_description },
        success: true,
      }}
    />
  );
}
