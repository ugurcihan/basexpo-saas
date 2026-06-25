"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FloorMapViewer } from "@/components/map/FloorMapViewer";
import {
  LayoutDashboard, Package, QrCode, Users, TrendingUp,
  Settings, MessageSquare, Brain, CalendarClock,
  Store, FileCheck, Map,
  Workflow,
} from "lucide-react";
import type { Profile } from "@/types";
import type { HallWithMap } from "@/features/events/hallMapActions";

const NAV_ITEMS = [
  { label: "Panel",              href: "/exhibitor",                  icon: LayoutDashboard },
  { label: "Marka Profili",      href: "/exhibitor/profile",          icon: Store },
  { label: "QR Kodum",           href: "/exhibitor/qr",               icon: QrCode },
  { label: "Ürünlerim",          href: "/exhibitor/products",         icon: Package },
  { label: "Ziyaretçilerim",     href: "/exhibitor/leads",            icon: Users },
  { label: "Mesajlar",           href: "/exhibitor/messages",         icon: MessageSquare },
  { label: "Analiz AI",          href: "/exhibitor/analytics",        icon: Brain },
  { label: "Yaklaşan Fuarlar",   href: "/exhibitor/upcoming-fairs",   icon: CalendarClock },
  { label: "Fuar Standlarım",    href: "/exhibitor/my-booths",        icon: FileCheck },
  { label: "Fuar Haritası",      href: "/exhibitor/floor-map",        icon: Map },
  { label: "Randevu Talepleri",  href: "/exhibitor/meeting-requests", icon: Users },
  { label: "Satış Pipeline'ı", href: "/exhibitor/pipeline",       icon: Workflow },
  { label: "ROI Raporu",         href: "/exhibitor/roi-report",       icon: TrendingUp },
  { label: "Ayarlar",            href: "/exhibitor/settings",         icon: Settings },
];

interface Props {
  profile: Profile;
  halls: HallWithMap[];
  eventName: string;
  currentUserId: string;
}

export function FloorMapPageClient({ profile, halls, eventName, currentUserId }: Props) {
  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center">
              <Map className="w-5 h-5 text-brand-cyan" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Fuar Haritası</h1>
              {eventName && <p className="text-sm text-muted-foreground">{eventName}</p>}
            </div>
          </div>
        </motion.div>

        {halls.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
            <Map className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-white font-medium">Harita Henüz Hazır Değil</p>
            <p className="text-sm text-muted-foreground mt-1">
              Organizatör kat planlarını yükledikten sonra burada göreceksin.
            </p>
          </div>
        ) : (
          <motion.div initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <FloorMapViewer halls={halls} currentUserId={currentUserId} />
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
