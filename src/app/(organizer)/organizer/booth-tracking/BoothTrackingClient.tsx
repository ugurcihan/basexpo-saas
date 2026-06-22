"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2,
  Settings, Layers, Building2, Brain, Flame, TrendingUp,
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

interface BoothRow {
  id: string; code: string; exhibitor_id: string | null;
}
interface HallRow   { id: string; name: string; floor: number; booths: BoothRow[] }
interface EventRow  { id: string; name: string; status: string; halls: HallRow[] }
interface ScanData  { booth_id: string | null; scanned_at: string }

interface Props {
  profile: Profile;
  events: EventRow[];
  scans: ScanData[];
}

// Renk eşiği: tarama sayısına göre ısı rengi
function heatColor(count: number) {
  if (count === 0) return "border-white/10 bg-white/5 text-muted-foreground/60";
  if (count <= 2)  return "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan";
  if (count <= 5)  return "border-brand-cyan/60 bg-brand-cyan/25 text-brand-cyan";
  if (count <= 10) return "border-brand-gold/50 bg-brand-gold/20 text-brand-gold";
  if (count <= 20) return "border-orange-400/60 bg-orange-500/20 text-orange-400";
  return "border-red-400/70 bg-red-500/25 text-red-400";
}

function heatLabel(count: number) {
  if (count === 0) return "Boş";
  if (count <= 2)  return "Serin";
  if (count <= 5)  return "Ilık";
  if (count <= 10) return "Yoğun";
  if (count <= 20) return "Çok Yoğun";
  return "Kritik";
}

// Saatlik dağılım hesapla → peak hour tahmin
function analyzePeakHours(scans: ScanData[]) {
  const hourCounts: Record<number, number> = {};
  scans.forEach((s) => {
    const h = new Date(s.scanned_at).getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  });
  const sorted = Object.entries(hourCounts)
    .map(([h, c]) => ({ hour: parseInt(h), count: c }))
    .sort((a, b) => b.count - a.count);
  return sorted.slice(0, 3);
}

const STATUS_LABEL: Record<string, string> = {
  published: "Yayında", active: "Aktif", draft: "Taslak", ended: "Bitti",
};

export function BoothTrackingClient({ profile, events, scans }: Props) {
  // booth_id → scan count lookup
  const scanCountByBooth: Record<string, number> = {};
  scans.forEach((s) => {
    if (s.booth_id) scanCountByBooth[s.booth_id] = (scanCountByBooth[s.booth_id] ?? 0) + 1;
  });

  const peakHours = analyzePeakHours(scans);
  const totalScans = scans.length;

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-brand-cyan" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Stand Takip — Isı Haritası</h1>
          </div>
          <p className="text-muted-foreground">QR tarama yoğunluğuna göre renklendirilmiş stand haritası</p>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="flex flex-wrap items-center gap-3 text-xs"
        >
          {[
            { label: "Veri yok", cls: "border-white/10 bg-white/5 text-muted-foreground/60" },
            { label: "1-2 tarama", cls: "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan" },
            { label: "3-5 tarama", cls: "border-brand-cyan/60 bg-brand-cyan/25 text-brand-cyan" },
            { label: "6-10 tarama", cls: "border-brand-gold/50 bg-brand-gold/20 text-brand-gold" },
            { label: "11-20 tarama", cls: "border-orange-400/60 bg-orange-500/20 text-orange-400" },
            { label: "21+ tarama", cls: "border-red-400/70 bg-red-500/25 text-red-400" },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded border ${cls}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* AI Öngörü */}
        {totalScans > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl border border-brand-violet/25 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-brand-violet-light" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-white text-sm">AI Öngörüsü</h3>
                  <Badge variant="violet" className="text-xs">Deneysel</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {totalScans} QR tarama analiz edildi.{" "}
                  {peakHours.length > 0 ? (
                    <>
                      En yoğun saatler:{" "}
                      {peakHours.map((p, i) => (
                        <span key={p.hour} className="text-brand-violet-light font-medium">
                          {String(p.hour).padStart(2, "0")}:00–{String(p.hour + 1).padStart(2, "0")}:00
                          {i < peakHours.length - 1 ? ", " : ""}
                        </span>
                      ))}.
                      {" "}Bu saatlerde A Salonunda personel desteği artırılması önerilir.
                    </>
                  ) : " Yeterli veri yok."}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  {peakHours.slice(0, 3).map((p) => (
                    <div key={p.hour} className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-white font-mono">{String(p.hour).padStart(2, "0")}:00</span>
                      <span className="text-xs text-muted-foreground">({p.count} tarama)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Events + Heatmap */}
        {events.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
            <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Henüz fuar oluşturulmadı.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event, ei) => {
              const allBooths = event.halls.flatMap((h) => h.booths);
              const total  = allBooths.length;
              const filled = allBooths.filter((b) => b.exhibitor_id).length;
              const totalEventScans = allBooths.reduce((sum, b) => sum + (scanCountByBooth[b.id] ?? 0), 0);
              const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + ei * 0.06 }}
                  className="glass rounded-2xl border border-white/8 overflow-hidden"
                >
                  {/* Event header */}
                  <div className="px-6 py-4 border-b border-white/8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-white">{event.name}</h2>
                        <Badge variant={event.status === "published" ? "default" : event.status === "active" ? "cyan" : "outline"}>
                          {STATUS_LABEL[event.status] ?? event.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground font-mono">{filled}/{total} stand dolu</span>
                        {totalEventScans > 0 && (
                          <span className="flex items-center gap-1 text-brand-gold text-xs">
                            <TrendingUp className="w-3.5 h-3.5" /> {totalEventScans} tarama
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">%{pct} dolu</p>
                  </div>

                  {/* Halls */}
                  {event.halls.length === 0 ? (
                    <div className="px-6 py-4 text-xs text-muted-foreground/50">Henüz salon eklenmedi.</div>
                  ) : (
                    event.halls.map((hall) => (
                      <div key={hall.id} className="px-6 py-4 border-b border-white/6 last:border-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Layers className="w-4 h-4 text-brand-indigo-light" />
                          <span className="text-sm font-medium text-white">{hall.name}</span>
                          <span className="text-xs text-muted-foreground">Kat {hall.floor}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {hall.booths.length === 0 ? (
                            <p className="text-xs text-muted-foreground/50">Stand yok</p>
                          ) : (
                            hall.booths.map((booth) => {
                              const scanCnt = scanCountByBooth[booth.id] ?? 0;
                              const colorCls = heatColor(scanCnt);
                              return (
                                <div
                                  key={booth.id}
                                  title={`${booth.exhibitor_id ? "Dolu" : "Boş"} · ${scanCnt} tarama (${heatLabel(scanCnt)})`}
                                  className={`group relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-xs font-mono transition-colors min-w-[52px] ${colorCls}`}
                                >
                                  <span className="font-bold">{booth.code}</span>
                                  {scanCnt > 0 && <span className="text-[10px] opacity-80">{scanCnt}×</span>}
                                  {/* Tooltip */}
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1.5 rounded-lg text-xs bg-black/95 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/10 shadow-lg">
                                    <span className="font-semibold">{booth.exhibitor_id ? "Dolu Stand" : "Boş Stand"}</span>
                                    <br />
                                    <span className="text-muted-foreground">{scanCnt} tarama · {heatLabel(scanCnt)}</span>
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
