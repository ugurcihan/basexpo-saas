"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  CalendarDays, Building2, QrCode, Users2,
  Plus, Wrench, BarChart2, MessageSquare,
  MapPin, UserCircle2, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types";
import { ORGANIZER_NAV } from "./_nav";

interface Stats {
  eventCount: number;
  exhibitorCount: number;
  leadCount: number;
  visitorCount: number;
}

interface EventRow {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface Props {
  profile: Profile;
  stats: Stats;
  events: EventRow[];
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active:    { label: "Aktif",    color: "text-green-400 bg-green-500/15 border border-green-500/30" },
  published: { label: "Yayında",  color: "text-brand-gold bg-brand-gold/10 border border-brand-gold/25" },
  draft:     { label: "Taslak",   color: "text-muted-foreground bg-white/8 border border-white/10" },
  ended:     { label: "Bitti",    color: "text-slate-400 bg-slate-500/10 border border-slate-500/20" },
};

export function OrganizerDashboard({ profile, stats, events }: Props) {
  const statCards = [
    { label: "Toplam Fuar",   value: stats.eventCount,     desc: "Oluşturulan fuar sayısı",       icon: CalendarDays, color: "text-brand-indigo-light", bg: "bg-brand-indigo/12" },
    { label: "Kayıtlı Firma", value: stats.exhibitorCount, desc: "Fuarlarınızdaki firma sayısı",   icon: Building2,    color: "text-brand-cyan",          bg: "bg-brand-cyan/10" },
    { label: "Toplam Lead",   value: stats.leadCount,      desc: "QR ile oluşturulan bağlantı",   icon: QrCode,       color: "text-brand-violet-light",  bg: "bg-brand-violet/12" },
    { label: "Ziyaretçi",     value: stats.visitorCount,   desc: "Kayıtlı ziyaretçi sayısı",      icon: Users2,       color: "text-brand-gold",          bg: "bg-brand-gold/12" },
  ];

  const quickLinks = [
    { label: "Fuarlarım",     href: "/organizer/events",        icon: CalendarDays,  color: "brand-indigo" },
    { label: "Katılımcılar",  href: "/organizer/participants",  icon: Users2,        color: "brand-cyan" },
    { label: "Araçlar",       href: "/organizer/tools",         icon: Wrench,        color: "brand-gold" },
    { label: "Raporlar",      href: "/organizer/reports",       icon: BarChart2,     color: "brand-violet" },
    { label: "Mesajlar",      href: "/organizer/messages",      icon: MessageSquare, color: "brand-cyan" },
    { label: "Profilim",      href: "/organizer/profile",       icon: UserCircle2,   color: "brand-indigo" },
  ];

  const recentEvents = events.slice(0, 3);

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Welcome */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">
            Merhaba, {profile.full_name?.split(" ")[0] || "Organizatör"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">BasExpo yönetim paneline hoş geldin.</p>
        </motion.div>

        {/* Stat cards */}
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
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-white mb-0.5">{stat.value}</p>
              <p className="text-sm font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Hızlı Erişim — 3x2 grid */}
        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="font-semibold text-white mb-3">Hızlı Erişim</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickLinks.map(({ label, href, icon: Icon, color }) => (
              <Link
                key={label}
                href={href}
                className={`glass rounded-xl border border-white/8 hover:border-${color}/30 hover:bg-${color}/5 p-4 flex flex-col items-center gap-2 transition-all group`}
              >
                <div className={`w-10 h-10 rounded-xl bg-${color}/12 flex items-center justify-center group-hover:bg-${color}/20 transition-colors`}>
                  <Icon className={`w-5 h-5 text-${color}-light`} />
                </div>
                <span className="text-xs font-medium text-white text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Son Fuarlar */}
        {recentEvents.length > 0 && (
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.32 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-white">Son Fuarlar</h2>
              <Link href="/organizer/events" className="text-xs text-brand-indigo-light hover:underline flex items-center gap-1">
                Tümünü gör <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="glass rounded-2xl border border-white/8 divide-y divide-white/5 overflow-hidden">
              {recentEvents.map((ev) => {
                const s = STATUS_BADGE[ev.status] ?? STATUS_BADGE.draft;
                return (
                  <Link
                    key={ev.id}
                    href={`/organizer/events/${ev.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/4 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-brand-indigo-light transition-colors">{ev.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {new Date(ev.start_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                        {" — "}
                        {new Date(ev.end_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-white transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* İlk fuar CTA */}
        {stats.eventCount === 0 && (
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
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
            animate={{ y: 0 }}
            transition={{ delay: 0.4 }}
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
      </div>
    </DashboardShell>
  );
}
