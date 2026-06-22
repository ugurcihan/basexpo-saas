"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, CalendarDays, Building2, BarChart2,
  Settings, Plus, TrendingUp, Users, QrCode, Banknote, CheckCircle2,
  ClipboardList, Trophy, Store, Activity, MessageSquare, UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Stats {
  eventCount: number;
  exhibitorCount: number;
  paidCount: number;
  totalRevenueCents: number;
  leadCount: number;
  visitorCount: number;
}

interface Props {
  profile: Profile;
  stats: Stats;
}

export function OrganizerDashboard({ profile, stats }: Props) {
  const formatTRY = (cents: number) =>
    (cents / 100).toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

  const statCards = [
    { label: "Aktif Fuar",       value: stats.eventCount,     desc: "Toplam fuar sayısı",        icon: CalendarDays, color: "text-brand-indigo-light", bg: "bg-brand-indigo/12" },
    { label: "Kayıtlı Firma",    value: stats.exhibitorCount, desc: `${stats.paidCount} ödeme yaptı`, icon: Building2,   color: "text-brand-cyan",         bg: "bg-brand-cyan/10" },
    { label: "Toplam Lead",      value: stats.leadCount,      desc: `${stats.visitorCount} farklı ziyaretçi`, icon: QrCode, color: "text-brand-violet-light", bg: "bg-brand-violet/12" },
    { label: "Toplam Gelir",     value: formatTRY(stats.totalRevenueCents), desc: "Stand aktivasyon gelirleri", icon: Banknote, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Welcome */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">
            Merhaba, {profile.full_name?.split(" ")[0] || "Organizatör"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">BasExpo yönetim paneline hoş geldin.</p>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="glass rounded-xl p-5 border border-white/8"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-white mb-0.5">{stat.value}</p>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Revenue breakdown */}
        {stats.exhibitorCount > 0 && (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl border border-white/8 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-indigo-light" />
                <h2 className="font-semibold text-white">Ödeme Özeti</h2>
              </div>
              <Link href="/organizer/events" className="text-xs text-brand-indigo-light hover:underline">
                Detaylar →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-white/4 border border-white/6 p-4 text-center">
                <p className="text-xl font-bold text-white">{stats.exhibitorCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Toplam Firma</p>
              </div>
              <div className="rounded-xl bg-green-500/8 border border-green-500/15 p-4 text-center">
                <p className="text-xl font-bold text-green-400">{stats.paidCount}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-400" /> Ödeme Yapan
                </p>
              </div>
              <div className="rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 p-4 text-center">
                <p className="text-xl font-bold text-brand-indigo-light">
                  {stats.exhibitorCount > 0
                    ? Math.round((stats.paidCount / stats.exhibitorCount) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Dönüşüm Oranı</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        {stats.eventCount === 0 && (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass rounded-2xl border border-brand-indigo/20 p-12 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-brand-indigo-light" />
            </div>
            <h2 className="font-display text-xl font-semibold text-white mb-2">İlk Fuarını Oluştur</h2>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Fuar oluştur, salonları ve standları düzenle, firmalar kayıt yapsın.
            </p>
            <Button variant="gradient" asChild>
              <Link href="/organizer/events">
                <Plus className="w-4 h-4" /> Fuar Oluştur
              </Link>
            </Button>
          </motion.div>
        )}

        {stats.eventCount > 0 && (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-3"
          >
            <Button variant="gradient" asChild>
              <Link href="/organizer/events"><CalendarDays className="w-4 h-4" /> Fuarlarım</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/organizer/events/new"><Plus className="w-4 h-4" /> Yeni Fuar</Link>
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
