"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Calendar, Users, Tag, Globe, Instagram, Twitter, Linkedin,
  Crown, Building2, CheckCircle2, Clock, QrCode, ExternalLink, Youtube,
  Ticket, ChevronRight, AlertCircle, Mail, Lock,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { registerForEvent } from "@/features/events/registrationActions";
import type { Profile } from "@/types";

interface SponsorRow {
  id: string;
  tier: number;
  tier_name: string;
  exhibitor: { id: string; company_name: string; logo_url: string | null } | null;
}

interface EventData {
  id: string; name: string; description: string | null;
  location: string; start_date: string; end_date: string;
  capacity: number | null; cover_url: string | null; gallery_urls: string[] | null;
  maps_url: string | null; youtube_url: string | null;
  social_links: { website?: string; instagram?: string; twitter?: string; linkedin?: string } | null;
  tags: string[] | null; category: string | null; requires_approval: boolean | null; status: string;
}

interface Props {
  event: EventData;
  sponsors: SponsorRow[];
  profile: Profile | null;
  registration: { status: string; ticket_code: string | null } | null;
}

function QRDisplay({ value, size }: { value: string; size: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: size, height: size }} className="bg-gray-100 rounded animate-pulse" />;
  return <QRCodeSVG value={value} size={size} level="M" fgColor="#1a1a2e" />;
}

function getTierCols(tier: number, maxTier: number): string {
  if (maxTier <= 1 || tier === 1) return "col-span-12";
  const ratio = 1 - (tier - 1) / maxTier;
  if (ratio >= 0.7) return "col-span-8";
  if (ratio >= 0.5) return "col-span-6";
  if (ratio >= 0.35) return "col-span-4";
  return "col-span-3";
}

export function EventLandingClient({ event, sponsors, profile, registration }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [currentReg, setCurrentReg] = useState(registration);
  const [currentProfile, setCurrentProfile] = useState(profile);

  // Auth form state
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
      // Re-fetch registration status
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
        userId = data.user?.id ?? null;
      }

      if (!userId) { setMsg({ type: "err", text: "Kimlik doğrulama başarısız." }); return; }

      // Fetch profile
      const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      setCurrentProfile(p as Profile | null);

      // Register for the event
      const result = await registerForEvent(event.id);
      if (result?.error) { setMsg({ type: "err", text: result.error }); return; }
      setMsg({ type: "ok", text: "Kayıt başarılı! Biletiniz oluşturuldu." });
      const { data: reg } = await supabase
        .from("event_registrations").select("status, ticket_code")
        .eq("event_id", event.id).eq("visitor_id", userId).maybeSingle();
      setCurrentReg(reg ?? null);
    });
  }

  const sponsorsByTier = sponsors.reduce<Record<number, SponsorRow[]>>((acc, s) => {
    if (!acc[s.tier]) acc[s.tier] = [];
    acc[s.tier].push(s);
    return acc;
  }, {});
  const maxTier = Math.max(...sponsors.map((s) => s.tier), 1);
  const sortedTiers = Object.keys(sponsorsByTier).map(Number).sort((a, b) => a - b);

  const embedUrl = event.youtube_url
    ? event.youtube_url.replace("watch?v=", "embed/").replace(/&.+/, "")
    : null;

  const statusLabel = event.status === "active" ? "Aktif" : "Yayında";
  const statusColor = event.status === "active" ? "text-green-400 bg-green-500/15 border-green-500/30" : "text-brand-indigo-light bg-brand-indigo/15 border-brand-indigo/30";

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Hero */}
      {event.cover_url && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img src={event.cover_url} alt={event.name} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
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

        {/* Description */}
        {event.description && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="glass rounded-2xl border border-white/8 p-6">
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          </motion.div>
        )}

        {/* YouTube */}
        {embedUrl && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="aspect-video rounded-2xl overflow-hidden border border-white/8">
              <iframe src={embedUrl} title="Tanıtım Videosu" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
            </div>
          </motion.div>
        )}

        {/* Sponsor pyramid */}
        {sponsors.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
                    <div className="grid grid-cols-12 gap-2">
                      {tierSponsors.map((s) => (
                        <div key={s.id} className={`${getTierCols(tier, maxTier)} glass rounded-xl border border-white/10 p-3 flex items-center gap-2`}>
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-white truncate">{s.exhibitor?.company_name ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Social + Maps */}
        {(event.social_links || event.maps_url) && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
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

        {/* ── CTA BÖLÜMÜ ──────────────────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>

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
                Bu QR'ı kapıda okutun. Bilet kodunuz: <span className="font-mono text-white">{currentReg.ticket_code}</span>
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

              {/* Tab selector */}
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

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground/50 pb-8">
          <span className="font-display font-bold text-white/30">BasExpo</span> · Fuar Yönetim Platformu
        </div>
      </div>
    </div>
  );
}
