"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, LogOut, Camera, Users, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkinOrCheckout, type CheckinRecord, type CheckinResult } from "@/features/events/checkinActions";

interface Props {
  eventId: string;
  eventTitle: string;
  checkins: CheckinRecord[];
}

function formatTime(str: string) {
  return new Date(str).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(inAt: string, outAt: string | null) {
  if (!outAt) return "Hâlâ İçeride";
  const diff = new Date(outAt).getTime() - new Date(inAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dk`;
  return `${Math.floor(mins / 60)} sa ${mins % 60} dk`;
}

export function GateClient({ eventId, eventTitle, checkins: initialCheckins }: Props) {
  const [checkins, setCheckins] = useState(initialCheckins);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScanResult = useCallback(async (decodedText: string) => {
    if (result) return; // debounce: zaten sonuç gösteriliyorsa tekrar işleme

    // Stop scanner temporarily
    try { await html5QrRef.current?.stop(); } catch { /* ignore */ }
    setScanning(false);

    // QR içeriği: JSON { vid: visitorId } | düz UUID | URL (.../visitor-profile/uuid)
    let visitorId = decodedText.trim();
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.vid) visitorId = parsed.vid;
    } catch {
      // URL veya düz metin içinden UUID pattern'i çıkar
      const uuidMatch = decodedText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (uuidMatch) visitorId = uuidMatch[0];
    }

    const res = await checkinOrCheckout(eventId, visitorId);
    setResult(res);

    if (res.status === "checked_in" || res.status === "checked_out") {
      // Checkins listesini manuel güncelle (server refresh yerine)
      const name = res.visitor.full_name ?? res.visitor.email;
      const now = new Date().toISOString();
      setCheckins(prev => [
        { id: crypto.randomUUID(), visitor_id: visitorId, checked_in_at: now, checked_out_at: null, profile: { full_name: res.visitor.full_name, email: res.visitor.email, avatar_url: null } },
        ...prev,
      ]);
      void name; // suppress lint
    }

    // 3 saniye sonra sıfırla
    resetTimer.current = setTimeout(() => {
      setResult(null);
      startScanner();
    }, 3000);
  }, [eventId, result]);

  const startScanner = useCallback(async () => {
    if (typeof window === "undefined" || !scannerRef.current) return;
    const { Html5QrcodeScanner } = await import("html5-qrcode");
    html5QrRef.current = new Html5QrcodeScanner(
      "gate-qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );
    html5QrRef.current.render(handleScanResult, () => {});
    setScanning(true);
  }, [handleScanResult]);

  useEffect(() => {
    startScanner();
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
      try { html5QrRef.current?.clear(); } catch { /* ignore */ }
    };
  }, [startScanner]);

  const resultBg = !result ? "" :
    result.status === "checked_in"  ? "bg-green-500/15 border-green-500/40" :
    result.status === "checked_out" ? "bg-blue-500/15 border-blue-500/40" :
    "bg-red-500/15 border-red-500/40";

  const insideNow = checkins.filter(c => !c.checked_out_at).length;

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-white/8 flex-shrink-0">
        <Link href={`/organizer/events/${eventId}`} className="text-muted-foreground hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-xs text-muted-foreground">Kapı Tarayıcı</p>
          <p className="text-sm font-semibold text-white">{eventTitle}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-brand-cyan" />
          <span className="text-brand-cyan font-bold">{insideNow}</span>
          <span className="text-muted-foreground">içeride</span>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-0">

        {/* Scanner column */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-sm rounded-2xl border-2 p-8 text-center ${resultBg}`}
              >
                {result.status === "checked_in" && (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-green-400 mb-1">GİRİŞ KABUL</p>
                    <p className="text-white font-medium">{result.visitor.full_name ?? result.visitor.email}</p>
                    <p className="text-sm text-green-400/70 mt-1">Hoş geldiniz!</p>
                  </>
                )}
                {result.status === "checked_out" && (
                  <>
                    <LogOut className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-blue-400 mb-1">ÇIKIŞ KAYIT</p>
                    <p className="text-white font-medium">{result.visitor.full_name ?? result.visitor.email}</p>
                    <p className="text-sm text-blue-400/70 mt-1">İyi günler!</p>
                  </>
                )}
                {result.status === "not_registered" && (
                  <>
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-red-400 mb-1">KAYITLI DEĞİL</p>
                    <p className="text-sm text-red-400/70 mt-1">Bu ziyaretçi fuara kayıtlı değil.</p>
                  </>
                )}
                {result.status === "error" && (
                  <>
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-xl font-bold text-red-400 mb-1">HATA</p>
                    <p className="text-sm text-red-400/70">{result.message}</p>
                  </>
                )}
                <p className="text-xs text-muted-foreground mt-4">Otomatik sıfırlanıyor...</p>
              </motion.div>
            ) : (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-sm space-y-4"
              >
                <div className="text-center mb-2">
                  <Camera className="w-6 h-6 text-brand-cyan mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Ziyaretçi QR kodunu kameraya gösterin</p>
                </div>
                <div
                  id="gate-qr-reader"
                  ref={scannerRef}
                  className="rounded-2xl overflow-hidden border border-brand-cyan/20 bg-black"
                />
                {!scanning && (
                  <Button
                    variant="gradient"
                    className="w-full gap-2"
                    onClick={startScanner}
                  >
                    <Camera className="w-4 h-4" /> Kamerayı Başlat
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Log column */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/8 flex flex-col">
          <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-white">Giriş Kayıtları</p>
            <span className="ml-auto text-xs text-muted-foreground">{checkins.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {checkins.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">Henüz giriş kaydı yok</p>
            ) : (
              <div className="divide-y divide-white/5">
                {checkins.map(c => (
                  <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.checked_out_at ? "bg-muted-foreground" : "bg-green-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {c.profile?.full_name ?? c.profile?.email ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(c.checked_in_at)} · {formatDuration(c.checked_in_at, c.checked_out_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
