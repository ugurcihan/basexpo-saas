"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Building2, QrCode, Package, Users,
  MessageSquare, Brain, CalendarClock, Store, Settings,
  TrendingUp
} from "lucide-react";

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
  { label: "Randevu Talepleri", href: "/exhibitor/meeting-requests", icon: CalendarClock },
  { label: "ROI Raporu",          href: "/exhibitor/roi-report",         icon: TrendingUp },
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

export function ExhibitorSettingsClient() {
  return (
    <DashboardShell role="exhibitor" userName="" navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand-cyan" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Ayarlar</h1>
          </div>
          <p className="text-muted-foreground">
            Hesap ve bildirim tercihlerinizi yönetin.
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
            Hesap ve bildirim ayarları burada olacak.
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
