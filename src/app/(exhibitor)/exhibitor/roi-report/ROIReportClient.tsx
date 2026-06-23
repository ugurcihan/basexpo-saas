"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Building2, Package, QrCode, Users,
  TrendingUp, Settings, MessageSquare, Brain, CalendarClock,
  Store, FileCheck, ChevronDown, Save, Download,
  Trophy, Target, Handshake, BadgeCheck, XCircle,
  MapPin, Phone, Globe, Briefcase, Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateLeadConversion } from "@/features/leads/roiActions";
import type { Profile } from "@/types";
import type { LeadConversion, FairROI } from "@/features/leads/roiActions";

const NAV_ITEMS = [
  { label: "Panel",               href: "/exhibitor",                    icon: LayoutDashboard },
  { label: "Marka Profili",       href: "/exhibitor/profile",            icon: Building2 },
  { label: "QR Yarat",            href: "/exhibitor/qr",                 icon: QrCode },
  { label: "Ürünlerim",           href: "/exhibitor/products",           icon: Package },
  { label: "Ziyaretçilerim",      href: "/exhibitor/leads",              icon: Users },
  { label: "Mesajlar",            href: "/exhibitor/messages",           icon: MessageSquare },
  { label: "Analiz AI",           href: "/exhibitor/analytics",          icon: Brain },
  { label: "Yaklaşan Fuarlar",    href: "/exhibitor/upcoming-fairs",     icon: CalendarClock },
  { label: "Fuar Standlarım",     href: "/exhibitor/my-booths",          icon: Store },
  { label: "Randevu Talepleri",   href: "/exhibitor/meeting-requests",   icon: CalendarClock },
  { label: "ROI Raporu",          href: "/exhibitor/roi-report",         icon: TrendingUp },
  { label: "Ayarlar",             href: "/exhibitor/settings",           icon: Settings },
];

