"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Sparkles, QrCode, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
  MapPin, Calendar, ChevronLeft, Crown, Medal, Award,
  Building2, ChevronDown, ChevronUp, Store, Grid3X3,
  LayoutDashboard as ExhibitorDashboard, Package, MessageSquare, Brain,
} from "lucide-react";

// ── Nav items ──────────────────────────────────────────────────
const VISITOR_NAV = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "QR Badge'im",      href: "/visitor/badge",             icon: QrCode },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

const EXHIBITOR_NAV = [
  { label: "Panel",            href: "/exhibitor",                icon: ExhibitorDashboard },
  { label: "Marka Profili",    href: "/exhibitor/profile",        icon: Building2 },
  { label: "QR Yarat",         href: "/exhibitor/qr",             icon: QrCode },
  { label: "Ürünlerim",        href: "/exhibitor/products",       icon: Package },
  { label: "Ziyaretçilerim",   href: "/exhibitor/leads",          icon: Users },
  { label: "Mesajlar",         href: "/exhibitor/messages",       icon: MessageSquare },
  { label: "Analiz AI",        href: "/exhibitor/analytics",      icon: Brain },
  { label: "Yaklaşan Fuarlar", href: "/exhibitor/upcoming-fairs", icon: CalendarClock },
  { label: "Fuar Standlarım",  href: "/exhibitor/my-booths",      icon: Store },
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

// ── Tier meta ──────────────────────────────────────────────────
const TIER_META: Record<number, {
  name: string; color: string; bg: string; border: string;
  icon: React.ElementType; cols: string; labelSize: string;
}> = {
  1: { name: "Platin Sponsor",  color: "text-slate-200",  bg: "bg-slate-400/10",    border: "border-slate-400/25",   icon: Crown,  cols: "col-span-12", labelSize: "text-xl" },
  2: { name: "Altın Sponsor",   color: "text-brand-gold", bg: "bg-brand-gold/10",   border: "border-brand-gold/20",  icon: Medal,  cols: "col-span-6",  labelSize: "text-base" },
  3: { name: "Gümüş Sponsor",   color: "text-brand-cyan", bg: "bg-brand-cyan/10",   border: "border-brand-cyan/20",  icon: Award,  cols: "col-span-4",  labelSize: "text-sm" },
  4: { name: "Bronz Sponsor",   color: "text-orange-400", bg: "bg-orange-500/10",   border: "border-orange-500/20",  icon: Award,  cols: "col-span-3",  labelSize: "text-sm" },
};

// ── Types ──────────────────────────────────────────────────────
interface SponsorRow {
  id: string;
  tier: number;
  tier_name: string;
  exhibitor: { id: string; company_name: string; logo_url: string | null; tags: string[] } | null;
}

interface ParticipantBooth {
  code: string;
  hall: { name: string } | null;
}

interface Participant {
  id: string;
  company_name: string;
  tags: string[];
  booths: ParticipantBooth[];
}

interface FairEvent {
  id: string;
  name: string;
  description: string | null;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity: number | null;
  cover_url: string | null;
  gallery_urls: string[] | null;
}

interface Props {
  role: "visitor" | "exhibitor";
  userName: string;
  event: FairEvent;
  sponsors: SponsorRow[];
  participants: Participant[];
  backHref: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function FairDetailClient({ role, userName, event, sponsors, participants, backHref }: Props) {
  const [showParticipants, setShowParticipants] = useState(false);

  const navItems = role === "visitor" ? VISITOR_NAV : EXHIBITOR_NAV;
  const sponsorIds = new Set(sponsors.map((s) => s.exhibitor?.id).filter(Boolean));
  const nonSponsorParticipants = participants.filter((p) => !sponsorIds.has(p.id));

  // Group sponsors by tier
  const sponsorsByTier = sponsors.reduce<Record<number, SponsorRow[]>>((acc, s) => {
    if (!acc[s.tier]) acc[s.tier] = [];
    acc[s.tier].push(s);
    return acc;
  }, {});

  const hasSponsor = sponsors.length > 0;

  return (
    <DashboardShell role={role} userName={userName} navItems={navItems}>
      <div className="p-6 lg:p-8 space-y-8">

        {/* ── Back link ──────────────────────────── */}
        <motion.div initial={{ y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Yaklaşan Fuarlar
          </Link>
        </motion.div>

        {/* ── Hero Image ─────────────────────────── */}
        {(event.cover_url || (event.gallery_urls && event.gallery_urls.length > 0)) && (
          <motion.div
            initial={{ scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.04 }}
            className="relative rounded-2xl overflow-hidden h-52 lg:h-72 border border-white/8"
          >
            <img
              src={event.cover_url ?? event.gallery_urls?.[0] ?? ""}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">{event.name}</h1>
            </div>
          </motion.div>
        )}

        {/* ── Header (no hero) ───────────────────── */}
        {!event.cover_url && (!event.gallery_urls || event.gallery_urls.length === 0) && (
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mb-2">{event.name}</h1>
          </motion.div>
        )}

        {/* ── Meta info ──────────────────────────── */}
        <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(event.start_date)} — {formatDate(event.end_date)}
            </span>
            {event.capacity && (
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {event.capacity.toLocaleString("tr-TR")} kişilik
              </span>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm max-w-3xl">{event.description}</p>
          )}
        </motion.div>

        {/* ── Galeri ─────────────────────────────── */}
        {event.gallery_urls && event.gallery_urls.length > 1 && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Galeri</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {event.gallery_urls.slice(0, 8).map((url) => (
                <div key={url} className="aspect-video rounded-xl overflow-hidden border border-white/8 bg-white/5">
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Sponsor Piramidi ────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-2 mb-5">
            <Crown className="w-5 h-5 text-brand-gold" />
            <h2 className="font-semibold text-white text-lg">Sponsorlar</h2>
          </div>

          {!hasSponsor ? (
            <div className="glass rounded-2xl border border-white/8 p-10 text-center">
              <Crown className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Bu fuar için henüz sponsor belirlenmedi.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((tier) => {
                const tierSponsors = sponsorsByTier[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;
                const meta = TIER_META[tier];
                const Icon = meta.icon;

                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
                        {meta.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-3">
                      {tierSponsors.map((sponsor) => (
                        <div
                          key={sponsor.id}
                          className={`${meta.cols} glass rounded-2xl border ${meta.border} ${meta.bg} p-5 flex flex-col items-center justify-center text-center gap-2`}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-1">
                            <Building2 className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <p className={`font-bold ${meta.labelSize} ${meta.color}`}>
                            {sponsor.exhibitor?.company_name ?? "—"}
                          </p>
                          {sponsor.exhibitor?.tags && sponsor.exhibitor.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {sponsor.exhibitor.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-muted-foreground">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <Badge variant="gold" className="text-xs mt-1">{meta.name}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Katılımcı Firmalar ──────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={() => setShowParticipants((v) => !v)}
            className="w-full glass rounded-2xl border border-white/8 px-6 py-4 flex items-center justify-between hover:border-white/15 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/25 flex items-center justify-center">
                <Store className="w-4 h-4 text-brand-indigo-light" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Katılımcı Firmalar</p>
                <p className="text-xs text-muted-foreground">{nonSponsorParticipants.length} firma · stand yerlerini gör</p>
              </div>
            </div>
            {showParticipants
              ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
            }
          </button>

          {showParticipants && (
            <motion.div
              initial={{ y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden"
            >
              {nonSponsorParticipants.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Sponsorlar dışında başka katılımcı firma bulunmuyor.
                </div>
              ) : (
                nonSponsorParticipants.map((company) => (
                  <div key={company.id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{company.company_name}</p>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {company.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/6 text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {company.booths.length === 0 ? (
                        <span className="text-xs text-muted-foreground/60">Stand yok</span>
                      ) : (
                        company.booths.map((b) => (
                          <div key={b.code} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo-light font-mono">
                            <Grid3X3 className="w-3 h-3" />
                            {b.hall?.name ? `${b.hall.name} / ` : ""}{b.code}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </motion.div>

      </div>
    </DashboardShell>
  );
}
