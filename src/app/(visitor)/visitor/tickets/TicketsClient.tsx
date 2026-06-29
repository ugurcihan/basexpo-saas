"use client";
import { VISITOR_NAV } from "../_nav";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Sparkles, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
  MapPin, Calendar, CheckCircle2, Clock, AlertCircle,
  Download, QrCode, Camera, X, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";
import {
  checkInToBoothScan,
  createLeadFromScan,
  getBoothByQrToken,
  getExhibitorByToken,
} from "@/features/leads/actions";


interface RegistrationRow {
  id: string;
  status: string;
  ticket_code: string | null;
  created_at: string;
  event: {
    id: string;
    name: string;
    location: string;
    start_date: string;
    end_date: string;
  } | null;
}

interface Props {
  profile: Profile;
  registrations: RegistrationRow[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Hydration-safe QR code component
function TicketQR({ ticketCode, visitorName, phone, eventId, eventName, visitorId, size = 140 }: {
  ticketCode: string;
  visitorName: string;
  phone: string;
  eventId: string;
  eventName: string;
  visitorId: string;
  size?: number;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const qrData = JSON.stringify({
    vid: visitorId,
    tc: ticketCode,
    n: visitorName,
    p: phone,
    eid: eventId,
    ev: eventName,
  });

  if (!mounted) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-white/10 rounded-xl animate-pulse"
      />
    );
  }

  return (
    <div className="bg-white rounded-xl p-2.5 shadow-lg">
      <QRCodeSVG
        value={qrData}
        size={size}
        level="M"
        fgColor="#0A0F1E"
        bgColor="#ffffff"
      />
    </div>
  );
}

// ── QR Parse ────────────────────────────────────────────────
function parseQrText(text: string): { type: "booth" | "exhibitor" | "unknown"; token: string } {
  const boothMatch = text.match(/\/scan\/booth\/([a-zA-Z0-9_-]+)/);
  if (boothMatch) return { type: "booth", token: boothMatch[1] };
  const exhMatch = text.match(/\/scan\/([a-zA-Z0-9_-]+)(?:\?.*)?$/);
  if (exhMatch) return { type: "exhibitor", token: exhMatch[1] };
  return { type: "unknown", token: text };
}

type BoothScanResult =
  | { ok: true; message: string; points: number }
  | { ok: false; message: string };

// ── Ziyaretçi Booth Tarayıcı ────────────────────────────────
function VisitorBoothScanner({ onClose }: { onClose: () => void }) {
  const SCANNER_DIV = "visitor-qr-reader";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const [result, setResult] = useState<BoothScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [isPending, startTransition] = useTransition();

  const handleScan = useCallback(async (text: string) => {
    if (!scanning) return;
    setScanning(false);
    try { await html5QrRef.current?.stop(); } catch { /* ignore */ }

    const { type, token } = parseQrText(text);

    startTransition(async () => {
      if (type === "booth") {
        const booth = await getBoothByQrToken(token);
        if (!booth) { setResult({ ok: false, message: "Geçersiz stant QR kodu." }); return; }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await checkInToBoothScan((booth as any).id);
        if (res.error === "login_required") { setResult({ ok: false, message: "Giriş yapmanız gerekiyor." }); return; }
        if (res.error) { setResult({ ok: false, message: res.error }); return; }
        const earned = res.isGolden ? 20 + res.bonusPoints : 20;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const company = (booth as any).exhibitor?.company_name as string | undefined;
        setResult({ ok: true, message: company ? `${company} stantı ziyaretiniz kaydedildi!` : "Stant ziyaretiniz kaydedildi!", points: earned });
      } else if (type === "exhibitor") {
        const exhibitor = await getExhibitorByToken(token);
        if (!exhibitor) { setResult({ ok: false, message: "Geçersiz firma QR kodu." }); return; }
        const res = await createLeadFromScan(exhibitor.id);
        if (res.error === "login_required") { setResult({ ok: false, message: "Giriş yapmanız gerekiyor." }); return; }
        if (res.error && !res.alreadyExists) { setResult({ ok: false, message: res.error! }); return; }
        setResult({
          ok: true,
          message: res.alreadyExists
            ? `${exhibitor.company_name} ile zaten bağlantınız var.`
            : `${exhibitor.company_name} firmasıyla bağlantınız kuruldu!`,
          points: res.alreadyExists ? 0 : 20,
        });
      } else {
        setResult({ ok: false, message: "Tanımlanamayan QR kodu. Lütfen BasExpo stant veya firma kodlarını okutun." });
      }
    });
  }, [scanning]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let html5Qrcode: any;
    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode");
      html5Qrcode = new Html5Qrcode(SCANNER_DIV);
      html5QrRef.current = html5Qrcode;
      await html5Qrcode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        handleScan,
        () => {},
      );
    }
    start().catch(() => {});
    return () => {
      try { html5Qrcode?.stop().then(() => html5Qrcode?.clear()).catch(() => {}); } catch { /* ignore */ }
    };
  }, [handleScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black/96 flex flex-col">
      <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-brand-cyan" />
          <span className="text-sm font-semibold text-white">Stant QR Okut</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className={`w-full max-w-sm rounded-2xl border-2 p-8 text-center ${
                result.ok ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"
              }`}
            >
              {result.ok ? (
                <>
                  <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
                  <p className="text-white font-semibold mb-2">{result.message}</p>
                  {result.points > 0 && (
                    <div className="flex items-center justify-center gap-2 mt-3 px-4 py-2 rounded-xl bg-brand-gold/15 border border-brand-gold/35">
                      <Trophy className="w-4 h-4 text-brand-gold" />
                      <span className="text-brand-gold font-bold">+{result.points} Puan Kazandın!</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />
                  <p className="text-red-300 font-medium">{result.message}</p>
                </>
              )}
              <button onClick={onClose} className="mt-6 text-sm text-muted-foreground hover:text-white transition-colors">
                Kapat
              </button>
            </motion.div>
          ) : (
            <motion.div key="scanner" className="w-full max-w-sm space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Stant veya firma QR kodunu kameraya gösterin
              </p>
              <div
                id={SCANNER_DIV}
                className="w-full rounded-2xl overflow-hidden border border-brand-cyan/30 bg-black"
                style={{ minHeight: 300 }}
              />
              {isPending && (
                <p className="text-sm text-brand-cyan animate-pulse text-center">İşleniyor...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function statusConfig(status: string) {
  switch (status) {
    case "confirmed":
      return {
        label: "Onaylı Bilet",
        border: "border-green-500/20",
        headerBg: "bg-green-500/8",
        badge: <Badge variant="cyan" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" /> Onaylı</Badge>,
      };
    case "pending_approval":
      return {
        label: "Onay Bekleniyor",
        border: "border-amber-500/20",
        headerBg: "bg-amber-500/8",
        badge: <Badge className="text-xs bg-amber-500/15 border-amber-500/25 text-amber-400"><Clock className="w-3 h-3 mr-1" /> Onay Bekleniyor</Badge>,
      };
    case "waitlisted":
      return {
        label: "Bekleme Listesi",
        border: "border-brand-gold/20",
        headerBg: "bg-brand-gold/8",
        badge: <Badge variant="gold" className="text-xs"><Clock className="w-3 h-3 mr-1" /> Bekleme Listesi</Badge>,
      };
    default:
      return {
        label: status,
        border: "border-white/8",
        headerBg: "bg-white/4",
        badge: <Badge className="text-xs">{status}</Badge>,
      };
  }
}

export function TicketsClient({ profile, registrations }: Props) {
  const visitorName = profile.full_name || profile.email;
  const phone = profile.phone_number || "";
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <>
    {scannerOpen && <VisitorBoothScanner onClose={() => setScannerOpen(false)} />}
    <DashboardShell role="visitor" userName={visitorName} navItems={VISITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Biletlerim</h1>
          </div>
          <p className="text-muted-foreground">
            Kayıt olduğunuz fuarların kişisel QR biletleri.
          </p>
        </motion.div>

        {registrations.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-center mb-4">
              <Ticket className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-white mb-2">Henüz biletiniz yok</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
              Yaklaşan fuarlara kayıt olduğunuzda kişisel QR biletleriniz burada görünecek.
            </p>
            <Button variant="gradient" size="sm" asChild>
              <a href="/visitor/upcoming-fairs">
                <CalendarDays className="w-4 h-4" /> Fuarları Gör
              </a>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {registrations.map((reg, i) => {
              const cfg = statusConfig(reg.status);
              return (
                <motion.div
                  key={reg.id}
                  initial={{ y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className={`glass rounded-2xl border ${cfg.border} overflow-hidden`}
                >
                  {/* Ticket header */}
                  <div className={`${cfg.headerBg} px-6 py-4 flex items-center justify-between border-b ${cfg.border}`}>
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        BasExpo Bilet
                      </span>
                    </div>
                    {cfg.badge}
                  </div>

                  <div className="p-6">
                    {reg.status === "confirmed" && reg.ticket_code ? (
                      /* ── CONFIRMED: Show QR + full details ── */
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* QR code + kamera butonu */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-2 w-full md:w-auto">
                          <TicketQR
                            ticketCode={reg.ticket_code}
                            visitorName={visitorName}
                            phone={phone}
                            eventId={reg.event?.id ?? ""}
                            eventName={reg.event?.name ?? ""}
                            visitorId={profile.id}
                          />
                          <p className="text-xs text-muted-foreground text-center">
                            Girişte okutun
                          </p>
                          <button
                            onClick={() => setScannerOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
                          >
                            <Camera className="w-4 h-4" /> Kamera ile Stant Oku
                          </button>
                        </div>

                        {/* Event info */}
                        <div className="flex-1 min-w-0 space-y-4">
                          <div>
                            <h2 className="font-display text-xl font-bold text-white mb-1">
                              {reg.event?.name ?? "—"}
                            </h2>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              {reg.event?.location && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5" /> {reg.event.location}
                                </span>
                              )}
                              {reg.event?.start_date && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatDate(reg.event.start_date)}
                                  {reg.event.end_date && reg.event.end_date !== reg.event.start_date && (
                                    <> — {formatDate(reg.event.end_date)}</>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Visitor info */}
                          <div className="space-y-2 p-4 rounded-xl bg-white/3 border border-white/8">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Ad Soyad</span>
                              <span className="font-medium text-white">{visitorName}</span>
                            </div>
                            {phone && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Telefon</span>
                                <span className="font-medium text-white">{phone}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm border-t border-white/8 pt-2">
                              <span className="text-muted-foreground">Bilet No</span>
                              <span className="font-mono font-bold text-brand-violet-light tracking-widest text-sm">
                                {reg.ticket_code}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-xs text-green-400 font-medium">
                              Kayıt onaylandı · {formatDateTime(reg.created_at)}
                            </span>
                          </div>

                        </div>
                      </div>
                    ) : reg.status === "pending_approval" ? (
                      /* ── PENDING APPROVAL ── */
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-display text-lg font-bold text-white mb-1">
                            {reg.event?.name ?? "—"}
                          </h2>
                          {reg.event && (
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> {reg.event.location}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(reg.event.start_date)}
                              </span>
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/15 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200/80">
                              Başvurunuz organizatör tarafından inceleniyor. Onaylandığında biletiniz ve QR kodunuz burada görünecek.
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Başvuru tarihi: {formatDateTime(reg.created_at)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* ── WAITLISTED ── */
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-gold/15 border border-brand-gold/25 flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-brand-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-display text-lg font-bold text-white mb-1">
                            {reg.event?.name ?? "—"}
                          </h2>
                          {reg.event && (
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> {reg.event.location}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(reg.event.start_date)}
                              </span>
                            </div>
                          )}
                          <div className="p-3 rounded-lg bg-brand-gold/8 border border-brand-gold/15 flex items-start gap-2">
                            <Download className="w-4 h-4 text-brand-gold flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-200/80">
                              Bekleme listesine alındınız. Kapasite açıldığında otomatik olarak onaylanacaksınız.
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Bekleme tarihi: {formatDateTime(reg.created_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
    </>
  );
}
