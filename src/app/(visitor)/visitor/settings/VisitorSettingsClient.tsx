"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Sparkles, QrCode, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
} from "lucide-react";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

export function VisitorSettingsClient({ profile }: { profile: Profile }) {
  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Ayarlar</h1>
          </div>
          <p className="text-muted-foreground">
            Bildirim ve hesap tercihlerinizi yönetin.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
        >
          <Settings className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="font-semibold text-white mb-2">Ayarlar yakında</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Bildirim ve gizlilik ayarları burada olacak.
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
