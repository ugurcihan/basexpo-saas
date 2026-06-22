"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2,
  Settings, Search, CheckCircle2, Clock, Calendar, Ticket,
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
  { label: "Ayarlar",             href: "/organizer/settings",                 icon: Settings },
];

interface RegistrationRow {
  id: string;
  status: string;
  ticket_code: string | null;
  created_at: string;
  event: { id: string; name: string } | null;
  visitor: { id: string; full_name: string | null; email: string } | null;
}

interface Props {
  profile: Profile;
  registrations: RegistrationRow[];
}

export function OrganizerVisitorsClient({ profile, registrations }: Props) {
  const [search, setSearch] = useState("");

  const filtered = registrations.filter((r) => {
    const name  = (r.visitor?.full_name ?? "").toLowerCase();
    const email = (r.visitor?.email ?? "").toLowerCase();
    const event = (r.event?.name ?? "").toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || email.includes(q) || event.includes(q);
  });

  const confirmed  = registrations.filter((r) => r.status === "confirmed").length;
  const waitlisted = registrations.filter((r) => r.status === "waitlisted").length;

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Ziyaretçilerim</h1>
          </div>
          <p className="text-muted-foreground pl-12">{registrations.length} kayıtlı ziyaretçi</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Toplam",   value: registrations.length, icon: Users,        colorBg: "bg-brand-indigo/15", colorIcon: "text-brand-indigo-light" },
            { label: "Onaylı",   value: confirmed,            icon: CheckCircle2,  colorBg: "bg-green-500/10",    colorIcon: "text-green-400" },
            { label: "Bekleme",  value: waitlisted,           icon: Clock,         colorBg: "bg-orange-500/10",   colorIcon: "text-orange-400" },
          ].map(({ label, value, icon: Icon, colorBg, colorIcon }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/8 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${colorBg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${colorIcon}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="İsim, e-posta veya fuar ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "Arama sonucu bulunamadı." : "Henüz kayıtlı ziyaretçi yok."}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden"
          >
            {filtered.map((reg) => (
              <div key={reg.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-brand-indigo-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">
                    {reg.visitor?.full_name || reg.visitor?.email || "—"}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {reg.event?.name ?? "—"}
                    </span>
                    {reg.ticket_code && (
                      <span className="flex items-center gap-1 font-mono">
                        <Ticket className="w-3 h-3" /> {reg.ticket_code}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={reg.status === "confirmed" ? "default" : "outline"} className="flex-shrink-0">
                  {reg.status === "confirmed" ? "Onaylı" : "Bekleme"}
                </Badge>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
