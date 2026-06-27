"use client";

import { EXHIBITOR_NAV } from "../_nav";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Building2, Package, QrCode, Users,
  TrendingUp, Settings, MessageSquare, Brain, CalendarClock,
  Store, Workflow, Phone, Send, CheckCircle2, XCircle,
  Clock, ArrowRight, BadgeDollarSign, Target, Handshake,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Profile } from "@/types";
import type { LeadConversion } from "@/features/leads/roiActions";
import type { FirmMeetingRequest } from "@/features/connections/actions";

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
  { label: "Satış Pipeline'ı",    href: "/exhibitor/pipeline",           icon: Workflow },
  { label: "ROI Raporu",          href: "/exhibitor/roi-report",         icon: TrendingUp },
  { label: "Ayarlar",             href: "/exhibitor/settings",           icon: Settings },
];

const TABS = [
  { id: "fuar",   label: "Fuar",      sub: "Gün 1–5",    icon: QrCode,          color: "brand-indigo" },
  { id: "takip",  label: "Takip",     sub: "Hafta 1–3",  icon: Phone,           color: "brand-cyan" },
  { id: "teklif", label: "Teklif",    sub: "Ay 1–3",     icon: Send,            color: "brand-violet" },
  { id: "karar",  label: "Karar",     sub: "Ay 3–6",     icon: Target,          color: "brand-gold" },
  { id: "sozlesme", label: "Sözleşme", sub: "Ay 6–12",   icon: Handshake,       color: "brand-cyan" },
] as const;

type TabId = typeof TABS[number]["id"];

