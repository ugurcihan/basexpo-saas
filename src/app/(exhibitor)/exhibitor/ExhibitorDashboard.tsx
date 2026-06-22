"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard,
  Building2,
  Package,
  QrCode,
  Users,
  TrendingUp,
  Settings,
  MessageSquare,
  Brain,
  CalendarClock,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

const STAT_CARDS = [
  { label: "Toplam Lead", value: "0", color: "text-brand-cyan" },
  { label: "AI Eşleşme Skoru", value: "—", color: "text-brand-indigo-light" },
  { label: "Stand Ziyareti", value: "0", color: "text-brand-violet-light" },
  { label: "Ort. Lead Skoru", value: "—", color: "text-brand-gold" },
];

export function ExhibitorDashboard({ profile }: { profile: Profile }) {
  return (
    <DashboardShell
      role="exhibitor"
      userName={profile.full_name || profile.email}
      navItems={NAV_ITEMS}
    >
      <div className="p-6 lg:p-8 space-y-8">
        {/* Welcome */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">
            Firma Paneli
          </h1>
          <p className="text-muted-foreground mt-1">
            Hoş geldin, {profile.full_name || "firma temsilcisi"}. Profil, ürün ve QR araçların hazır.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {STAT_CARDS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="glass rounded-xl p-5 border border-white/8"
            >
              <p className={`text-3xl font-display font-bold mb-1 ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Setup prompt */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          {/* Profile setup */}
          <div className="glass rounded-2xl border border-brand-cyan/20 p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-brand-cyan" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Firma Profili
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Logo, açıklama ve etiket ekle. AI eşleşmesi profiline göre çalışır.
            </p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/exhibitor/profile">Profili Düzenle</Link>
            </Button>
          </div>

          {/* QR code */}
          <div className="glass rounded-2xl border border-brand-indigo/20 p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
              <QrCode className="w-7 h-7 text-brand-indigo-light" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              QR Lead Capture
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Benzersiz QR kodunu al, standında sergile, lead&apos;leri anında topla.
            </p>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/exhibitor/qr">QR Kodumu Gör</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
