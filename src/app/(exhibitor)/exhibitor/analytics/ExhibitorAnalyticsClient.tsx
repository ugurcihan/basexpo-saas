"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Building2, QrCode, Package, Users,
  MessageSquare, Brain, CalendarClock, Store, Settings,
  Scan, TrendingUp, Tag, Clock, Target,
} from "lucide-react";
import type { Profile } from "@/types";

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

const TAG_COLORS = [
  "text-brand-cyan bg-brand-cyan/15",
  "text-brand-indigo-light bg-brand-indigo/15",
  "text-brand-gold bg-brand-gold/15",
  "text-brand-violet-light bg-brand-violet/15",
  "text-green-400 bg-green-500/15",
  "text-orange-400 bg-orange-500/15",
];

interface Props {
  profile: Profile;
  totalLeads: number;
  totalScans: number;
  todayScans: number;
  weekScans: number;
  productCount: number;
  hourlyData: { hour: number; count: number }[];
  topTags: { label: string; count: number }[];
}

function HourlyChart({ data }: { data: { hour: number; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Saatlik QR Tarama</p>
      <div className="flex items-end gap-0.5 h-20">
        {data.map((d) => (
          <div key={d.hour} className="flex-1 flex flex-col items-center">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / max) * 100}%` }}
              transition={{ duration: 0.6, delay: d.hour * 0.02 }}
              className={`w-full rounded-t min-h-[2px] ${
                d.count > max * 0.7 ? "bg-brand-gold" : d.count > 0 ? "bg-brand-cyan" : "bg-white/10"
              }`}
              title={`${String(d.hour).padStart(2, "0")}:00 — ${d.count}`}
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

export function ExhibitorAnalyticsClient({
  profile, totalLeads, totalScans, todayScans, weekScans, productCount, hourlyData, topTags,
}: Props) {
  const tagMax = Math.max(...topTags.map((t) => t.count), 1);

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Analiz AI</h1>
          </div>
          <p className="text-muted-foreground">Standınızın performansı ve ziyaretçi ilgi dağılımı</p>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: "Toplam Lead",     value: totalLeads,   icon: Target,   color: "bg-brand-indigo/15 text-brand-indigo-light" },
            { label: "Toplam Tarama",   value: totalScans,   icon: Scan,     color: "bg-brand-cyan/15 text-brand-cyan" },
            { label: "Bu Hafta",        value: weekScans,    icon: TrendingUp, color: "bg-brand-gold/15 text-brand-gold" },
            { label: "Ürün Sayısı",     value: productCount, icon: Package,  color: "bg-green-500/15 text-green-400" },
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
          {/* Hourly */}
          <motion.div
            initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="glass rounded-2xl border border-white/8 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-brand-cyan" />
              <h2 className="font-semibold text-white text-sm">Tarama Dağılımı</h2>
              <span className="ml-auto text-xs text-brand-gold">Bugün: {todayScans}</span>
            </div>
            {totalScans === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Henüz tarama yok.</p>
            ) : (
              <HourlyChart data={hourlyData} />
            )}
          </motion.div>

          {/* Interest tags */}
          <motion.div
            initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="glass rounded-2xl border border-white/8 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-brand-violet-light" />
              <h2 className="font-semibold text-white text-sm">Ziyaretçi İlgi Alanları</h2>
            </div>
            {topTags.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Henüz veri yok.</p>
            ) : (
              <div className="space-y-2.5">
                {topTags.map(({ label, count }, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md w-28 text-center flex-shrink-0 ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                      {label}
                    </span>
                    <div className="flex-1 h-5 bg-white/5 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / tagMax) * 100}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08 }}
                        className={`h-full rounded-lg ${TAG_COLORS[i % TAG_COLORS.length].split(" ")[1].replace("/15", "/50")}`}
                      />
                    </div>
                    <span className="text-xs font-mono text-white w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Insight */}
        <motion.div
          initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
          className="glass rounded-2xl border border-brand-violet/25 p-5"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-brand-violet-light" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm mb-2">AI Ziyaretçi Analizi</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {totalLeads === 0
                  ? "Standınıza henüz ziyaretçi gelmedi. QR kodunuzu görünür bir yere yerleştirin ve ürünlerinizi ekleyin."
                  : topTags.length > 0
                  ? `${totalLeads} ziyaretçinizin en çok "${topTags[0].label}"${topTags[1] ? ` ve "${topTags[1].label}"` : ""} ilgi alanlarına sahip olduğu görülüyor. Bu alanlardaki ürünlerinizi öne çıkararak dönüşüm oranını artırabilirsiniz.`
                  : `${totalLeads} ziyaretçi QR taraması yaptı. Ziyaretçilere ilgi etiketleri eklenerek daha detaylı analiz yapılabilir.`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
