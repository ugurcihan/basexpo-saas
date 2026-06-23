"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2,
  Settings, FileBarChart, TrendingUp, Building2, Ticket, Download,
  CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  { label: "Fuar Raporu",         href: "/organizer/fair-report",              icon: FileBarChart },
  { label: "Marka Profilim",      href: "/organizer/profile",                  icon: UserCircle2 },
  { label: "Ayarlar",             href: "/organizer/settings",                 icon: Settings },
];

interface EventRow {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
  capacity: number | null;
  budget_tl: number | null;
}

interface ExhibitorRow {
  event_id: string;
  booth_fee_cents: number | null;
  paid_at: string | null;
}

interface Props {
  profile: Profile;
  events: EventRow[];
  exhibitors: ExhibitorRow[];
  registrations: { event_id: string }[];
  scans: { event_id: string }[];
}

function formatTL(val: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(status: string) {
  switch (status) {
    case "published": return { label: "Yayında", variant: "default" as const };
    case "active":    return { label: "Aktif",   variant: "cyan" as const };
    case "ended":     return { label: "Bitti",   variant: "outline" as const };
    default:          return { label: "Taslak",  variant: "outline" as const };
  }
}

export function FairReportClient({ profile, events, exhibitors, registrations, scans }: Props) {
  // Aggregate totals
  const totalRevenue = exhibitors
    .filter((e) => e.paid_at)
    .reduce((sum, e) => sum + (e.booth_fee_cents ?? 0) / 100, 0);
  const totalPaid = exhibitors.filter((e) => e.paid_at).length;
  const totalExhibitors = exhibitors.length;
  const totalVisitors = new Set(registrations.map((r) => r.event_id)).size; // rough proxy
  const totalScans = scans.length;

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-brand-indigo-light" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Fuar Raporu</h1>
                <p className="text-sm text-muted-foreground">Tüm fuarların gelir, ziyaretçi ve lead özeti</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Download className="w-4 h-4" />
              PDF İndir
            </Button>
          </div>
        </motion.div>

        {/* Global KPIs */}
        <motion.div
          initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Toplam Gelir",    value: formatTL(totalRevenue),  icon: TrendingUp,  color: "brand-cyan" },
            { label: "Ödeme Yapan",     value: `${totalPaid}/${totalExhibitors} Firma`, icon: Building2, color: "brand-indigo" },
            { label: "Ziyaretçi",       value: registrations.length.toString(), icon: Ticket,  color: "brand-violet" },
            { label: "QR Tarama",       value: totalScans.toLocaleString("tr-TR"), icon: QrCode, color: "brand-gold" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`glass rounded-xl border border-${color}/20 p-5`}>
              <div className={`w-8 h-8 rounded-lg bg-${color}/15 flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 text-${color}`} />
              </div>
              <p className="font-display text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Per-event table */}
        <motion.div initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="font-semibold text-white mb-4">Fuar Bazlı Detay</h2>

          {events.length === 0 ? (
            <div className="glass rounded-xl border border-white/8 p-12 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Henüz fuar yok.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => {
                const evExhibitors = exhibitors.filter((e) => e.event_id === ev.id);
                const evPaid = evExhibitors.filter((e) => e.paid_at);
                const evRevenue = evPaid.reduce((sum, e) => sum + (e.booth_fee_cents ?? 0) / 100, 0);
                const evVisitors = registrations.filter((r) => r.event_id === ev.id).length;
                const evScans = scans.filter((s) => s.event_id === ev.id).length;
                const paymentPct = evExhibitors.length > 0 ? Math.round((evPaid.length / evExhibitors.length) * 100) : 0;
                const { label: statusText, variant } = statusLabel(ev.status);

                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="glass rounded-xl border border-white/8 p-5"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{ev.name}</h3>
                          <Badge variant={variant}>{statusText}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(ev.start_date)} – {formatDate(ev.end_date)} · {ev.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-xl font-bold text-brand-cyan">{formatTL(evRevenue)}</p>
                        <p className="text-xs text-muted-foreground">Toplam Gelir</p>
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Firma",     value: `${evExhibitors.length}`, icon: Building2, color: "brand-indigo" },
                        { label: "Ödedi",     value: `${evPaid.length} (%${paymentPct})`, icon: CheckCircle2, color: "emerald" },
                        { label: "Ziyaretçi", value: evVisitors.toString(), icon: Ticket, color: "brand-violet" },
                        { label: "QR Tarama", value: evScans.toString(), icon: QrCode, color: "brand-cyan" },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="text-center">
                          <Icon className={`w-4 h-4 text-${color === "emerald" ? "emerald-400" : color} mx-auto mb-1`} />
                          <p className="text-sm font-bold text-white">{value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Payment progress bar */}
                    {evExhibitors.length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Ödeme Oranı</span>
                          <span>%{paymentPct}</span>
                        </div>
                        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-indigo to-brand-cyan rounded-full transition-all"
                            style={{ width: `${paymentPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {ev.budget_tl && (
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Bütçe: {formatTL(ev.budget_tl)}</span>
                        {evRevenue > 0 && (
                          <span className={`font-medium ${evRevenue >= ev.budget_tl ? "text-emerald-400" : "text-amber-400"}`}>
                            · ROI: %{Math.round(((evRevenue - ev.budget_tl) / ev.budget_tl) * 100)}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
