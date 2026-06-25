"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Sparkles, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
  MapPin, Calendar, CheckCircle2, Clock, AlertCircle,
  Download, QrCode,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Puanlarım",      href: "/visitor/loyalty",          icon: Trophy },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

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

  return (
    <DashboardShell role="visitor" userName={visitorName} navItems={NAV_ITEMS}>
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
                        {/* QR code */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
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
  );
}
