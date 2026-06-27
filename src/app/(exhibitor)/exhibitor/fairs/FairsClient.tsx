"use client";

import { EXHIBITOR_NAV } from "../_nav";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock, MapPin, Calendar, ChevronRight, CheckCircle2,
  XCircle, Clock, UserCircle2, QrCode, Store,
} from "lucide-react";
import { respondToMeeting } from "@/features/connections/actions";
import type { Profile } from "@/types";
import type { FirmMeetingRequest } from "@/features/connections/actions";

interface EventInfo { id: string; name: string; location: string; start_date: string; end_date: string; status: string }
interface BoothInfo { id: string; code: string }
interface ExhibitorRow {
  id: string;
  company_name: string;
  qr_token: string;
  event: EventInfo | EventInfo[] | null;
  booths: BoothInfo | BoothInfo[] | null;
}
interface UpcomingEvent { id: string; name: string; location: string; start_date: string; end_date: string; status: string; capacity: number | null }

interface Props {
  profile: Profile;
  myExhibitors: ExhibitorRow[];
  upcomingEvents: UpcomingEvent[];
  meetingRequests: FirmMeetingRequest[];
}

const TABS = [
  { key: "registered", label: "Fuarlarım" },
  { key: "upcoming",   label: "Yaklaşan Fuarlar" },
  { key: "meetings",   label: "Randevular" },
] as const;
type Tab = typeof TABS[number]["key"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function getEvent(e: EventInfo | EventInfo[] | null): EventInfo | null {
  if (!e) return null;
  return Array.isArray(e) ? (e[0] ?? null) : e;
}
function getBooths(b: BoothInfo | BoothInfo[] | null): BoothInfo[] {
  if (!b) return [];
  return Array.isArray(b) ? b : [b];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published: { label: "Yayında",  color: "text-green-400 bg-green-500/15 border-green-500/25" },
  active:    { label: "Aktif",    color: "text-brand-cyan bg-brand-cyan/15 border-brand-cyan/25" },
  draft:     { label: "Taslak",   color: "text-muted-foreground bg-white/8 border-white/12" },
  ended:     { label: "Bitti",    color: "text-orange-400 bg-orange-500/15 border-orange-500/25" },
};

export function FairsClient({ profile, myExhibitors, upcomingEvents, meetingRequests }: Props) {
  const [tab, setTab] = useState<Tab>("registered");
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState(meetingRequests);

  const myEventIds = new Set(myExhibitors.map(ex => {
    const ev = getEvent(ex.event);
    return ev?.id;
  }).filter(Boolean));

  function handleRespond(id: string, action: "accepted" | "declined") {
    startTransition(async () => {
      await respondToMeeting(id, action);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    });
  }

  const pendingMeetings = requests.filter(r => r.status === "pending");
  const pastMeetings    = requests.filter(r => r.status !== "pending");

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">Fuarlarım</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Kayıtlı fuarlar, yaklaşan fırsatlar ve randevular</p>
        </motion.div>

        {/* Tab bar */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.06 }}>
          <div className="flex gap-1 p-1 glass rounded-xl border border-white/8 w-fit">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                  tab === t.key ? "bg-brand-indigo text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {t.label}
                {t.key === "meetings" && pendingMeetings.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pendingMeetings.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Fuarlarım ──────────────────────────────────────────── */}
        {tab === "registered" && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-3">
            {myExhibitors.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-10 text-center">
                <CalendarClock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h2 className="font-display text-lg font-semibold text-white mb-2">Henüz kayıtlı fuar yok</h2>
                <p className="text-muted-foreground text-sm mb-4">Yaklaşan fuarlar sekmesinden fuarlara katıl.</p>
                <Button variant="gradient" size="sm" onClick={() => setTab("upcoming")}>
                  Fuarlara Göz At
                </Button>
              </div>
            ) : (
              myExhibitors.map((ex, i) => {
                const ev = getEvent(ex.event);
                const booths = getBooths(ex.booths);
                const s = STATUS_MAP[ev?.status ?? "draft"] ?? STATUS_MAP.draft;
                return (
                  <motion.div key={ex.id} initial={{ y: 14 }} animate={{ y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl border border-white/8 p-5 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                      <CalendarClock className="w-5 h-5 text-brand-indigo-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white truncate">{ev?.name ?? "Bilinmeyen Fuar"}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev?.location}
                        {ev?.start_date && <> · {formatDate(ev.start_date)}</>}
                      </p>
                      {booths.length > 0 && (
                        <p className="text-xs text-brand-cyan mt-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3" /> Stand: {booths.map(b => b.code).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        href={`/scan/${ex.qr_token}`}
                        target="_blank"
                        className="p-2 rounded-lg text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
                        title="QR Sayfasını Gör"
                      >
                        <QrCode className="w-4 h-4" />
                      </Link>
                      <Link href="/exhibitor/card" className="text-xs text-brand-indigo-light hover:underline flex items-center gap-1">
                        QR <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── Yaklaşan Fuarlar ────────────────────────────────── */}
        {tab === "upcoming" && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-10 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Şu an yayında fuar bulunmuyor.</p>
              </div>
            ) : (
              upcomingEvents.map((ev, i) => {
                const isRegistered = myEventIds.has(ev.id);
                const s = STATUS_MAP[ev.status] ?? STATUS_MAP.draft;
                return (
                  <motion.div key={ev.id} initial={{ y: 14 }} animate={{ y: 0 }} transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl border border-white/8 hover:border-white/12 transition-all p-5 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white truncate">{ev.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.location} · {formatDate(ev.start_date)}
                      </p>
                    </div>
                    {isRegistered ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-400 flex-shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Kayıtlısın
                      </span>
                    ) : (
                      <Button variant="gradient" size="sm" asChild>
                        <Link href="/exhibitor/profile">Katıl</Link>
                      </Button>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── Randevular ─────────────────────────────────────── */}
        {tab === "meetings" && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-4">
            {/* Bekleyen */}
            {pendingMeetings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bekleyen</p>
                {pendingMeetings.map((r, i) => (
                  <motion.div key={r.id} initial={{ y: 12 }} animate={{ y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl border border-amber-500/20 p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-violet/15 border border-brand-violet/20 flex items-center justify-center flex-shrink-0">
                        <UserCircle2 className="w-4 h-4 text-brand-violet-light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{r.visitor?.full_name ?? "Ziyaretçi"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(r.proposed_at).toLocaleString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {r.note && (
                          <p className="text-xs text-muted-foreground mt-1 italic">&quot;{r.note}&quot;</p>
                        )}
                      </div>
                      <Badge className="text-xs bg-amber-500/15 border-amber-500/25 text-amber-400 flex-shrink-0">
                        <Clock className="w-3 h-3 mr-1" />Bekliyor
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="gradient" className="flex-1" disabled={isPending} onClick={() => handleRespond(r.id, "accepted")}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10" disabled={isPending} onClick={() => handleRespond(r.id, "declined")}>
                        <XCircle className="w-3.5 h-3.5" /> Reddet
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Geçmiş */}
            {pastMeetings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geçmiş</p>
                {pastMeetings.map((r, i) => {
                  const isAccepted = r.status === "accepted";
                  return (
                    <motion.div key={r.id} initial={{ y: 12 }} animate={{ y: 0 }} transition={{ delay: i * 0.04 }}
                      className="glass rounded-xl border border-white/8 p-4 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <UserCircle2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{r.visitor?.full_name ?? "Ziyaretçi"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.proposed_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      {isAccepted ? (
                        <Badge variant="cyan" className="text-xs flex-shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />Onaylandı</Badge>
                      ) : (
                        <Badge className="text-xs bg-red-500/15 border-red-500/25 text-red-400 flex-shrink-0"><XCircle className="w-3 h-3 mr-1" />Reddedildi</Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {requests.length === 0 && (
              <div className="glass rounded-2xl border border-white/8 p-10 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Henüz randevu talebi yok.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
