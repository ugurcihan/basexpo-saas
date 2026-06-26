"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin, Calendar, Users, Tag, Globe, Instagram, Twitter, Linkedin,
  Crown, CheckCircle2, Clock, QrCode, ExternalLink, Navigation,
  Ticket, ChevronRight, AlertCircle, Mail, Lock, Building2, UserPlus,
  Camera, X, Trophy, Gift,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { registerForEvent } from "@/features/events/registrationActions";
import { FloorMapViewer } from "@/components/map/FloorMapViewer";
import type { HallWithMap } from "@/features/events/hallMapActions";
import type { OrganizerInfo } from "./page";
import type { Profile } from "@/types";
import type { RewardTierWithStats } from "@/features/loyalty/actions";

interface SponsorRow {
  id: string;
  tier: number;
  tier_name: string;
  width_pct: number | null;
  height_px: number | null;
  sort_order: number | null;
  custom_logo_url: string | null;
  exhibitor: { id: string; company_name: string; logo_url: string | null } | null;
}

interface EventData {
  id: string; name: string; description: string | null;
  location: string; start_date: string; end_date: string;
  capacity: number | null; cover_url: string | null; gallery_urls: string[] | null;
  maps_url: string | null; youtube_url: string | null;
  social_links: { website?: string; instagram?: string; twitter?: string; linkedin?: string } | null;
  tags: string[] | null; category: string | null; requires_approval: boolean | null; status: string;
  organizer_id: string;
}

interface Props {
  event: EventData;
  sponsors: SponsorRow[];
  halls: HallWithMap[];
  organizer: OrganizerInfo | null;
  profile: Profile | null;
  registration: { status: string; ticket_code: string | null } | null;
  rewardTiers: RewardTierWithStats[];
}

function EventQRScanner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [status, setStatus] = useState<"scanning" | "found" | "error">("scanning");

  const startScanner = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("event-qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          setStatus("found");
          scanner.stop().catch(() => {});
          const path = text.includes(window.location.origin)
            ? text.replace(window.location.origin, "")
            : text.startsWith("/") ? text : null;
          if (path) {
            setTimeout(() => { router.push(path); onClose(); }, 600);
          } else {
            setTimeout(onClose, 1200);
          }
        },
        () => {}
      );
    } catch {
      setStatus("error");
    }
  }, [router, onClose]);

  useEffect(() => {
    startScanner();
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, [startScanner]);

  return (
    <div className="fixed inset-0 z-50 bg-black/98 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-cyan" />
          <span className="font-semibold text-white text-sm">Stant QR Okut</span>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
        {status === "found" ? (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-white font-semibold">QR kod bulundu!</p>
            <p className="text-xs text-muted-foreground">Yönlendiriliyorsunuz...</p>
          </motion.div>
        ) : status === "error" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-400 font-medium">Kamera açılamadı</p>
            <p className="text-xs text-muted-foreground">Kamera izni verip tekrar deneyin</p>
            <button onClick={onClose} className="mt-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm">Kapat</button>
          </div>
        ) : (
          <>
            <div className="relative">
              <div id="event-qr-reader" className="rounded-2xl overflow-hidden" style={{ width: 280, height: 280 }} />
              <div className="absolute inset-0 border-2 border-brand-cyan/60 rounded-2xl pointer-events-none">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-cyan rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-brand-cyan rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-brand-cyan rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-cyan rounded-br-xl" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">Stanttaki QR kodu kameranıza gösterin</p>
          </>
        )}
      </div>
    </div>
  );
}

function QRDisplay({ value, size }: { value: string; size: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: size, height: size }} className="bg-gray-100 rounded animate-pulse" />;
  return <QRCodeSVG value={value} size={size} level="M" fgColor="#1a1a2e" />;
}

