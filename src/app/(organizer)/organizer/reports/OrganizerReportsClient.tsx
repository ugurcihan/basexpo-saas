"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart2, Activity, FileBarChart, QrCode, Ticket, Building2,
  CalendarDays, Clock, TrendingUp, Layers, Brain, Flame,
  FileDown, Users2,
} from "lucide-react";
import type { Profile } from "@/types";
import { ORGANIZER_NAV } from "../_nav";

interface BoothRow { id: string; code: string; exhibitor_id: string | null }
interface HallRow  { id: string; name: string; floor: number; booths: BoothRow[] }
interface EventRow {
  id: string; name: string; status: string;
  location: string | null; start_date: string | null; end_date: string | null;
  capacity: number | null; halls: HallRow[]; category?: string | null;
}
interface ScanData { booth_id: string | null; scanned_at: string; event_id: string }
interface RegData  { id: string; event_id: string; status: string }

interface Props {
  profile: Profile;
  events: EventRow[];
  scans: ScanData[];
  exhibitorCount: number;
  registrationCount: number;
  topBooths: { label: string; count: number }[];
  hourlyData: { hour: number; count: number }[];
  registrations: RegData[];
}

// ─── Charts (Analytics tab) ──────────────────────────────────────────────────

function BarChartViz({ data, maxVal, label }: { data: { label: string; count: number }[]; maxVal: number; label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground truncate w-36 flex-shrink-0">{item.label}</span>
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
              className={`w-full rounded-t min-h-[2px] ${
                d.count > max * 0.8 ? "bg-red-400" :
                d.count > max * 0.5 ? "bg-brand-gold" :
                d.count > 0         ? "bg-brand-cyan" : "bg-white/10"
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

// ─── Heat color (Booth tracking tab) ─────────────────────────────────────────

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

function analyzePeakHours(scans: ScanData[]) {
  const hourCounts: Record<number, number> = {};
  scans.forEach((s) => {
    const h = new Date(s.scanned_at).getHours();
    hourCounts[h] = (hourCounts[h] ?? 0) + 1;
  });
  return Object.entries(hourCounts)
    .map(([h, c]) => ({ hour: parseInt(h), count: c }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

const STATUS_LABEL: Record<string, string> = {
  published: "Yayında", active: "Aktif", draft: "Taslak", ended: "Bitti",
};

// ─── PDF generation ───────────────────────────────────────────────────────────

async function generateEventPDF(event: EventRow, scans: ScanData[], registrations: RegData[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const eventScans = scans.filter((s) => s.event_id === event.id);
  const eventRegs  = registrations.filter((r) => r.event_id === event.id);
  const confirmed  = eventRegs.filter((r) => r.status === "confirmed").length;
  const waitlisted = eventRegs.filter((r) => r.status === "waitlisted").length;
  const pending    = eventRegs.filter((r) => r.status === "pending_approval").length;
  const totalBooths = event.halls.reduce((s, h) => s + h.booths.length, 0);
  const filledBooths = event.halls.reduce((s, h) => s + h.booths.filter((b) => b.exhibitor_id).length, 0);
  const fillPct = totalBooths > 0 ? Math.round((filledBooths / totalBooths) * 100) : 0;

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, "F");

  // Indigo header bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 28, "F");

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("BasExpo Fuar Raporu", 14, 18);

  doc.setFontSize(13);
  doc.setTextColor(30, 30, 60);
  doc.setFont("helvetica", "bold");
  doc.text(event.name, 14, 40);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 130);
  doc.setFont("helvetica", "normal");
  if (event.location)   doc.text(`Konum: ${event.location}`, 14, 48);
  if (event.start_date) doc.text(`Tarih: ${new Date(event.start_date).toLocaleDateString("tr-TR")} — ${event.end_date ? new Date(event.end_date).toLocaleDateString("tr-TR") : ""}`, 14, 54);
  doc.text(`Rapor tarihi: ${new Date().toLocaleDateString("tr-TR")}`, 14, 60);

  doc.setDrawColor(200, 200, 220);
  doc.line(14, 64, 196, 64);

  // Stats row
  const stats = [
    { label: "Onaylı Ziyaretçi", value: String(confirmed) },
    { label: "QR Tarama",        value: String(eventScans.length) },
    { label: "Stand Doluluk",    value: `%${fillPct} (${filledBooths}/${totalBooths})` },
    { label: "Toplam Salon",     value: String(event.halls.length) },
  ];

  let y = 72;
  stats.forEach((s, i) => {
    const x = 14 + (i % 2) * 96;
    if (i % 2 === 0 && i > 0) y += 22;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, y, 88, 16, 3, 3, "F");
    doc.setDrawColor(220, 220, 235);
    doc.roundedRect(x, y, 88, 16, 3, 3, "S");
    doc.setFontSize(11);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text(s.value, x + 8, y + 7);
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 130);
    doc.setFont("helvetica", "normal");
    doc.text(s.label, x + 8, y + 13);
  });

  // Registration status breakdown
  y += 28;
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 60);
  doc.setFont("helvetica", "bold");
  doc.text("Ziyaretçi Durumu", 14, y);
  y += 6;
  [
    { label: "Onaylı",           val: confirmed  },
    { label: "Bekleme Listesi",  val: waitlisted },
    { label: "Onay Bekliyor",    val: pending    },
  ].forEach(({ label, val }) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 100);
    doc.text(`${label}: ${val}`, 18, y);
    y += 5.5;
  });

  // Hall details
  y += 4;
  doc.setDrawColor(200, 200, 220);
  doc.line(14, y, 196, y);
  y += 6;
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 60);
  doc.setFont("helvetica", "bold");
  doc.text("Salon Detayları", 14, y);
  y += 6;

  event.halls.forEach((hall) => {
    if (y > 260) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 297, "F"); y = 20; }
    const hFilled = hall.booths.filter((b) => b.exhibitor_id).length;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, y, 182, 11, 2, 2, "F");
    doc.setDrawColor(220, 220, 235);
    doc.roundedRect(14, y, 182, 11, 2, 2, "S");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 60);
    doc.setFont("helvetica", "bold");
    doc.text(hall.name, 18, y + 7);
    doc.setTextColor(100, 100, 130);
    doc.setFont("helvetica", "normal");
    doc.text(`${hFilled}/${hall.booths.length} dolu · Kat ${hall.floor}`, 140, y + 7);
    y += 14;
  });

  // Footer
  doc.setDrawColor(200, 200, 220);
  doc.line(14, 285, 196, 285);
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 180);
  doc.text("BasExpo · basexpo.com", 14, 291);
  doc.text(`Rapor tarihi: ${new Date().toLocaleString("tr-TR")}`, 110, 291);

  doc.save(`${event.name.replace(/\s+/g, "_")}_raporu.pdf`);
}

// ─── Per-event AI insights ────────────────────────────────────────────────────

const CATEGORY_TIPS: Record<string, string[]> = {
  "teknoloji": [
    "Tech fuarlarında öğleden sonra (13–16) demo talebi zirve yapar — standlara ekstra teknik personel ekleyin.",
    "Demo makineleri ve şarj istasyonları ilgi çekicidir.",
  ],
  "sağlık": [
    "Sağlık fuarlarında sabah saatleri (9–11) profesyoneller için yoğundur.",
    "Broşür ve klinik çalışma özetleri hazır bulundurun.",
  ],
  "gıda": [
    "Gıda fuarlarında öğle arası (12–14) en yoğun periyottur — tadım standlarını bu saatte tam kapasitede tutun.",
    "Paket ürün numuneleri ziyaretçi memnuniyetini artırır.",
  ],
  "otomotiv": [
    "Otomotiv fuarlarında hafta sonu ziyaretçi yoğunluğu %30 daha fazladır.",
    "Test sürüşü organizasyonu beklenti yönetimini kolaylaştırır.",
  ],
  "genel": [
    "Tüm fuarlarda en yoğun saat diliminde stand personelini artırın.",
    "İlk ve son gün ziyaretçi akışı çoğunlukla orta günlere göre daha düşüktür.",
  ],
};

function analyzeEventInsights(
  event: EventRow & { category?: string | null },
  scans: ScanData[],
  registrations: RegData[]
) {
  const eventScans = scans.filter((s) => s.event_id === event.id);
  const eventRegs  = registrations.filter((r) => r.event_id === event.id);
  const category   = (event.category ?? "genel").toLowerCase().trim();

  const peakHours: { hour: number; count: number }[] = [];
  if (eventScans.length > 0) {
    const hourCounts: Record<number, number> = {};
    eventScans.forEach((s) => {
      const h = new Date(s.scanned_at).getHours();
      hourCounts[h] = (hourCounts[h] ?? 0) + 1;
    });
    Object.entries(hourCounts)
      .map(([h, c]) => ({ hour: parseInt(h), count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .forEach((p) => peakHours.push(p));
  }

  const allBooths = event.halls.flatMap((h) => h.booths);
  const fillRate  = allBooths.length > 0 ? Math.round((allBooths.filter((b) => b.exhibitor_id).length / allBooths.length) * 100) : 0;

  const tips = CATEGORY_TIPS[category] ?? CATEGORY_TIPS["genel"];

  return { peakHours, fillRate, tips, scanCount: eventScans.length, regCount: eventRegs.length };
}

function EventAIInsights({
  event,
  scans,
  registrations,
}: {
  event: EventRow & { category?: string | null };
  scans: ScanData[];
  registrations: RegData[];
}) {
  const [open, setOpen] = useState(false);
  const insights = analyzeEventInsights(event, scans, registrations);

  if (insights.scanCount === 0 && insights.regCount === 0) return null;

  return (
    <div className="border-t border-white/8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-3 text-sm text-muted-foreground hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-brand-violet-light" />
          <span>AI Öngörüsü</span>
          {event.category && <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/8 text-muted-foreground">{event.category}</span>}
        </div>
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="px-6 pb-5 space-y-3">
          {insights.peakHours.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Flame className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                En yoğun saatler:{" "}
                {insights.peakHours.map((p, i) => (
                  <span key={p.hour} className="text-brand-violet-light font-medium">
                    {String(p.hour).padStart(2, "0")}:00
                    {i < insights.peakHours.length - 1 ? ", " : ""}
                  </span>
                ))}. Bu saatlerde stand personelini artırın.
              </span>
            </div>
          )}
          {insights.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-brand-violet-light flex-shrink-0">·</span>
              <span className="text-muted-foreground">{tip}</span>
            </div>
          ))}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span>Stand doluluk: <span className="text-white font-medium">%{insights.fillRate}</span></span>
            <span>Toplam kayıt: <span className="text-white font-medium">{insights.regCount}</span></span>
            <span>Toplam tarama: <span className="text-white font-medium">{insights.scanCount}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

export function OrganizerReportsClient({
  profile, events, scans, exhibitorCount, registrationCount,
  topBooths, hourlyData, registrations,
}: Props) {
  const [tab, setTab] = useState<"analytics" | "booths" | "fair">("analytics");

  const tabs = [
    { id: "analytics" as const, label: "Genel Analiz",    icon: BarChart2 },
    { id: "booths" as const,    label: "Stand Takip",      icon: Activity },
    { id: "fair" as const,      label: "Fuar Raporları",   icon: FileBarChart },
  ];

  const topBoothMax = Math.max(...topBooths.map((b) => b.count), 1);

  // Booth tracking state
  const scanCountByBooth: Record<string, number> = {};
  scans.forEach((s) => {
    if (s.booth_id) scanCountByBooth[s.booth_id] = (scanCountByBooth[s.booth_id] ?? 0) + 1;
  });
  const peakHours = analyzePeakHours(scans);

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-brand-cyan" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Raporlar</h1>
          </div>
          <p className="text-muted-foreground pl-12">Analiz, stand takip ve fuar raporlarınız</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/8 pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                tab === t.id
                  ? "border-brand-cyan text-brand-cyan"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Analytics Tab ─────────────────────────────────────────── */}
        {tab === "analytics" && (
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Toplam QR Tarama",  value: scans.length,       icon: QrCode,      color: "bg-brand-cyan/15 text-brand-cyan" },
                { label: "Ziyaretçi Kaydı",   value: registrationCount,  icon: Ticket,       color: "bg-brand-indigo/15 text-brand-indigo-light" },
                { label: "Katılımcı Firma",   value: exhibitorCount,      icon: Building2,   color: "bg-brand-gold/15 text-brand-gold" },
                { label: "Toplam Fuar",       value: events.length,       icon: CalendarDays, color: "bg-green-500/15 text-green-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-xl p-4 border border-white/8">
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold font-display text-white">{value.toLocaleString("tr-TR")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass rounded-2xl border border-white/8 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-brand-cyan" />
                  <h2 className="font-semibold text-white text-sm">Saat Bazlı Yoğunluk</h2>
                </div>
                {scans.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Henüz tarama verisi yok.</p>
                ) : (
                  <HourlyChart data={hourlyData} />
                )}
              </div>
              <div className="glass rounded-2xl border border-white/8 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-brand-gold" />
                  <h2 className="font-semibold text-white text-sm">En Çok Taranan Standlar</h2>
                </div>
                {topBooths.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Henüz tarama verisi yok.</p>
                ) : (
                  <BarChartViz data={topBooths} maxVal={topBoothMax} label="" />
                )}
              </div>
            </div>

            {/* Event list */}
            <div>
              <h2 className="font-semibold text-white mb-3">Fuar Listesi</h2>
              <div className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden">
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Fuar bulunamadı.</p>
                ) : events.map((ev) => (
                  <div key={ev.id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <p className="font-medium text-white text-sm">{ev.name}</p>
                    <Badge variant={ev.status === "published" ? "default" : ev.status === "active" ? "cyan" : "outline"}>
                      {STATUS_LABEL[ev.status] ?? ev.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Booth Tracking Tab ──────────────────────────────────── */}
        {tab === "booths" && (
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {[
                { label: "Veri yok",     cls: "border-white/10 bg-white/5" },
                { label: "1-2 tarama",   cls: "border-brand-cyan/30 bg-brand-cyan/10" },
                { label: "3-5 tarama",   cls: "border-brand-cyan/60 bg-brand-cyan/25" },
                { label: "6-10 tarama",  cls: "border-brand-gold/50 bg-brand-gold/20" },
                { label: "11-20 tarama", cls: "border-orange-400/60 bg-orange-500/20" },
                { label: "21+ tarama",   cls: "border-red-400/70 bg-red-500/25" },
              ].map(({ label, cls }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded border ${cls}`} />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* AI Insight */}
            {scans.length > 0 && (
              <div className="glass rounded-2xl border border-brand-violet/25 p-5">
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
                      {scans.length} QR tarama analiz edildi.{" "}
                      {peakHours.length > 0 && <>
                        En yoğun saatler:{" "}
                        {peakHours.map((p, i) => (
                          <span key={p.hour} className="text-brand-violet-light font-medium">
                            {String(p.hour).padStart(2, "0")}:00–{String(p.hour + 1).padStart(2, "0")}:00
                            {i < peakHours.length - 1 ? ", " : ""}
                          </span>
                        ))}.{" "}Bu saatlerde personel desteği artırılması önerilir.
                      </>}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      {peakHours.map((p) => (
                        <div key={p.hour} className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-xs text-white font-mono">{String(p.hour).padStart(2, "0")}:00</span>
                          <span className="text-xs text-muted-foreground">({p.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Heatmap per event */}
            {events.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
                <Activity className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Henüz fuar oluşturulmadı.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {events.map((event) => {
                  const allBooths = event.halls.flatMap((h) => h.booths);
                  const filled = allBooths.filter((b) => b.exhibitor_id).length;
                  const total  = allBooths.length;
                  const totalEventScans = allBooths.reduce((s, b) => s + (scanCountByBooth[b.id] ?? 0), 0);
                  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

                  return (
                    <div key={event.id} className="glass rounded-2xl border border-white/8 overflow-hidden">
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
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">%{pct} dolu</p>
                      </div>
                      {event.halls.map((hall) => (
                        <div key={hall.id} className="px-6 py-4 border-b border-white/6 last:border-0">
                          <div className="flex items-center gap-2 mb-3">
                            <Layers className="w-4 h-4 text-brand-indigo-light" />
                            <span className="text-sm font-medium text-white">{hall.name}</span>
                            <span className="text-xs text-muted-foreground">Kat {hall.floor}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {hall.booths.length === 0 ? (
                              <p className="text-xs text-muted-foreground/50">Stand yok</p>
                            ) : hall.booths.map((booth) => {
                              const scanCnt = scanCountByBooth[booth.id] ?? 0;
                              return (
                                <div
                                  key={booth.id}
                                  title={`${booth.exhibitor_id ? "Dolu" : "Boş"} · ${scanCnt} tarama (${heatLabel(scanCnt)})`}
                                  className={`group relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-xs font-mono min-w-[52px] ${heatColor(scanCnt)}`}
                                >
                                  <span className="font-bold">{booth.code}</span>
                                  {scanCnt > 0 && <span className="text-[10px] opacity-80">{scanCnt}×</span>}
                                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1.5 rounded-lg text-xs bg-black/95 text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/10 shadow-lg">
                                    <span className="font-semibold">{booth.exhibitor_id ? "Dolu" : "Boş"}</span>
                                    <br /><span className="text-muted-foreground">{scanCnt} tarama · {heatLabel(scanCnt)}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Fair Reports Tab ─────────────────────────────────────── */}
        {tab === "fair" && (
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Toplam Fuar",      value: events.length,       icon: CalendarDays },
                { label: "Toplam Ziyaretçi", value: registrations.filter((r) => r.status === "confirmed").length, icon: Users2 },
                { label: "Toplam Tarama",    value: scans.length,        icon: QrCode },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="glass rounded-xl p-4 border border-white/8">
                  <div className="w-8 h-8 rounded-lg bg-brand-indigo/15 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-brand-indigo-light" />
                  </div>
                  <p className="text-2xl font-bold font-display text-white">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Per-event cards */}
            {events.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
                <FileBarChart className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Fuar bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const eventScans = scans.filter((s) => s.event_id === event.id);
                  const eventRegs  = registrations.filter((r) => r.event_id === event.id && r.status === "confirmed");
                  const allBooths  = event.halls.flatMap((h) => h.booths);
                  const filled     = allBooths.filter((b) => b.exhibitor_id).length;
                  const fillPct    = allBooths.length > 0 ? Math.round((filled / allBooths.length) * 100) : 0;

                  return (
                    <div key={event.id} className="glass rounded-2xl border border-white/8 overflow-hidden">
                      <div className="px-6 py-5 border-b border-white/8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="font-display text-lg font-semibold text-white">{event.name}</h2>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                              {event.location && <span>{event.location}</span>}
                              {event.start_date && (
                                <span>{new Date(event.start_date).toLocaleDateString("tr-TR")}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={event.status === "published" ? "default" : event.status === "active" ? "cyan" : "outline"}>
                              {STATUS_LABEL[event.status] ?? event.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10"
                              onClick={() => generateEventPDF(event, scans, registrations)}
                            >
                              <FileDown className="w-3 h-3" /> PDF İndir
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 py-4 grid grid-cols-3 gap-4">
                        {[
                          { label: "Onaylı Ziyaretçi", value: eventRegs.length,    color: "text-green-400" },
                          { label: "QR Tarama",         value: eventScans.length,   color: "text-brand-cyan" },
                          { label: "Stand Doluluk",     value: `%${fillPct}`,       color: "text-brand-gold" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="text-center">
                            <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                      {/* Fill bar */}
                      <div className="px-6 pb-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Stand Doluluk</span>
                          <span>{filled}/{allBooths.length}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan"
                            style={{ width: `${fillPct}%` }}
                          />
                        </div>
                      </div>

                      {/* AI Öngörüsü */}
                      <EventAIInsights event={event} scans={scans} registrations={registrations} />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
