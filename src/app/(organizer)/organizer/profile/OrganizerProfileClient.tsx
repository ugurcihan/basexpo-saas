"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2, Settings,
  FileBarChart
} from "lucide-react";
import type { Profile } from "@/types";

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

export function OrganizerProfileClient({ profile }: { profile: Profile }) {
  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Organizatör Profili</h1>
          </div>
          <p className="text-muted-foreground">
            Organizasyon bilgilerinizi ve marka detaylarınızı yönetin.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass rounded-2xl border border-white/8 p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center flex-shrink-0">
              <UserCircle2 className="w-8 h-8 text-brand-indigo-light" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{profile.full_name || "—"}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Profil düzenleme özellikleri yakında burada olacak.
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
