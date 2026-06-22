"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2,
  Settings, Ticket, TrendingUp, Building2, Clock,
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

interface Props {
  profile: Profile;
  totalScans: number;
  registrationCount: number;
  exhibitorCount: number;
  topBooths: { label: string; count: number }[];
  hourlyData: { hour: number; count: number }[];
  events: { id: string; name: string; status: string }[];
}

function BarChart({ data, maxVal, label }: { data: { label: string; count: number }[]; maxVal: number; label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground truncate w-32 flex-shrink-0">{item.label}</span>
          <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${maxVal > 0 ? (item.count / maxVal) * 100 : 0}%` }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-brand-indigo to-brand-cyan rounded-lg"
            />
          </div>
          <span className="text-xs font-mono text-white w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Saatlik Tarama Dağılımı</p>
      <div className="flex items-end gap-0.5 h-24">
        {data.map((d) => (
          <div key={d.hour} className="flex-1 flex flex-col items-center gap-0.5">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / max) * 100}%` }}
              transition={{ duration: 0.6, delay: d.hour * 0.02, ease: "easeOut" }}
              className={`w-full rounded-t transition-colors min-h-[2px] ${
                d.count > max * 0.8 ? "bg-red-400" :
                d.count > max * 0.5 ? "bg-brand-gold" :
                d.count > 0 ? "bg-brand-cyan" : "bg-white/10"
              }`}
              title={`${String(d.hour).padStart(2, "0")}:00 — ${d.count} tarama`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
      </div>
    </div>
  );
}

export function OrganizerAnalyticsClient({
  profile, totalScans, registrationCount, exhibitorCount, topBooths, hourlyData, events,
}: Props) {
  const topBoothMax = Math.max(...topBooths.map((b) => b.count), 1);

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Analiz</h1>
          </div>
          <p className="text-muted-foreground">Tüm fuarlarınızdaki performans ve etkileşim verileri</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Toplam QR Tarama",  value: totalScans,          icon: QrCode,     color: "bg-brand-cyan/15 text-brand-cyan" },
            { label: "Ziyaretçi Kaydı",   value: registrationCount,   icon: Ticket,     color: "bg-brand-indigo/15 text-brand-indigo-light" },
            { label: "Katılımcı Firma",   value: exhibitorCount,       icon: Building2,  color: "bg-brand-gold/15 text-brand-gold" },
            { label: "Aktif Fuar",        value: events.filter((e) => e.status === "published" || e.status === "active").length, icon: CalendarDays, color: "bg-green-500/15 text-green-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/8">
              <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold font-display text-white">{value.toLocaleString("tr-TR")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Hourly chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="glass rounded-2xl border border-white/8 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-brand-cyan" />
              <h2 className="font-semibold text-white text-sm">Saat Bazlı Yoğunluk</h2>
            </div>
            {totalScans === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Henüz tarama verisi yok.</p>
            ) : (
              <HourlyChart data={hourlyData} />
            )}
          </motion.div>

          {/* Top booths */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="glass rounded-2xl border border-white/8 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-brand-gold" />
              <h2 className="font-semibold text-white text-sm">En Çok Taranan Standlar</h2>
            </div>
            {topBooths.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Henüz tarama verisi yok.</p>
            ) : (
              <BarChart data={topBooths} maxVal={topBoothMax} label="" />
            )}
          </motion.div>
        </div>

        {/* Events summary */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <h2 className="font-semibold text-white mb-3">Fuar Listesi</h2>
          <div className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden">
            {events.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Fuar bulunamadı.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <p className="font-medium text-white text-sm">{ev.name}</p>
                  <Badge variant={ev.status === "published" ? "default" : ev.status === "active" ? "cyan" : "outline"}>
                    {ev.status === "published" ? "Yayında" : ev.status === "active" ? "Aktif" : ev.status === "ended" ? "Bitti" : "Taslak"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