const STATUS_CONFIG = {
  lead:            { label: "Lead",            color: "bg-white/10 text-muted-foreground border-white/15" },
  contacted:       { label: "Temas Edildi",    color: "bg-brand-indigo/15 text-brand-indigo-light border-brand-indigo/25" },
  meeting_held:    { label: "Görüşme Yapıldı", color: "bg-brand-violet/15 text-brand-violet-light border-brand-violet/25" },
  proposal_sent:   { label: "Teklif Gönderildi", color: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  won:             { label: "Kazanıldı",       color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  lost:            { label: "Kaybedildi",      color: "bg-red-500/15 text-red-400 border-red-500/25" },
};

const FUNNEL_STEPS = [
  { key: "total_leads",    label: "Lead",         icon: Users,      color: "brand-indigo" },
  { key: "contacted",      label: "Temas",        icon: Handshake,  color: "brand-violet" },
  { key: "meetings_held",  label: "Görüşme",      icon: CalendarClock, color: "brand-cyan" },
  { key: "proposals_sent", label: "Teklif",       icon: Target,     color: "brand-gold" },
  { key: "deals_won",      label: "Kazanılan",    icon: BadgeCheck, color: "emerald" },
];

function formatTL(val: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 71 ? "text-emerald-400" : score >= 41 ? "text-amber-400" : "text-red-400";
  const borderColor = score >= 71 ? "border-emerald-500/40" : score >= 41 ? "border-amber-500/40" : "border-red-500/40";
  return (
    <div className={`w-32 h-32 rounded-full border-4 ${borderColor} flex flex-col items-center justify-center`}>
      <span className={`font-display text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground">/100</span>
    </div>
  );
}

function FunnelBar({ roi }: { roi: FairROI }) {
  const max = roi.total_leads || 1;
  return (
    <div className="flex items-end gap-3 h-32">
      {FUNNEL_STEPS.map((step) => {
        const val = roi[step.key as keyof FairROI] as number;
        const pct = Math.max(4, Math.round((val / max) * 100));
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-white">{val}</span>
            <div
              className={`w-full rounded-t-lg bg-${step.color === "emerald" ? "emerald-500" : `${step.color}/60`}`}
              style={{ height: `${pct}%` }}
            />
            <div className={`w-8 h-8 rounded-lg bg-${step.color === "emerald" ? "emerald-500/15" : `${step.color}/15`} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 text-${step.color === "emerald" ? "emerald-400" : step.color === "brand-gold" ? "brand-gold" : `${step.color}`}`} />
            </div>
            <span className="text-xs text-muted-foreground text-center leading-tight">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LeadRow({ conv, onUpdate }: {
  conv: LeadConversion;
  onUpdate: (id: string, status: LeadConversion["deal_status"], value: number | null) => void;
}) {
  const [status, setStatus] = useState(conv.deal_status);
  const [value, setValue] = useState(conv.deal_value_tl?.toString() ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await updateLeadConversion(conv.id, {
        deal_status: status,
        deal_value_tl: value ? parseFloat(value) : null,
      });
      onUpdate(conv.id, status, value ? parseFloat(value) : null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const cfg = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-white/8 p-4 flex flex-wrap items-center gap-4"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white text-sm truncate">
          {conv.visitor?.full_name || conv.visitor?.email || "Ziyaretçi"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{conv.visitor?.email}</p>
      </div>

      {/* Status dropdown */}
      <div className="relative">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as LeadConversion["deal_status"])}
          className="glass border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white bg-transparent appearance-none pr-7 cursor-pointer focus:outline-none focus:border-brand-cyan/40"
        >
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k} className="bg-gray-900 text-white">{v.label}</option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Deal value */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          placeholder="Değer (TL)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="glass border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white bg-transparent w-32 focus:outline-none focus:border-brand-cyan/40"
        />
      </div>

      {/* Status badge */}
      <Badge className={`text-xs border ${cfg.color} whitespace-nowrap`}>{cfg.label}</Badge>

      {/* Save */}
      <Button
        size="sm"
        variant="outline"
        className="text-xs border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10"
        onClick={handleSave}
        disabled={isPending}
      >
        {saved ? <BadgeCheck className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saved ? "Kaydedildi" : "Kaydet"}
      </Button>
    </motion.div>
  );
}

export interface ExhibitorInfo {
  company_name: string;
  contact_name: string;
  job_title: string;
  company_size: string | null;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  tags: string[];
}

interface Props {
  profile: Profile;
  roi: FairROI | null;
  conversions: LeadConversion[];
  exhibitorInfo: ExhibitorInfo;
}

export function ROIReportClient({ profile, roi, conversions: initialConversions, exhibitorInfo }: Props) {
  const [conversions, setConversions] = useState(initialConversions);

  function handleLeadUpdate(id: string, status: LeadConversion["deal_status"], value: number | null) {
    setConversions((prev) =>
      prev.map((c) => c.id === id ? { ...c, deal_status: status, deal_value_tl: value } : c)
    );
  }

  function handlePDFDownload() {
    window.print();
  }

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-8 print:p-8 print:space-y-6">

        {/* ── Print-only KOSGEB Belge Başlığı ── */}
        <div className="hidden print:block border-2 border-gray-800 rounded-xl p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">BasExpo</h1>
              <p className="text-sm text-gray-500">AI Destekli Fuar İşletim Sistemi</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">KOSGEB Fuar Katılım ROI Belgesi</p>
              <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div className="h-px bg-gray-200 mb-5" />

          {/* Firma Bilgileri */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Firma Bilgileri</p>
          <div className="grid grid-cols-3 gap-4 text-sm mb-5">
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Firma Adı</p>
              <p className="font-semibold text-gray-800">{exhibitorInfo.company_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Yetkili Kişi</p>
              <p className="font-semibold text-gray-800">{exhibitorInfo.contact_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Görev / Unvan</p>
              <p className="text-gray-700">{exhibitorInfo.job_title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Sektör</p>
              <p className="text-gray-700">{exhibitorInfo.industry ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Firma Büyüklüğü</p>
              <p className="text-gray-700">{exhibitorInfo.company_size ? `${exhibitorInfo.company_size} çalışan` : "—"}</p>
            </div>
            {exhibitorInfo.address && (
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Adres</p>
                <p className="text-gray-700">{exhibitorInfo.address}</p>
              </div>
            )}
          </div>

          {/* Fuar Bilgileri */}
          <div className="h-px bg-gray-200 mb-5" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Katılım Sağlanan Fuar</p>
          {roi?.event_name ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Fuar Adı</p>
                  <p className="font-bold text-gray-800">{roi.event_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Tarih</p>
                  <p className="text-gray-700">
                    {roi.event_start ? formatDate(roi.event_start) : "—"}
                    {roi.event_end ? ` – ${formatDate(roi.event_end)}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Konum / Şehir</p>
                  <p className="text-gray-700">{roi.event_location ?? "—"}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-5">Fuar bilgisi mevcut değil.</p>
          )}

          {/* ROI Özeti */}
          <div className="h-px bg-gray-200 mb-5" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Yatırım Getirisi (ROI) Özeti</p>
          <div className="grid grid-cols-5 gap-3 text-sm mb-2">
            {[
              { label: "Katılım Yatırımı", value: roi?.investment_tl ? formatTL(roi.investment_tl) : "—" },
              { label: "Toplam Lead", value: roi?.total_leads?.toString() ?? "0" },
              { label: "Gerçekleşen Görüşme", value: roi?.meetings_held?.toString() ?? "0" },
              { label: "Kazanılan Anlaşma", value: roi?.deals_won?.toString() ?? "0" },
              { label: "Hesaplanan ROI", value: roi?.roi_percent != null ? `%${roi.roi_percent}` : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="border border-gray-200 rounded-lg p-3 text-center">
                <p className="font-bold text-lg text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-200 mt-5" />
          <p className="text-xs text-gray-400 mt-3">Bu belge BasExpo platformu tarafından otomatik oluşturulmuştur. KOSGEB Fuar Katılım Desteği başvurularında kullanılabilir. Belge doğrulama: basexpo.vercel.app</p>
        </div>

        {/* ── Screen Header ── */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="print:hidden">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-cyan" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">ROI Raporu</h1>
                {roi?.event_name && (
                  <p className="text-sm text-muted-foreground">
                    {roi.event_name} · {formatDate(roi.event_start)} – {formatDate(roi.event_end)}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="gradient"
              className="gap-2"
              onClick={handlePDFDownload}
            >
              <FileCheck className="w-4 h-4" />
              KOSGEB Formatı — PDF İndir
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* ── Firma Bilgileri Kartı ── */}
        <motion.div initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="print:mb-4">
          <div className="glass rounded-2xl border border-brand-cyan/20 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4 h-4 text-brand-cyan" />
              <h2 className="font-semibold text-white">Firma Bilgileri</h2>
              <span className="ml-auto text-xs text-muted-foreground bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full">KOSGEB Belgesi</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Firma Adı</p>
                <p className="text-sm font-semibold text-white">{exhibitorInfo.company_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Yetkili Kişi</p>
                <p className="text-sm font-medium text-white">{exhibitorInfo.contact_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Unvan</p>
                <p className="text-sm text-foreground">{exhibitorInfo.job_title}</p>
              </div>
              {exhibitorInfo.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sektör</p>
                    <p className="text-sm text-foreground">{exhibitorInfo.industry}</p>
                  </div>
                </div>
              )}
              {exhibitorInfo.company_size && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Firma Büyüklüğü</p>
                  <p className="text-sm text-foreground">{exhibitorInfo.company_size} çalışan</p>
                </div>
              )}
              {exhibitorInfo.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Web Sitesi</p>
                    <p className="text-sm text-brand-cyan truncate">{exhibitorInfo.website}</p>
                  </div>
                </div>
              )}
              {exhibitorInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="text-sm text-foreground">{exhibitorInfo.phone}</p>
                  </div>
                </div>
              )}
              {exhibitorInfo.address && (
                <div className="flex items-center gap-2 col-span-2 lg:col-span-3">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adres</p>
                    <p className="text-sm text-foreground">{exhibitorInfo.address}</p>
                  </div>
                </div>
              )}
              {exhibitorInfo.tags.length > 0 && (
                <div className="col-span-2 lg:col-span-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Ürün / Hizmet Kategorileri</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {exhibitorInfo.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-brand-indigo/15 border border-brand-indigo/25 text-brand-indigo-light">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {exhibitorInfo.description && (
                <div className="col-span-2 lg:col-span-3">
                  <p className="text-xs text-muted-foreground mb-1">Firma Açıklaması</p>
                  <p className="text-sm text-foreground line-clamp-2">{exhibitorInfo.description}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {roi ? (
          <>
            {/* KPI cards */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
            >
              {[
                { label: "Yatırım",      value: roi.investment_tl > 0 ? formatTL(roi.investment_tl) : "—", icon: Target,    color: "brand-indigo" },
                { label: "Toplam Lead",  value: roi.total_leads.toString(),                                  icon: Users,     color: "brand-cyan" },
                { label: "Görüşme",      value: roi.meetings_held.toString(),                                icon: Handshake, color: "brand-violet" },
                { label: "Kazanılan",    value: roi.deals_won.toString(),                                    icon: BadgeCheck,color: "emerald" },
                { label: "ROI",          value: roi.roi_percent !== null ? `%${roi.roi_percent}` : "—",      icon: TrendingUp,color: "brand-gold" },
              ].map(({ label, value, icon: Icon, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className={`glass rounded-xl border border-${color === "emerald" ? "emerald-500/20" : `${color}/20`} p-5`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-${color === "emerald" ? "emerald-500/15" : `${color}/15`} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 text-${color === "emerald" ? "emerald-400" : color === "brand-gold" ? "brand-gold" : `${color}`}`} />
                  </div>
                  <p className="font-display text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Score + Funnel */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Fair Performance Score */}
              <div className="glass rounded-2xl border border-white/8 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-5 h-5 text-brand-gold" />
                  <h2 className="font-semibold text-white">Fuar Performans Skoru</h2>
                </div>
                <div className="flex items-center gap-8">
                  <ScoreGauge score={roi.fair_score} />
                  <div className="space-y-3 flex-1">
                    {[
                      { label: "Lead Hacmi",    pct: Math.min(100, Math.round((roi.total_leads / 50) * 100)) },
                      { label: "Etkileşim",     pct: roi.total_leads > 0 ? Math.min(100, Math.round((roi.meetings_held / roi.total_leads) * 400)) : 0 },
                      { label: "Dönüşüm",       pct: roi.total_leads > 0 ? Math.min(100, Math.round((roi.deals_won / roi.total_leads) * 1000)) : 0 },
                      { label: "Lead Kalitesi", pct: 70 },
                    ].map(({ label, pct }) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="text-white font-medium">%{pct}</span>
                        </div>
                        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-indigo to-brand-cyan rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Funnel */}
              <div className="glass rounded-2xl border border-white/8 p-6">
                <h2 className="font-semibold text-white mb-6">Lead Dönüşüm Hunisi</h2>
                <FunnelBar roi={roi} />
                <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                  <span>Dönüşüm: %{roi.conversion_rate}</span>
                  {roi.cost_per_lead && <span>Lead başına: {formatTL(roi.cost_per_lead)}</span>}
                  {roi.revenue_tl > 0 && <span>Toplam gelir: {formatTL(roi.revenue_tl)}</span>}
                </div>
              </div>
            </motion.div>

            {/* Lead status table */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white">Lead Durumu Takibi</h2>
                <span className="text-xs text-muted-foreground">{conversions.length} kayıt</span>
              </div>

              {conversions.length === 0 ? (
                <div className="glass rounded-xl border border-white/8 p-12 text-center">
                  <XCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Henüz lead dönüşüm kaydı yok. Lead listesinden ziyaretçi ekleyebilirsiniz.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversions.map((conv) => (
                    <LeadRow key={conv.id} conv={conv} onUpdate={handleLeadUpdate} />
                  ))}
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <div className="glass rounded-2xl border border-white/8 p-12 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="font-semibold text-white mb-2">ROI verisi bulunamadı</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Aktif fuara katılım ve lead toplamaya başladıktan sonra ROI raporu otomatik oluşur.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
