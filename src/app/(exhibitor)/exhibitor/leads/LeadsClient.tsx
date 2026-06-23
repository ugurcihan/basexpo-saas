"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Panel",            href: "/exhibitor",                icon: LayoutDashboard },
  { label: "Marka Profili",    href: "/exhibitor/profile",        icon: Building2 },
  { label: "QR Yarat",         href: "/exhibitor/qr",             icon: QrCode },
  { label: "Ürünlerim",        href: "/exhibitor/products",       icon: Package },
  { label: "Ziyaretçilerim",   href: "/exhibitor/leads",          icon: Users },
  { label: "Mesajlar",         href: "/exhibitor/messages",       icon: MessageSquare },
  { label: "Analiz AI",        href: "/exhibitor/analytics",      icon: Brain },
  { label: "Yaklaşan Fuarlar", href: "/exhibitor/upcoming-fairs", icon: CalendarClock },
  { label: "Fuar Standlarım",  href: "/exhibitor/my-booths",      icon: Store },
  { label: "Randevu Talepleri", href: "/exhibitor/meeting-requests", icon: CalendarClock },
  { label: "ROI Raporu",          href: "/exhibitor/roi-report",         icon: TrendingUp },
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

interface VisitorInfo {
  id: string;
  full_name: string;
  email: string;
  interests: string[];
  avatar_url: string | null;
}

interface LeadRow {
  id: string;
  source: string;
  score: number;
  note: string | null;
  created_at: string;
  visitor: VisitorInfo | VisitorInfo[];
}

interface ExhibitorMini { id: string; company_name: string }

function getVisitor(v: VisitorInfo | VisitorInfo[]): VisitorInfo | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export function LeadsClient({
  exhibitor,
  leads,
}: {
  exhibitor: ExhibitorMini;
  leads: LeadRow[];
}) {
  return (
    <DashboardShell role="exhibitor" userName="" navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Lead Listesi</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {exhibitor.company_name} · {leads.length} ziyaretçi
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Toplam Lead", value: leads.length, icon: Users },
            { label: "QR Scan", value: leads.filter((l) => l.source === "qr").length, icon: QrCodeIcon },
            { label: "Manuel", value: leads.filter((l) => l.source === "manual").length, icon: Pencil },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-brand-cyan" />
              </div>
              <div>
                <p className="text-xl font-display font-bold text-white">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Lead list */}
        {leads.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-brand-cyan/20 p-12 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-brand-cyan" />
            </div>
            <h2 className="font-display text-lg font-semibold text-white mb-2">Henüz lead yok</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              QR kodunu standında sergilediğinde ziyaretçiler scan yaparak burada görünecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl border border-white/8 hover:border-white/12 transition-all p-5 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-violet/15 border border-brand-violet/20 flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="w-5 h-5 text-brand-violet-light" />
                </div>

                {/* Info */}
                {(() => {
                  const v = getVisitor(lead.visitor);
                  return (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
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
                          <span className="flex items-center gap-0.5 text-xs text-brand-gold">
                            <Star className="w-3 h-3 fill-current" /> {lead.score}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{v?.email}</p>
                      {v?.interests && v.interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {v.interests.slice(0, 3).map((interest) => (
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
                  );
                })()}

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
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
