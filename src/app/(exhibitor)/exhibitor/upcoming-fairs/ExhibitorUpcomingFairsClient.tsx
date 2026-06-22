"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Building2, QrCode, Package, Users,
  MessageSquare, Brain, CalendarClock, Store, Settings,
  MapPin, Calendar, ChevronRight, CheckCircle2,
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

interface FairEvent {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity: number | null;
}

interface Props {
  profile: Profile;
  events: FairEvent[];
  myEventIds: string[];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function ExhibitorUpcomingFairsClient({ profile, events, myEventIds }: Props) {
  const myEventSet = new Set(myEventIds);

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-brand-cyan" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Yaklaşan Fuarlar</h1>
          </div>
          <p className="text-muted-foreground">
            Organizatörlerin yayınladığı fuarları keşfedin, sponsor ve stand bilgilerini görün.
          </p>
        </motion.div>

        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
          >
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-semibold text-white mb-2">Yaklaşan fuar bulunamadı</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Organizatörler fuar yayınladığında burada görünecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {events.map((event, i) => {
              const participating = myEventSet.has(event.id);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="glass rounded-2xl border border-white/8 p-6 hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h2 className="font-semibold text-white text-lg">{event.name}</h2>
                        {event.status === "active" && <Badge variant="cyan">Aktif</Badge>}
                        {event.status === "published" && <Badge variant="default">Yayında</Badge>}
                        {participating && (
                          <Badge variant="gold" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Katılıyorum
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(event.start_date)} — {formatDate(event.end_date)}
                        </span>
                        {event.capacity && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {event.capacity.toLocaleString("tr-TR")} kişilik
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                      <Link href={`/exhibitor/upcoming-fairs/${event.id}`}>
                        Detay <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
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