function formatTL(v: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function VisitorCard({ conv }: { conv: LeadConversion }) {
  const visitor = Array.isArray(conv.visitor) ? conv.visitor[0] : conv.visitor;
  return (
    <div className="glass rounded-xl border border-white/8 p-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{visitor?.full_name ?? "—"}</p>
        <p className="text-xs text-muted-foreground truncate">{visitor?.email ?? "—"}</p>
        {conv.event && (
          <p className="text-xs text-brand-indigo-light mt-1 truncate">{conv.event.name}</p>
        )}
      </div>
      {conv.deal_value_tl && (
        <span className="text-xs font-bold text-brand-cyan flex-shrink-0">{formatTL(conv.deal_value_tl)}</span>
      )}
    </div>
  );
}

function StageHeader({ count, label, color }: { count: number; label: string; color: string }) {
  const colorMap: Record<string, string> = {
    "brand-indigo": "text-brand-indigo-light",
    "brand-cyan":   "text-brand-cyan",
    "brand-violet": "text-brand-violet-light",
    "brand-gold":   "text-brand-gold",
  };
  return (
    <div className="flex items-baseline gap-2 mb-4">
      <span className={`font-display text-4xl font-bold ${colorMap[color] ?? "text-white"}`}>{count}</span>
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass rounded-xl border border-white/8 p-8 text-center text-muted-foreground text-sm">
      {label}
    </div>
  );
}

function TabFuar({ conversions }: { conversions: LeadConversion[] }) {
  const items = conversions.filter((c) => c.deal_status === "lead");
  const total = conversions.length;

  const pipeline = [
    { label: "Temas Edildi",    count: conversions.filter((c) => c.deal_status === "contacted").length,       color: "bg-brand-cyan/20 text-brand-cyan" },
    { label: "Görüşme Yapıldı", count: conversions.filter((c) => c.deal_status === "meeting_held").length,    color: "bg-brand-violet/20 text-brand-violet-light" },
    { label: "Teklif Gönderildi", count: conversions.filter((c) => c.deal_status === "proposal_sent").length, color: "bg-brand-gold/20 text-brand-gold" },
    { label: "Kazanıldı",       count: conversions.filter((c) => c.deal_status === "won").length,             color: "bg-emerald-500/20 text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {pipeline.map(({ label, count, color }) => (
          <div key={label} className="glass rounded-xl border border-white/8 p-4 text-center">
            <p className={`font-display text-2xl font-bold ${color.split(" ")[1]}`}>{count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl border border-white/8 p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold text-white">Pipeline özeti</p>
          <span className="text-xs text-muted-foreground">{total} toplam kayıt</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden flex">
          {pipeline.map(({ count, color }, i) => (
            <div
              key={i}
              className={`h-full ${color.split(" ")[0]} transition-all`}
              style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-white mb-3">Yeni Leadler ({items.length})</p>
        {items.length === 0
          ? <EmptyState label="Henüz pipeline'a alınmış yeni lead yok." />
          : <div className="space-y-2">{items.map((c) => <VisitorCard key={c.id} conv={c} />)}</div>
        }
      </div>

      <Button asChild variant="outline" size="sm" className="border-white/15">
        <Link href="/exhibitor/leads">
          Tüm Lead Listesi
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function TabTakip({ conversions, meetings }: { conversions: LeadConversion[]; meetings: FirmMeetingRequest[] }) {
  const contacted = conversions.filter((c) => c.deal_status === "contacted");
  const pending = meetings.filter((m) => m.status === "pending");
  const accepted = meetings.filter((m) => m.status === "accepted");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl border border-white/8 p-4 text-center">
          <p className="font-display text-2xl font-bold text-brand-cyan">{contacted.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Temas Edildi</p>
        </div>
        <div className="glass rounded-xl border border-white/8 p-4 text-center">
          <p className="font-display text-2xl font-bold text-brand-gold">{pending.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Bekleyen Randevu</p>
        </div>
        <div className="glass rounded-xl border border-white/8 p-4 text-center">
          <p className="font-display text-2xl font-bold text-emerald-400">{accepted.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Onaylı Randevu</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-white mb-3">Temas Edilmiş Leadler ({contacted.length})</p>
        {contacted.length === 0
          ? <EmptyState label="Henüz temas edilmiş lead yok. Leadleri ROI Raporu'ndan güncelleyebilirsin." />
          : <div className="space-y-2">{contacted.map((c) => (
              <div key={c.id} className="glass rounded-xl border border-brand-cyan/20 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {(Array.isArray(c.visitor) ? c.visitor[0] : c.visitor)?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Temas: {formatDate(c.contacted_at)}
                  </p>
                </div>
                <Badge className="bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25 flex-shrink-0">Temas Edildi</Badge>
              </div>
            ))}</div>
        }
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">Bekleyen Randevu Talepleri ({pending.length})</p>
          <div className="space-y-2">
            {pending.map((m) => (
              <div key={m.id} className="glass rounded-xl border border-brand-gold/20 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.visitor?.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{m.subject ?? "Konu belirtilmemiş"} · {formatDate(m.proposed_at)}</p>
                </div>
                <Clock className="w-4 h-4 text-brand-gold flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      <Button asChild variant="outline" size="sm" className="border-white/15">
        <Link href="/exhibitor/meeting-requests">
          Tüm Randevu Talepleri
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function TabTeklif({ conversions }: { conversions: LeadConversion[] }) {
  const meetingHeld = conversions.filter((c) => c.deal_status === "meeting_held");
  const proposalSent = conversions.filter((c) => c.deal_status === "proposal_sent");
  const totalEstimate = proposalSent.reduce((sum, c) => sum + (c.deal_value_tl ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl border border-white/8 p-4 text-center">
          <p className="font-display text-2xl font-bold text-brand-violet-light">{meetingHeld.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Görüşme Yapıldı</p>
        </div>
        <div className="glass rounded-xl border border-white/8 p-4 text-center">
          <p className="font-display text-2xl font-bold text-brand-gold">{proposalSent.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Teklif Gönderildi</p>
        </div>
        <div className="glass rounded-xl border border-white/8 p-4 text-center">
          <p className="font-display text-lg font-bold text-brand-cyan">{totalEstimate > 0 ? formatTL(totalEstimate) : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tahmini Değer</p>
        </div>
      </div>

      {proposalSent.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">Teklif Aşamasındaki Leadler ({proposalSent.length})</p>
          <div className="space-y-2">
            {proposalSent.map((c) => (
              <div key={c.id} className="glass rounded-xl border border-brand-gold/20 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {(Array.isArray(c.visitor) ? c.visitor[0] : c.visitor)?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Görüşme: {formatDate(c.meeting_held_at)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  {c.deal_value_tl && (
                    <p className="text-sm font-bold text-brand-gold">{formatTL(c.deal_value_tl)}</p>
                  )}
                  <Badge className="bg-brand-gold/15 text-brand-gold border-brand-gold/25 text-[10px]">Teklif Aşaması</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {meetingHeld.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">Görüşme Yapılan Leadler ({meetingHeld.length})</p>
          <div className="space-y-2">
            {meetingHeld.map((c) => <VisitorCard key={c.id} conv={c} />)}
          </div>
        </div>
      )}

      {proposalSent.length === 0 && meetingHeld.length === 0 && (
        <EmptyState label="Henüz görüşme veya teklif aşamasında lead yok." />
      )}

      <Button asChild variant="outline" size="sm" className="border-white/15">
        <Link href="/exhibitor/roi-report">
          Pipeline Durumlarını Güncelle
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function TabKarar({ conversions }: { conversions: LeadConversion[] }) {
  const won = conversions.filter((c) => c.deal_status === "won");
  const lost = conversions.filter((c) => c.deal_status === "lost");
  const total = won.length + lost.length;
  const winRate = total > 0 ? Math.round((won.length / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-xl border border-emerald-500/20 p-4 text-center">
          <p className="font-display text-2xl font-bold text-emerald-400">{won.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Kazanıldı</p>
        </div>
        <div className="glass rounded-xl border border-red-500/20 p-4 text-center">
          <p className="font-display text-2xl font-bold text-red-400">{lost.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Kaybedildi</p>
        </div>
        <div className="glass rounded-xl border border-white/8 p-4 text-center">
          <p className={`font-display text-2xl font-bold ${winRate >= 50 ? "text-emerald-400" : "text-brand-gold"}`}>{winRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Kazanma Oranı</p>
        </div>
      </div>

      {won.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">Kazanılan Deallar ({won.length})</p>
          <div className="space-y-2">
            {won.map((c) => (
              <div key={c.id} className="glass rounded-xl border border-emerald-500/20 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {(Array.isArray(c.visitor) ? c.visitor[0] : c.visitor)?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Kapandı: {formatDate(c.closed_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.deal_value_tl && <span className="text-sm font-bold text-emerald-400">{formatTL(c.deal_value_tl)}</span>}
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lost.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-white mb-3">Kaybedilen Deallar ({lost.length})</p>
          <div className="space-y-2">
            {lost.map((c) => (
              <div key={c.id} className="glass rounded-xl border border-red-500/15 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white/60 truncate">
                    {(Array.isArray(c.visitor) ? c.visitor[0] : c.visitor)?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.closed_at)}</p>
                </div>
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && <EmptyState label="Henüz karar aşamasına gelen lead yok." />}
    </div>
  );
}

function TabSozlesme({ conversions }: { conversions: LeadConversion[] }) {
  const won = conversions.filter((c) => c.deal_status === "won");
  const totalRevenue = won.reduce((sum, c) => sum + (c.deal_value_tl ?? 0), 0);
  const totalCost = won.reduce((sum, c) => sum + (c.cost_basis_tl ?? 0), 0);
  const roi = totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl border border-emerald-500/20 p-5 text-center">
          <p className="font-display text-3xl font-bold text-emerald-400">{won.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Kapanan Sözleşme</p>
        </div>
        <div className="glass rounded-xl border border-brand-cyan/20 p-5 text-center">
          <p className="font-display text-2xl font-bold text-brand-cyan">
            {totalRevenue > 0 ? formatTL(totalRevenue) : "—"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Toplam Gelir</p>
        </div>
      </div>

      {roi !== null && (
        <div className={`glass rounded-xl border p-5 text-center ${roi >= 0 ? "border-emerald-500/20" : "border-red-500/20"}`}>
          <p className={`font-display text-4xl font-bold ${roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {roi >= 0 ? "+" : ""}{roi}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">Fuar ROI</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            {formatTL(totalCost)} maliyet · {formatTL(totalRevenue)} gelir
          </p>
        </div>
      )}

      {won.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-white mb-3">Kapanan Sözleşmeler</p>
          <div className="space-y-2">
            {won.map((c) => (
              <div key={c.id} className="glass rounded-xl border border-emerald-500/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {(Array.isArray(c.visitor) ? c.visitor[0] : c.visitor)?.full_name ?? "—"}
                    </p>
                    {c.event && (
                      <p className="text-xs text-muted-foreground truncate">{c.event.name}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {c.deal_value_tl && (
                      <p className="text-sm font-bold text-emerald-400">{formatTL(c.deal_value_tl)}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDate(c.closed_at)}</p>
                  </div>
                </div>
                {c.notes && (
                  <p className="text-xs text-muted-foreground/70 mt-2 border-t border-white/5 pt-2">{c.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState label="Henüz kapanan sözleşme yok. Pipeline'daki leadlerin durumunu 'Kazanıldı' olarak güncelleyerek sözleşme takibi yapabilirsin." />
      )}

      <Button asChild variant="gradient" size="sm">
        <Link href="/exhibitor/roi-report">
          <BadgeDollarSign className="w-4 h-4" />
          ROI Raporunu Görüntüle
        </Link>
      </Button>
    </div>
  );
}

export function PipelineClient({
  profile,
  conversions,
  meetings,
}: {
  profile: Profile;
  conversions: LeadConversion[];
  meetings: FirmMeetingRequest[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>("fuar");

  const tabContent: Record<TabId, React.ReactNode> = {
    fuar:      <TabFuar conversions={conversions} />,
    takip:     <TabTakip conversions={conversions} meetings={meetings} />,
    teklif:    <TabTeklif conversions={conversions} />,
    karar:     <TabKarar conversions={conversions} />,
    sozlesme:  <TabSozlesme conversions={conversions} />,
  };

  const totalWon = conversions.filter((c) => c.deal_status === "won").length;
  const totalRevenue = conversions
    .filter((c) => c.deal_status === "won")
    .reduce((sum, c) => sum + (c.deal_value_tl ?? 0), 0);

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name ?? ""} navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Satış Pipeline&apos;ı</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Fuardan sözleşmeye — her adımda neredesin?
              </p>
            </div>
            {totalRevenue > 0 && (
              <div className="glass rounded-xl border border-emerald-500/20 px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">Toplam Gelir</p>
                <p className="font-display text-lg font-bold text-emerald-400">{formatTL(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground/60">{totalWon} kapanan deal</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tab bar */}
        <motion.div initial={{ y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "glass-strong border border-white/15 text-white"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-brand-cyan" : ""}`} />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] ${isActive ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                    {tab.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Timeline strip */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          {TABS.map((tab, i) => (
            <div key={tab.id} className="flex items-center flex-shrink-0">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  activeTab === tab.id ? "bg-brand-cyan scale-125" : "bg-white/20 hover:bg-white/40"
                }`}
              />
              {i < TABS.length - 1 && (
                <div className={`h-0.5 w-16 ${
                  TABS.findIndex((t) => t.id === activeTab) > i ? "bg-brand-cyan/40" : "bg-white/10"
                }`} />
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground ml-3 flex-shrink-0">
            {TABS.find((t) => t.id === activeTab)?.label} — {TABS.find((t) => t.id === activeTab)?.sub}
          </p>
        </div>

        {/* Tab content */}
        <motion.div
          key={activeTab}
          initial={{ y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tabContent[activeTab]}
        </motion.div>
      </div>
    </DashboardShell>
  );
}
