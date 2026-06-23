"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard,
  Sparkles,
  Heart,
  Users,
  CalendarClock,
  Settings,
  CalendarDays,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

const AI_PLACEHOLDER = [
  { name: "TechVision A.Ş.", tags: ["SaaS", "AI"], score: 94, color: "brand-indigo" },
  { name: "LogiSmart", tags: ["Lojistik", "Tech"], score: 87, color: "brand-cyan" },
  { name: "FinFlow", tags: ["FinTech", "API"], score: 81, color: "brand-violet" },
];

export function VisitorDashboard({ profile }: { profile: Profile }) {
  return (
    <DashboardShell
      role="visitor"
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
            Hoş Geldin!
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile.full_name || "Ziyaretçi"} — Fuarları keşfet, firmalarla eşleş, kişisel biletini al.
          </p>
        </motion.div>

        {/* AI recommendation preview */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-2xl border border-brand-violet/20 p-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-violet-light" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">AI Firma Önerileri</h2>
              <p className="text-xs text-muted-foreground">Faz 5&apos;te ilgi alanlarına göre kişiselleşecek</p>
            </div>
          </div>

          <div className="space-y-3">
            {AI_PLACEHOLDER.map((company, i) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-4 p-3.5 rounded-xl bg-white/3 border border-white/8 opacity-60"
              >
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-muted-foreground">
                    {company.name[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{company.name}</p>
                  <div className="flex gap-1.5 mt-1">
                    {company.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-brand-violet-light">{company.score}%</p>
                  <p className="text-xs text-muted-foreground">eşleşme</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/8 text-center">
            <Button variant="gradient" size="sm" asChild>
              <Link href="/visitor/recommendations">
                <Sparkles className="w-4 h-4" /> Önerileri Gör
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Biletlerim teaser */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass rounded-2xl border border-brand-cyan/20 p-8 flex flex-col items-center text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
            <Ticket className="w-7 h-7 text-brand-cyan" />
          </div>
          <h3 className="font-display text-lg font-semibold text-white mb-2">
            Kişisel QR Biletlerim
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Kayıt olduğun fuarların kişisel QR biletlerini gör. Girişte okutman yeterli.
          </p>
          <Button variant="gradient" size="sm" asChild>
            <Link href="/visitor/tickets">
              <Ticket className="w-4 h-4" /> Biletlerimi Gör
            </Link>
          </Button>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
