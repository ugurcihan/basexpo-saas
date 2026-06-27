"use client";

import { EXHIBITOR_NAV } from "../_nav";

import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  Building2,
  Package,
  QrCode,
  Users,
  TrendingUp,
  Settings,
  UserCircle2,
  QrCode as QrCodeIcon,
  Pencil,
  Star,
  MessageSquare,
  Brain,
  CalendarClock,
  Store,
  Workflow,
  Search,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Panel",             href: "/exhibitor",                   icon: LayoutDashboard },
  { label: "Marka Profili",     href: "/exhibitor/profile",           icon: Building2 },
  { label: "QR Yarat",          href: "/exhibitor/qr",                icon: QrCode },
  { label: "Ürünlerim",         href: "/exhibitor/products",          icon: Package },
  { label: "Ziyaretçilerim",    href: "/exhibitor/leads",             icon: Users },
  { label: "Mesajlar",          href: "/exhibitor/messages",          icon: MessageSquare },
  { label: "Analiz AI",         href: "/exhibitor/analytics",         icon: Brain },
  { label: "Yaklaşan Fuarlar",  href: "/exhibitor/upcoming-fairs",    icon: CalendarClock },
  { label: "Fuar Standlarım",   href: "/exhibitor/my-booths",         icon: Store },
  { label: "Randevu Talepleri", href: "/exhibitor/meeting-requests",  icon: CalendarClock },
  { label: "Satış Pipeline'ı",  href: "/exhibitor/pipeline",          icon: Workflow },
  { label: "ROI Raporu",        href: "/exhibitor/roi-report",        icon: TrendingUp },
  { label: "Ayarlar",           href: "/exhibitor/settings",          icon: Settings },
];

interface VisitorInfo {
  id: string;
  full_name: string;
  email: string;
  interests: string[];
  avatar_url: string | null;
}

const DEAL_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  lead:          { label: "Yeni",           cls: "bg-white/8 text-muted-foreground border-white/12" },
  contacted:     { label: "Temas Edildi",   cls: "bg-brand-indigo/15 text-brand-indigo-light border-brand-indigo/25" },
  meeting_held:  { label: "Görüşme",        cls: "bg-brand-violet/15 text-brand-violet-light border-brand-violet/25" },
  proposal_sent: { label: "Teklif",         cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  won:           { label: "Kazanıldı",      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  lost:          { label: "Kaybedildi",     cls: "bg-red-500/15 text-red-400 border-red-500/25" },
};

interface LeadRow {
  id: string;
  source: string;
  score: number;
  note: string | null;
  created_at: string;
  visitor: VisitorInfo | VisitorInfo[];
  deal_status?: string | null;
}

interface ExhibitorMini { id: string; company_name: string }

function getVisitor(v: VisitorInfo | VisitorInfo[]): VisitorInfo | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-brand-gold";
  return "text-muted-foreground";
}

export function LeadsClient({
  exhibitor,
  leads,
}: {
  exhibitor: ExhibitorMini;
  leads: LeadRow[];
}) {
  const [search, setSearch] = useState("");

  const filtered = leads.filter((lead) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const v = getVisitor(lead.visitor);
    return (
      (v?.full_name ?? "").toLowerCase().includes(q) ||
      (v?.email ?? "").toLowerCase().includes(q) ||
      (v?.interests ?? []).some((i) => i.toLowerCase().includes(q))
    );
  });

  const highScore = leads.filter((l) => l.score >= 70).length;

  return (
    <DashboardShell role="exhibitor" userName="" navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Ziyaretçilerim</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {exhibitor.company_name} · {leads.length} ziyaretçi
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-4 gap-4"
        >
          {[
            { label: "Toplam Lead",    value: leads.length,                                         icon: Users,      color: "text-brand-cyan" },
            { label: "QR Scan",        value: leads.filter((l) => l.source === "qr").length,        icon: QrCodeIcon, color: "text-brand-indigo-light" },
            { label: "Manuel",         value: leads.filter((l) => l.source === "manual").length,    icon: Pencil,     color: "text-muted-foreground" },
            { label: "Yüksek Skor",    value: highScore,                                            icon: Star,       color: "text-green-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-display font-bold text-white">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Search */}
        {leads.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="İsim, e-posta veya ilgi alanı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Lead list */}
        {leads.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="glass rounded-2xl border border-brand-cyan/20 p-12 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-brand-cyan" />
            </div>
            <h2 className="font-display text-lg font-semibold text-white mb-2">Henüz ziyaretçi yok</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              QR kodunu standında sergilediğinde ziyaretçiler scan yaparak burada görünecek.
            </p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-8 text-center text-muted-foreground text-sm">
            Arama sonucu bulunamadı.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead, i) => {
              const v = getVisitor(lead.visitor);
              return (
                <motion.div
                  key={lead.id}
                  initial={{ y: 14 }}
                  animate={{ y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-xl border border-white/8 hover:border-white/12 transition-all p-5 flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-brand-violet/15 border border-brand-violet/20 flex items-center justify-center flex-shrink-0">
                    <UserCircle2 className="w-5 h-5 text-brand-violet-light" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-medium text-white truncate">
                        {v?.full_name || "İsimsiz Ziyaretçi"}
                      </p>
                      <Badge
                        variant={lead.source === "qr" ? "cyan" : "outline"}
                        className="text-xs flex-shrink-0"
                      >
                        {lead.source === "qr" ? "QR" : "Manuel"}
                      </Badge>
                      {lead.score > 0 && (
                        <span className={`flex items-center gap-0.5 text-xs flex-shrink-0 ${scoreColor(lead.score)}`}>
                          <Star className="w-3 h-3 fill-current" /> {lead.score}
                        </span>
                      )}
                      {lead.deal_status && DEAL_STATUS_LABEL[lead.deal_status] && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border flex-shrink-0 ${DEAL_STATUS_LABEL[lead.deal_status].cls}`}>
                          {DEAL_STATUS_LABEL[lead.deal_status].label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{v?.email}</p>
                    {v?.interests && v.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {v.interests.slice(0, 4).map((interest) => (
                          <span
                            key={interest}
                            className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-muted-foreground"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString("tr-TR")}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(lead.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
