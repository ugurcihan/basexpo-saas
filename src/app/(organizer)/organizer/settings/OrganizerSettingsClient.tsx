"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2, Settings,
  FileBarChart
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Panel",               href: "/organizer",                          icon: LayoutDashboard },
  { label: "Fuarlar",             href: "/organizer/events",                   icon: CalendarDays },
  { label: "Katılım Talepleri",   href: "/organizer/participation-requests",   icon: ClipboardList },
  { label: "Ziyaretçilerim",      href: "/organizer/visitors",                 icon: Users },
  { label: "Görevler",            href: "/organizer/tasks",                    icon: Trophy },
  { label: "Standlar",            href: "/organizer/booths",                   icon: Store },
  { label: "Stand Takip",         href: "/organizer/booth-tracking",           icon: Activity },
  { label: "Mesajlar",            href: "/organizer/messages",                 icon: MessageSquare },
  { label: "Altın QR",            href: "/organizer/golden-qr",                icon: QrCode },
  { label: "Analiz",              href: "/organizer/analytics",                icon: BarChart2 },
  { label: "Marka Profilim",      href: "/organizer/profile",                  icon: UserCircle2 },
  { label: "Fuar Raporu",         href: "/organizer/fair-report",              icon: FileBarChart },
  { label: "Ayarlar",             href: "/organizer/settings",                 icon: Settings },
];

export function OrganizerSettingsClient() {
  return (
    <DashboardShell role="organizer" userName="" navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <Settings className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Ayarlar</h1>
          </div>
          <p className="text-muted-foreground">
            Hesap ve bildirim ayarlarınızı yönetin.
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
            Hesap, bildirim ve entegrasyon ayarları burada olacak.
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
