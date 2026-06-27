"use client";

import { EXHIBITOR_NAV } from "./_nav";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  QrCode,
  Bell,
  ArrowRight,
  CreditCard,
  ClipboardList,
  MapPin,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";

interface DashboardStats {
  leadCount: number;
  scanCount: number;
  avgLeadScore: number | null;
  avgMatchScore: number | null;
  uncalledCount: number;
  fairEnded: boolean;
  surveyResponseCount?: number;
  surveyIsActive?: boolean;
  activeFair?: { name: string; location: string; start_date: string; end_date: string } | null;
}

export function ExhibitorDashboard({
  profile,
  stats,
}: {
  profile: Profile;
  stats: DashboardStats | null;
}) {
  const statCards = [
    { label: "Toplam Lead",     value: stats?.leadCount?.toString() ?? "0",            color: "text-brand-cyan" },
    { label: "AI Eşleşme",      value: stats?.avgMatchScore != null ? `${stats.avgMatchScore}` : "—",  color: "text-brand-indigo-light" },
    { label: "Anket Yanıtı",    value: stats?.surveyResponseCount?.toString() ?? "0",  color: "text-green-400" },
    { label: "Ort. Lead Skoru", value: stats?.avgLeadScore != null ? `${stats.avgLeadScore}` : "—",   color: "text-brand-gold" },
  ];

  const showFollowUpBanner = stats?.fairEnded && (stats?.uncalledCount ?? 0) > 0;
  const activeFair = stats?.activeFair ?? null;

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">

        {/* Welcome */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Firma Paneli</h1>
          <p className="text-muted-foreground mt-1">
            Hoş geldin, {profile.full_name || "firma temsilcisi"}.
          </p>
        </motion.div>

        {/* Active fair banner */}
        {activeFair && (
          <motion.div initial={{ y: 12 }} animate={{ y: 0 }} transition={{ duration: 0.3 }}>
            <Link href="/exhibitor/fairs">
              <div className="glass rounded-2xl border border-brand-indigo/30 bg-brand-indigo/5 p-4 flex items-center gap-4 hover:border-brand-indigo/50 transition-colors cursor-pointer">
                <div className="text-3xl flex-shrink-0">🏟️</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm flex items-center gap-2">
                    {activeFair.name}
                    {activeFair.start_date && daysUntil(activeFair.start_date) > 0 && (
                      <span className="text-brand-cyan font-normal">— {daysUntil(activeFair.start_date)} gün kaldı!</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                    {activeFair.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activeFair.location}</span>}
                    {activeFair.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(activeFair.start_date).toLocaleDateString("tr-TR")}</span>}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-indigo-light flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Follow-up reminder banner */}
        {showFollowUpBanner && (
          <motion.div initial={{ y: 12 }} animate={{ y: 0 }} transition={{ duration: 0.3 }}>
            <Link href="/exhibitor/pipeline">
              <div className="glass rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-center gap-4 hover:border-amber-500/50 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-300 text-sm">Takip Zamanı!</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Fuar sona erdi — <span className="text-amber-300 font-medium">{stats!.uncalledCount} lead</span> henüz pipeline'a taşınmadı. Şimdi takibe al.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="glass rounded-xl p-5 border border-white/8"
            >
              <p className={`text-3xl font-display font-bold mb-1 ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Action cards */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid md:grid-cols-3 gap-4"
        >
          <div className="glass rounded-2xl border border-brand-cyan/20 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6 text-brand-cyan" />
            </div>
            <h3 className="font-display text-base font-semibold text-white mb-1.5">Dijital Kartvizit</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Yetkili kişi, telefon, website bilgilerini gir. QR tarandığında gösterilir.
            </p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/exhibitor/card">Kartviziti Düzenle</Link>
            </Button>
          </div>

          <div className="glass rounded-2xl border border-brand-indigo/20 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6 text-brand-indigo-light" />
            </div>
            <h3 className="font-display text-base font-semibold text-white mb-1.5">QR Lead Capture</h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Fuara özel QR kodunu al, standında sergile, lead&apos;leri anında topla.
            </p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/exhibitor/card?tab=qr">QR Kodlarım</Link>
            </Button>
          </div>

          <div className="glass rounded-2xl border border-green-500/20 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-3">
              <ClipboardList className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="font-display text-base font-semibold text-white mb-1.5">
              Anket
              {stats?.surveyIsActive && (
                <span className="ml-2 text-xs font-normal text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full">Aktif</span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {stats?.surveyResponseCount
                ? `${stats.surveyResponseCount} yanıt toplandı. Sonuçları gör.`
                : "Ziyaretçilere soru sor, ilgi alanlarını ölç."}
            </p>
            <Button variant="outline" size="sm" className="border-green-500/30 text-green-400 hover:bg-green-500/10" asChild>
              <Link href="/exhibitor/card?tab=survey">
                {stats?.surveyResponseCount ? "Sonuçları Gör" : "Anket Oluştur"}
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
