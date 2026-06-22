"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Sparkles, QrCode, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
  MapPin, Calendar, CheckCircle2, Clock,
} from "lucide-react";
import type { Profile } from "@/types";

const NAV_ITEMS = [
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

export function TicketsClient({ profile, registrations }: Props) {
  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Biletlerim</h1>
          </div>
          <p className="text-muted-foreground">
            Kayıt olduğunuz fuarların biletleri.
          </p>
        </motion.div>

        {registrations.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
          >
            <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-semibold text-white mb-2">Henüz biletiniz yok</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Yaklaşan fuarlara kayıt olduğunuzda biletleriniz burada görünecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg, i) => (
              <motion.div
                key={reg.id}
                initial={{ y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className={`glass rounded-2xl border p-6 ${
                  reg.status === "confirmed"
                    ? "border-brand-violet/20"
                    : "border-white/8"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="font-semibold text-white">{reg.event?.name ?? "—"}</h2>
                      {reg.status === "confirmed" ? (
                        <Badge variant="cyan" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Onaylı
                        </Badge>
                      ) : (
                        <Badge variant="gold" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" /> Bekleme
                        </Badge>
                      )}
                    </div>

                    {reg.event && (
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {reg.event.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(reg.event.start_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  {reg.ticket_code && (
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground mb-1">Bilet No</p>
                      <p className="font-mono font-bold text-brand-violet-light text-sm tracking-widest">
                        {reg.ticket_code}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
