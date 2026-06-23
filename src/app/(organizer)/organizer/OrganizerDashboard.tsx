"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, CalendarDays, Building2,
  Plus, QrCode, Users2, Map, Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types";
import SendPushForm from "@/components/push/SendPushForm";
import { ORGANIZER_NAV } from "./_nav";

interface Stats {
  eventCount: number;
  exhibitorCount: number;
  leadCount: number;
  visitorCount: number;
}

interface Props {
  profile: Profile;
  stats: Stats;
  events: { id: string; name: string }[];
}

export function OrganizerDashboard({ profile, stats, events }: Props) {
  const statCards = [
    { label: "Aktif Fuar",      value: stats.eventCount,     desc: "Toplam fuar sayısı",           icon: CalendarDays, color: "text-brand-indigo-light", bg: "bg-brand-indigo/12" },
    { label: "Kayıtlı Firma",   value: stats.exhibitorCount, desc: "Fuarlarınızdaki firma sayısı",  icon: Building2,    color: "text-brand-cyan",         bg: "bg-brand-cyan/10" },
    { label: "Toplam Lead",     value: stats.leadCount,      desc: `${stats.visitorCount} ziyaretçi`, icon: QrCode,    color: "text-brand-violet-light", bg: "bg-brand-violet/12" },
    { label: "Ziyaretçi",       value: stats.visitorCount,   desc: "Toplam kayıtlı ziyaretçi",     icon: Users2,       color: "text-brand-gold",         bg: "bg-brand-gold/12" },
  ];

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
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

        {/* Hızlı Erişim */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="font-semibold text-white mb-3">Hızlı Erişim</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Katılımcılar", href: "/organizer/participants", icon: Users2,       color: "brand-indigo" },
              { label: "Harita",       href: "/organizer/events",       icon: Map,          color: "brand-cyan" },
              { label: "Araçlar",      href: "/organizer/tools",        icon: Ticket,       color: "brand-gold" },
              { label: "Raporlar",     href: "/organizer/reports",      icon: Building2,    color: "brand-violet" },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link
                key={label}
                href={href}
                className={`glass rounded-xl border border-${color}/20 p-4 flex flex-col items-center gap-2 hover:border-${color}/40 hover:bg-${color}/5 transition-all`}
              >
                <div className={`w-10 h-10 rounded-xl bg-${color}/15 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${color}`} />
                </div>
                <span className="text-xs font-medium text-white">{label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* CTA - yeni fuar */}
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
            transition={{ delay: 0.35 }}
            className="flex gap-3"
          >
            <Button variant="gradient" asChild>
              <Link href="/organizer/events"><CalendarDays className="w-4 h-4" /> Fuarlarım</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/organizer/events"><Plus className="w-4 h-4" /> Yeni Fuar</Link>
            </Button>
          </motion.div>
        )}

        {/* Push notification panel */}
        <motion.div initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <SendPushForm events={events} />
        </motion.div>
      </div>
    </DashboardShell>
  );
}
