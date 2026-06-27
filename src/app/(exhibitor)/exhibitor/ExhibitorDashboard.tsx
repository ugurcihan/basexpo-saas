"use client";

import { EXHIBITOR_NAV } from "./_nav";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  Building2,
  QrCode,
  Bell,
  ArrowRight,
  CreditCard,
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
    { label: "Stand Ziyareti",  value: stats?.scanCount?.toString() ?? "0",            color: "text-brand-violet-light" },
    { label: "Ort. Lead Skoru", value: stats?.avgLeadScore != null ? `${stats.avgLeadScore}` : "—",   color: "text-brand-gold" },
  ];

  const showFollowUpBanner = stats?.fairEnded && (stats?.uncalledCount ?? 0) > 0;

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-8">

        {/* Welcome */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Firma Paneli</h1>
          <p className="text-muted-foreground mt-1">
            Hoş geldin, {profile.full_name || "firma temsilcisi"}. Profil, ürün ve QR araçların hazır.
          </p>
        </motion.div>

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

        {/* Setup prompts */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="glass rounded-2xl border border-brand-cyan/20 p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
              <CreditCard className="w-7 h-7 text-brand-cyan" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">Dijital Kartvizit</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Yetkili kişi, telefon, website bilgilerini gir. QR tarandığında gösterilir.
            </p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/exhibitor/card">Kartviziti Düzenle</Link>
            </Button>
          </div>

          <div className="glass rounded-2xl border border-brand-indigo/20 p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
              <QrCode className="w-7 h-7 text-brand-indigo-light" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">QR Lead Capture</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fuara özel QR kodunu al, standında sergile, lead&apos;leri anında topla.
            </p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/exhibitor/card?tab=qr">QR Kodlarım</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