export function EventLandingClient({ event, sponsors, halls, organizer, profile, registration, rewardTiers }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [currentReg, setCurrentReg] = useState(registration);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [authTab, setAuthTab] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function handleRegisterToFair() {
    setMsg(null);
    startTransition(async () => {
      const result = await registerForEvent(event.id);
      if (result?.error) { setMsg({ type: "err", text: result.error }); return; }
      setMsg({ type: "ok", text: result.status === "pending_approval" ? "Başvurunuz alındı, onay bekleniyor." : "Kayıt başarılı! Biletiniz oluşturuldu." });
      const { data: reg } = await supabase
        .from("event_registrations").select("status, ticket_code")
        .eq("event_id", event.id).eq("visitor_id", currentProfile!.id).maybeSingle();
      setCurrentReg(reg ?? null);
    });
  }

  async function handleAuth() {
    setMsg(null);
    startTransition(async () => {
      let userId: string | null = null;

      if (authTab === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setMsg({ type: "err", text: "Giriş başarısız: " + error.message }); return; }
        userId = data.user?.id ?? null;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role: "visitor" } } });
        if (error) { setMsg({ type: "err", text: "Kayıt başarısız: " + error.message }); return; }
        if (data.user && !data.session) {
          setMsg({ type: "ok", text: "E-posta onay linki gönderildi. Onayladıktan sonra tekrar giriş yapın." });
          return;
        }
        userId = data.user?.id ?? null;
      }

      if (!userId) { setMsg({ type: "err", text: "Kimlik doğrulama başarısız." }); return; }

      setMsg({ type: "ok", text: authTab === "login" ? "Giriş başarılı! Yönlendiriliyorsunuz..." : "Kayıt başarılı! Yönlendiriliyorsunuz..." });
      setTimeout(() => { window.location.reload(); }, 800);
    });
  }

  const sponsorsByTier = sponsors.reduce<Record<number, SponsorRow[]>>((acc, s) => {
    if (!acc[s.tier]) acc[s.tier] = [];
    acc[s.tier].push(s);
    return acc;
  }, {});
  const sortedTiers = Object.keys(sponsorsByTier).map(Number).sort((a, b) => a - b);

  const embedUrl = event.youtube_url
    ? event.youtube_url.replace("watch?v=", "embed/").replace(/&.+/, "")
    : null;

  const statusLabel = event.status === "active" ? "Aktif" : "Yayında";
  const statusColor = event.status === "active" ? "text-green-400 bg-green-500/15 border-green-500/30" : "text-brand-indigo-light bg-brand-indigo/15 border-brand-indigo/30";

  const hasSocialLinks = event.social_links?.website || event.social_links?.instagram ||
    event.social_links?.twitter || event.social_links?.linkedin || event.maps_url;

  const hasMap = halls.length > 0 && (halls.some(h => h.map_url) || halls.some(h => h.booths.length > 0));

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <AnimatePresence>
        {scannerOpen && <EventQRScanner onClose={() => setScannerOpen(false)} />}
      </AnimatePresence>
      {/* Hero */}
      {event.cover_url && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img src={event.cover_url} alt={event.name} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start gap-3 mb-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
            {event.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">{event.category}</span>
            )}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">{event.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(event.start_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              {" — "}
              {new Date(event.end_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {event.capacity && <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Kapasite: {event.capacity}</span>}
          </div>
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {event.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-brand-indigo/15 border border-brand-indigo/20 text-brand-indigo-light flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Organizer card */}
        {organizer && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            <Link
              href={`/o/${organizer.id}`}
              className="flex items-center gap-3 glass rounded-xl border border-white/8 px-4 py-3 hover:border-brand-indigo/30 transition-colors group"
            >
              {organizer.avatar_url ? (
                <img
                  src={organizer.avatar_url}
                  alt={organizer.full_name}
                  className="w-9 h-9 rounded-xl object-cover border border-white/15 flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-brand-indigo/20 border border-brand-indigo/25 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-brand-indigo-light" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Organizatör</p>
                <p className="text-sm font-semibold text-white group-hover:text-brand-indigo-light transition-colors truncate">{organizer.full_name}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-brand-indigo-light transition-colors">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Takip Et</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Social links + maps_url — üstte */}
        {hasSocialLinks && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="flex flex-wrap gap-2">
            {event.maps_url && (
              <a href={event.maps_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm hover:bg-green-500/20 transition-colors">
                <MapPin className="w-3.5 h-3.5" /> Haritada Gör <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {event.social_links?.website && (
              <a href={event.social_links.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-muted-foreground text-sm hover:text-white transition-colors">
                <Globe className="w-3.5 h-3.5" /> Web
              </a>
            )}
            {event.social_links?.instagram && (
              <a href={event.social_links.instagram} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-muted-foreground text-sm hover:text-white transition-colors">
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </a>
            )}
            {event.social_links?.twitter && (
              <a href={event.social_links.twitter} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-muted-foreground text-sm hover:text-white transition-colors">
                <Twitter className="w-3.5 h-3.5" /> X (Twitter)
              </a>
            )}
            {event.social_links?.linkedin && (
              <a href={event.social_links.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-muted-foreground text-sm hover:text-white transition-colors">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
          </motion.div>
        )}

        {/* Description */}
        {event.description && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
            className="glass rounded-2xl border border-white/8 p-6">
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          </motion.div>
        )}

        {/* YouTube */}
        {embedUrl && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/8">
              <iframe src={embedUrl} title="Tanıtım Videosu" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
            </div>
          </motion.div>
        )}

        {/* Sponsor pyramid */}
        {sponsors.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-brand-gold" />
              <h2 className="font-semibold text-white">Sponsorlar</h2>
            </div>
            <div className="space-y-3">
              {sortedTiers.map((tier) => {
                const tierSponsors = sponsorsByTier[tier];
                const tierName = tierSponsors[0]?.tier_name ?? `Seviye ${tier}`;
                return (
                  <div key={tier}>
                    <p className="text-xs text-muted-foreground mb-1.5">{tierName}</p>
                    <div className="flex flex-row flex-wrap gap-3">
                      {tierSponsors.map((s) => {
                        const logoSrc = s.custom_logo_url || s.exhibitor?.logo_url;
                        const bp = `calc(${s.width_pct ?? 100}% - 12px)`;
                        const hp = s.height_px ?? 80;
                        return (
                          <div
                            key={s.id}
                            className="glass rounded-xl border border-white/10 overflow-hidden flex items-center justify-center bg-white/5"
                            style={{ flexBasis: bp, maxWidth: bp, height: hp }}
                          >
                            {logoSrc ? (
                              <img
                                src={logoSrc}
                                alt={s.exhibitor?.company_name ?? "Sponsor"}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-white px-3 text-center leading-tight">
                                {s.exhibitor?.company_name ?? "—"}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Fuar Haritası */}
        {hasMap && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
            className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-cyan" />
              <h2 className="font-semibold text-white">Fuar Haritası</h2>
            </div>
            <FloorMapViewer halls={halls} />
            {event.maps_url && (
              <a
                href={event.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm hover:bg-green-500/20 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Google Maps&apos;te Yol Tarifi Al
                <ExternalLink className="w-3.5 h-3.5 ml-auto" />
              </a>
            )}
          </motion.div>
        )}

        {/* ── CTA BÖLÜMÜ ──────────────────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>

          {/* STATE 3: Kayıtlı — bilet göster */}
          {currentReg?.status === "confirmed" && currentReg.ticket_code && (
            <div className="glass rounded-2xl border border-green-500/30 bg-green-500/5 p-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Fuara Kayıtlısınız!</span>
              </div>
              <div className="bg-white p-4 rounded-xl">
                <QRDisplay value={currentReg.ticket_code} size={160} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Bu QR&apos;ı kapıda okutun. Bilet kodunuz: <span className="font-mono text-white">{currentReg.ticket_code}</span>
              </p>
              {/* Kamera ile stant QR okut */}
              <button
                onClick={() => setScannerOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
              >
                <Camera className="w-4 h-4" /> Kamera ile Stant QR Okut
              </button>
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Fuardaki standları ziyaret et, puan kazan
              </p>
            </div>
          )}

          {/* STATE 2b: Onay bekliyor */}
          {currentReg?.status === "pending_approval" && (
            <div className="glass rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-6 flex flex-col items-center gap-3">
              <Clock className="w-8 h-8 text-brand-gold" />
              <p className="font-semibold text-brand-gold">Başvurunuz Onay Bekliyor</p>
              <p className="text-sm text-muted-foreground text-center">Organizatör onayladığında biletiniz oluşturulacak.</p>
            </div>
          )}

          {/* STATE 2a: Giriş yapmış, kayıt yok */}
          {currentProfile && !currentReg && (
            <div className="glass rounded-2xl border border-brand-indigo/30 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-brand-indigo-light" />
                <h3 className="font-semibold text-white">Bu Fuara Kayıt Ol</h3>
              </div>
              {event.requires_approval && (
                <p className="text-xs text-brand-gold/80">Bu fuar onay gerektiriyor. Başvurunuz organizatöre iletilecek.</p>
              )}
              {msg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${msg.type === "ok" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {msg.text}
                </div>
              )}
              <Button variant="gradient" className="w-full" onClick={handleRegisterToFair} disabled={isPending}>
                {isPending ? "Kaydediliyor..." : "Kayıt Ol"} <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STATE 1: Giriş yapmamış */}
          {!currentProfile && (
            <div className="glass rounded-2xl border border-white/12 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-5 h-5 text-brand-indigo-light" />
                <h3 className="font-semibold text-white">Fuara Katılmak İster Misiniz?</h3>
              </div>

              <div className="flex rounded-xl bg-white/5 p-1 gap-1">
                {(["register", "login"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAuthTab(tab)}
                    className={`flex-1 text-sm py-1.5 rounded-lg transition-all font-medium ${authTab === tab ? "bg-brand-indigo/30 border border-brand-indigo/30 text-white" : "text-muted-foreground hover:text-white"}`}
                  >
                    {tab === "register" ? "Üye Ol" : "Giriş Yap"}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {authTab === "register" && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Ad Soyad</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Adınız Soyadınız" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> E-posta</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Şifre</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" />
                </div>
              </div>

              {msg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${msg.type === "ok" ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                  {msg.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {msg.text}
                </div>
              )}

              <Button
                variant="gradient"
                className="w-full"
                onClick={handleAuth}
                disabled={isPending || !email || !password || (authTab === "register" && !fullName)}
              >
                {isPending ? "İşleniyor..." : authTab === "register" ? "Üye Ol ve Kayıt Ol" : "Giriş Yap ve Kayıt Ol"}
                <ChevronRight className="w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {authTab === "register"
                  ? "Zaten hesabınız var mı? Üstten giriş yapın."
                  : "Hesabınız yok mu? Üstten üye olun."}
              </p>
            </div>
          )}
        </motion.div>

        {/* Hediyeler & Ödüller */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.2 }}>
          <div className="glass rounded-2xl border border-brand-gold/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-brand-gold" />
              <h2 className="font-semibold text-white">Hediyeler & Ödüller</h2>
            </div>
            {rewardTiers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Bu fuar için henüz ödül tanımlanmamış.</p>
            ) : (
              <div className="space-y-3">
                {rewardTiers.map((tier) => (
                  <div key={tier.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl bg-white/4 border border-white/8">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-gold/15 border border-brand-gold/25 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-4 h-4 text-brand-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{tier.reward_title}</p>
                        {tier.reward_description && (
                          <p className="text-xs text-muted-foreground truncate">{tier.reward_description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-brand-gold font-bold whitespace-nowrap">{tier.points_required} puan</span>
                      {tier.max_winners !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${tier.is_full ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-brand-gold/30 text-brand-gold/70"}`}>
                          {tier.is_full ? "Doldu" : `İlk ${tier.max_winners}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Standları ziyaret et puan kazan, ödülleri kap!
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="text-center text-xs text-muted-foreground/50 pb-8">
          <span className="font-display font-bold text-white/30">BasExpo</span> · Fuar Yönetim Platformu
        </div>
      </div>
    </div>
  );
}
