"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Building2, QrCode, Package, Users,
  MessageSquare, Brain, CalendarClock, Store, Settings,
  Grid3X3, MapPin, Calendar, ChevronRight,
} from "lucide-react";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/exhibitor",                icon: LayoutDashboard },
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

interface HallRow  { id: string; name: string; floor: number; event: EventRow | null }
interface EventRow { id: string; name: string; location: string; start_date: string; end_date: string; status: string }
interface BoothRow { id: string; code: string; hall: HallRow | null }

interface Props {
  profile: Profile;
  booths: BoothRow[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_LABELS: Record<string, string> = {
  published: "Yayında",
  active:    "Aktif",
  draft:     "Taslak",
  ended:     "Bitti",
};

const STATUS_COLORS: Record<string, string> = {
  published: "text-green-400",
  active:    "text-brand-cyan",
  draft:     "text-muted-foreground",
  ended:     "text-orange-400",
};

export function MyBoothsClient({ profile, booths }: Props) {
  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <Store className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Fuar Standlarım</h1>
          </div>
          <p className="text-muted-foreground pl-12">{booths.length} stand — katıldığınız fuarlardaki konumlar</p>
        </motion.div>

        {booths.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
          >
            <Store className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="font-semibold text-white mb-2">Henüz standınız yok</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Bir fuara stand tahsis edildiğinde burada görünecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {booths.map((booth, i) => {
              const event = booth.hall?.event;
              return (
                <motion.div
                  key={booth.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                  className="glass rounded-2xl border border-white/8 p-5 hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-indigo/15 border border-brand-indigo/25 flex items-center justify-center flex-shrink-0">
                      <Grid3X3 className="w-6 h-6 text-brand-indigo-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono font-bold text-white text-lg">{booth.code}</span>
                        {booth.hall && (
                          <span className="text-xs text-muted-foreground">
                            {booth.hall.name} · Kat {booth.hall.floor}
                          </span>
                        )}
                      </div>
                      {event ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-white/90">{event.name}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(event.start_date)} — {formatDate(event.end_date)}
                            </span>
                            <span className={`font-medium ${STATUS_COLORS[event.status] ?? "text-muted-foreground"}`}>
                              {STATUS_LABELS[event.status] ?? event.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Fuar bilgisi bulunamadı</p>
                      )}
                    </div>
                    {event && (
                      <Link
                        href={`/exhibitor/upcoming-fairs/${event.id}`}
                        className="flex items-center gap-1 text-xs text-brand-cyan hover:text-brand-cyan/80 transition-colors flex-shrink-0 mt-1"
                      >
                        Fuar <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
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
