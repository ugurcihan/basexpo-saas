"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2,
  Settings, Building2, Search, Grid3X3, Calendar,
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

interface BoothRef { id: string; code: string }
interface EventRef { id: string; name: string }

interface ExhibitorRow {
  id: string;
  company_name: string;
  tags: string[];
  created_at: string;
  event: EventRef | null;
  booths: BoothRef[];
}

interface Props {
  profile: Profile;
  exhibitors: ExhibitorRow[];
}

export function ParticipationRequestsClient({ profile, exhibitors }: Props) {
  const [search, setSearch] = useState("");

  const filtered = exhibitors.filter((ex) => {
    const q = search.toLowerCase();
    return !q || ex.company_name.toLowerCase().includes(q) || (ex.event?.name ?? "").toLowerCase().includes(q);
  });

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-brand-gold" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Katılım Talepleri</h1>
          </div>
          <p className="text-muted-foreground pl-12">{exhibitors.length} katılımcı firma</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Toplam Firma",  value: exhibitors.length },
            { label: "Standlı Firma", value: exhibitors.filter((e) => e.booths.length > 0).length },
            { label: "Stand Bekliyor",value: exhibitors.filter((e) => e.booths.length === 0).length },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/8">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Firma veya fuar adı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "Arama sonucu bulunamadı." : "Henüz katılım talebi yok."}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden"
          >
            {filtered.map((ex) => (
              <div key={ex.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-brand-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{ex.company_name}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ex.event?.name ?? "—"}</span>
                    {ex.booths.map((b) => (
                      <span key={b.id} className="flex items-center gap-1 font-mono text-brand-indigo-light">
                        <Grid3X3 className="w-3 h-3" /> {b.code}
                      </span>
                    ))}
                  </div>
                  {ex.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {ex.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/8 text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant={ex.booths.length > 0 ? "default" : "outline"} className="flex-shrink-0 text-xs">
                  {ex.booths.length > 0 ? `${ex.booths.length} Stand` : "Stand Yok"}
                </Badge>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
