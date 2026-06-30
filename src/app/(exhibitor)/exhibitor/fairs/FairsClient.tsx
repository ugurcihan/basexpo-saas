"use client";

import { EXHIBITOR_NAV } from "../_nav";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CalendarClock, MapPin, Calendar, CheckCircle2,
  XCircle, Clock, UserCircle2, QrCode, X, Send,
  Users, Tag, Info, Mail, Building2, CreditCard, ExternalLink,
} from "lucide-react";
import { respondToMeeting } from "@/features/connections/actions";
import { applyToFair, respondToInvitation } from "@/features/exhibitors/actions";
import type { Profile } from "@/types";
import type { FirmMeetingRequest } from "@/features/connections/actions";
import type { InvitationRow } from "@/features/exhibitors/actions";

interface EventInfo { id: string; name: string; location: string; start_date: string; end_date: string; status: string }
interface ExhibitorRow {
  id: string;
  company_name: string;
  qr_token: string;
  status: string | null;
  event: EventInfo | EventInfo[] | null;
}
interface OrganizerInfo { full_name: string | null; email: string }
interface UpcomingEvent {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity: number | null;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  organizer: OrganizerInfo | OrganizerInfo[] | null;
}

interface Props {
  profile: Profile;
  myExhibitors: ExhibitorRow[];
  upcomingEvents: UpcomingEvent[];
  meetingRequests: FirmMeetingRequest[];
  invitations: InvitationRow[];
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

function getOrganizer(o: OrganizerInfo | OrganizerInfo[] | null): OrganizerInfo | null {
  if (!o) return null;
  return Array.isArray(o) ? (o[0] ?? null) : o;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  published: { label: "Yayında",  color: "text-green-400 bg-green-500/15 border-green-500/25" },
  active:    { label: "Aktif",    color: "text-brand-cyan bg-brand-cyan/15 border-brand-cyan/25" },
  draft:     { label: "Taslak",   color: "text-muted-foreground bg-white/8 border-white/12" },
  ended:     { label: "Bitti",    color: "text-orange-400 bg-orange-500/15 border-orange-500/25" },
};

const APPLICATION_STATUS: Record<string, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  pending:  { label: "Onay Bekliyor", color: "text-amber-400 bg-amber-500/15 border-amber-500/25",   icon: Clock },
  approved: { label: "Onaylandı",     color: "text-green-400 bg-green-500/15 border-green-500/25",   icon: CheckCircle2 },
  rejected: { label: "Reddedildi",    color: "text-red-400 bg-red-500/15 border-red-500/25",         icon: XCircle },
};

// ── Event detail modal ──────────────────────────────────────────
function EventDetailModal({
  event,
  onClose,
  onApply,
  alreadyApplied,
}: {
  event: UpcomingEvent;
  onClose: () => void;
  onApply: (ev: UpcomingEvent) => void;
  alreadyApplied: boolean;
}) {
  const organizer = getOrganizer(event.organizer);
  const s = STATUS_MAP[event.status] ?? STATUS_MAP.draft;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 16 }}
        animate={{ y: 0 }}
        className="w-full max-w-lg glass rounded-2xl border border-white/12 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {event.cover_url ? (
          <div className="h-36 relative overflow-hidden">
            <img src={event.cover_url} alt={event.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="h-20 bg-gradient-to-r from-brand-indigo/30 to-brand-violet/20 relative flex items-center px-6">
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <h2 className="font-display text-xl font-bold text-white">{event.name}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 self-center ${s.color}`}>{s.label}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(event.start_date)} – {formatDate(event.end_date)}</span>
              {event.capacity && (
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {event.capacity} kişi kapasitesi</span>
              )}
              {event.category && (
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {event.category}</span>
              )}
            </div>
          </div>

          {event.description && (
            <div className="glass rounded-xl border border-white/8 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Fuar Hakkında
              </p>
              <p className="text-sm text-white/80 leading-relaxed">{event.description}</p>
            </div>
          )}

          {organizer && (
            <div className="glass rounded-xl border border-white/8 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Organizatör</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="w-4 h-4 text-brand-indigo-light" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{organizer.full_name ?? "Organizatör"}</p>
                  {organizer.email && (
                    <a href={`mailto:${organizer.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-indigo-light transition-colors mt-0.5">
                      <Mail className="w-3 h-3" /> {organizer.email}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/8 flex gap-3">
          {alreadyApplied ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-green-400">
              <CheckCircle2 className="w-4 h-4" /> Zaten kayıtlısın
            </div>
          ) : (
            <Button variant="gradient" className="flex-1" onClick={() => { onClose(); onApply(event); }}>
              Bu Fuara Başvur →
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Kapat</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Invitation detail modal ─────────────────────────────────────
function InvitationDetailModal({
  inv,
  onClose,
  onAccept,
  onReject,
  isPending,
}: {
  inv: InvitationRow;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
}) {
  const organizer = inv.organizer;
  const ev = inv.event;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 16 }}
        animate={{ y: 0 }}
        className="w-full max-w-lg glass rounded-2xl border border-white/12 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover / Header */}
        {ev?.cover_url ? (
          <div className="h-40 relative overflow-hidden">
            <img src={ev.cover_url} alt={ev.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
            <div className="absolute bottom-3 left-4">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-0.5">Fuar Daveti</p>
              <h2 className="font-display text-xl font-bold text-white">{ev.name}</h2>
            </div>
            <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="h-16 bg-gradient-to-r from-brand-indigo/30 to-brand-violet/20 relative flex items-center px-5">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fuar Daveti</p>
              <h2 className="font-display text-lg font-bold text-white">{ev?.name ?? "Fuar"}</h2>
            </div>
            <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Fuar bilgileri */}
          {ev && (
            <div className="flex flex-wrap gap-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ev.location}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(ev.start_date)}
                {ev.end_date && ` – ${formatDate(ev.end_date)}`}
              </span>
              {ev.capacity && (
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {ev.capacity} kişi</span>
              )}
              {ev.category && (
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> {ev.category}</span>
              )}
            </div>
          )}

          {/* Açıklama */}
          {ev?.description && (
            <div className="glass rounded-xl border border-white/8 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Fuar Hakkında
              </p>
              <p className="text-sm text-white/80 leading-relaxed">{ev.description}</p>
            </div>
          )}

          {/* Davet mesajı */}
          {inv.message && (
            <div className="glass rounded-xl border border-brand-indigo/20 p-4">
              <p className="text-xs font-semibold text-brand-indigo-light uppercase tracking-wider mb-2">Organizatör Mesajı</p>
              <p className="text-sm text-white/80 italic">&quot;{inv.message}&quot;</p>
            </div>
          )}

          {/* Organizatör */}
          {organizer && (
            <div className="glass rounded-xl border border-white/8 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Organizatör</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="w-5 h-5 text-brand-indigo-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{organizer.full_name ?? "Organizatör"}</p>
                  {organizer.email && (
                    <a
                      href={`mailto:${organizer.email}`}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-indigo-light transition-colors mt-0.5"
                    >
                      <Mail className="w-3 h-3" /> {organizer.email}
                    </a>
                  )}
                </div>
                <Link
                  href={`/o/${inv.from_organizer_id}`}
                  target="_blank"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-brand-indigo/15 border border-brand-indigo/25 text-brand-indigo-light hover:bg-brand-indigo/25 transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" /> Profil
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {inv.status === "pending" ? (
          <div className="px-5 py-4 border-t border-white/8 flex gap-3">
            <button
              onClick={onAccept}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 className="w-4 h-4" /> Kabul Et & Başvur
            </button>
            <button
              onClick={onReject}
              disabled={isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reddet
            </button>
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-white/10 text-muted-foreground text-sm hover:text-white hover:border-white/20 transition-colors">
              Kapat
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 border-t border-white/8 flex justify-end">
            <button onClick={onClose} className="px-5 py-2 rounded-xl border border-white/10 text-muted-foreground text-sm hover:text-white hover:border-white/20 transition-colors">
              Kapat
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main client ─────────────────────────────────────────────────
export function FairsClient({ profile, myExhibitors, upcomingEvents, meetingRequests, invitations: initialInvitations }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("registered");
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState(meetingRequests);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [applyingTo, setApplyingTo] = useState<UpcomingEvent | null>(null);
  const [applyNote, setApplyNote] = useState("");
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationRow | null>(null);

  const eventExhibitors = myExhibitors.filter(ex => getEvent(ex.event) !== null);

  const myEventIds = new Set<string>();
  const pendingEventIds = new Set<string>();

  eventExhibitors.forEach(ex => {
    const ev = getEvent(ex.event);
    if (ev?.id) {
      myEventIds.add(ev.id);
      if (ex.status === "pending") pendingEventIds.add(ev.id);
    }
  });

  function handleRespond(id: string, action: "accepted" | "declined") {
    startTransition(async () => {
      await respondToMeeting(id, action);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
    });
  }

  function handleRespondInvitation(id: string, status: "accepted" | "rejected") {
    startTransition(async () => {
      await respondToInvitation(id, status);
      setInvitations(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv));
      if (status === "accepted") router.refresh();
    });
  }

  function handleApply() {
    if (!applyingTo) return;
    startTransition(async () => {
      const { error } = await applyToFair(applyingTo.id, applyNote);
      if (error) {
        setApplyError(error);
      } else {
        setAppliedIds(prev => new Set([...prev, applyingTo.id]));
        setApplySuccess(applyingTo.name);
        setApplyingTo(null);
        setApplyNote("");
        setApplyError(null);
        router.refresh();
      }
    });
  }

  const pendingMeetings   = requests.filter(r => r.status === "pending");
  const pastMeetings      = requests.filter(r => r.status !== "pending");
  const pendingInvitations = invitations.filter(inv => inv.status === "pending");
  const pastInvitations    = invitations.filter(inv => inv.status !== "pending");
  const totalPending = pendingMeetings.length + pendingInvitations.length;

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
          <div className="flex gap-1 p-1 glass rounded-xl border border-white/8 w-fit flex-wrap">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                  tab === t.key ? "bg-brand-indigo text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {t.label}
                {t.key === "meetings" && totalPending > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalPending}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Fuarlarım ──────────────────────────────────────────── */}
        {tab === "registered" && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-3">
            {eventExhibitors.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-10 text-center">
                <CalendarClock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <h2 className="font-display text-lg font-semibold text-white mb-2">Henüz kayıtlı fuar yok</h2>
                <p className="text-muted-foreground text-sm mb-4">Yaklaşan fuarlar sekmesinden fuarlara katıl.</p>
                <Button variant="gradient" size="sm" onClick={() => setTab("upcoming")}>
                  Fuarlara Göz At
                </Button>
              </div>
            ) : (
              eventExhibitors.map((ex, i) => {
                const ev = getEvent(ex.event);
                const s = STATUS_MAP[ev?.status ?? "draft"] ?? STATUS_MAP.draft;
                const appStatus = ex.status ? (APPLICATION_STATUS[ex.status] ?? null) : null;
                return (
                  <motion.div key={ex.id} initial={{ y: 14 }} animate={{ y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl border border-white/8 p-5 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                      <CalendarClock className="w-5 h-5 text-brand-indigo-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-white truncate">{ev?.name ?? "Bilinmeyen Fuar"}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${s.color}`}>{s.label}</span>
                        {appStatus && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 flex items-center gap-1 ${appStatus.color}`}>
                            <appStatus.icon className="w-2.5 h-2.5" />
                            {appStatus.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev?.location}
                        {ev?.start_date && <> · {formatDate(ev.start_date)}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ex.status === "approved" && (
                        <>
                          <Link
                            href={`/scan/${ex.qr_token}`}
                            target="_blank"
                            className="p-2 rounded-lg text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
                            title="QR Sayfasını Gör"
                          >
                            <QrCode className="w-4 h-4" />
                          </Link>
                          <Link href={`/exhibitor/card?id=${ex.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                              <CreditCard className="w-3 h-3" /> Kartvizit Düzenle
                            </Button>
                          </Link>
                        </>
                      )}
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
                const isPendingApplication = pendingEventIds.has(ev.id);
                const justApplied = appliedIds.has(ev.id) && !isRegistered;
                const s = STATUS_MAP[ev.status] ?? STATUS_MAP.draft;
                return (
                  <motion.div key={ev.id} initial={{ y: 14 }} animate={{ y: 0 }} transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl border border-white/8 hover:border-white/14 transition-all p-5 flex items-center gap-4 cursor-pointer"
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white truncate">{ev.name}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ev.location} · {formatDate(ev.start_date)}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-1">{ev.description}</p>
                      )}
                    </div>
                    {isPendingApplication ? (
                      <span className="flex items-center gap-1.5 text-xs text-amber-400 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <Clock className="w-4 h-4" /> Onay Bekliyor
                      </span>
                    ) : isRegistered || justApplied ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-400 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <CheckCircle2 className="w-4 h-4" /> {justApplied ? "Başvuruldu" : "Kayıtlısın"}
                      </span>
                    ) : (
                      <Button variant="gradient" size="sm" onClick={(e) => { e.stopPropagation(); setApplyingTo(ev); setApplyError(null); }}>
                        Başvur →
                      </Button>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── Randevular & Davetler ───────────────────────────── */}
        {tab === "meetings" && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-6">

            {/* ─ Davetler ─ */}
            {(pendingInvitations.length > 0 || pastInvitations.length > 0) && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  Organizatör Davetleri
                  {pendingInvitations.length > 0 && (
                    <Badge className="text-[10px] bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30">
                      {pendingInvitations.length} yeni
                    </Badge>
                  )}
                </p>

                {pendingInvitations.map((inv, i) => (
                  <motion.div key={inv.id} initial={{ y: 12 }} animate={{ y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl border border-brand-indigo/25 p-4 space-y-3 cursor-pointer hover:border-brand-indigo/40 transition-colors"
                    onClick={() => setSelectedInvitation(inv)}
                  >
                    <div className="flex items-start gap-3">
                      {inv.event?.cover_url ? (
                        <img src={inv.event.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-brand-indigo-light" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm">{inv.event?.name ?? "Fuar"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {inv.event?.start_date ? formatDate(inv.event.start_date) : ""}
                          {inv.event?.location && <> · <MapPin className="w-3 h-3" /> {inv.event.location}</>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <UserCircle2 className="w-3 h-3 inline mr-1" />
                          {inv.organizer?.full_name ?? "Bilinmiyor"}
                        </p>
                        {inv.message && (
                          <p className="text-xs text-muted-foreground/70 mt-1 italic line-clamp-1">&quot;{inv.message}&quot;</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <Badge className="text-xs bg-brand-indigo/15 border-brand-indigo/25 text-brand-indigo-light">Davet</Badge>
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                          <Info className="w-2.5 h-2.5" /> detay
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="gradient" className="flex-1" disabled={isPending}
                        onClick={() => handleRespondInvitation(inv.id, "accepted")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kabul Et & Başvur
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 border-red-500/20 text-red-400 hover:bg-red-500/10"
                        disabled={isPending} onClick={() => handleRespondInvitation(inv.id, "rejected")}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reddet
                      </Button>
                    </div>
                  </motion.div>
                ))}

                {pastInvitations.map((inv, i) => (
                  <motion.div key={inv.id} initial={{ y: 12 }} animate={{ y: 0 }} transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl border border-white/8 p-4 flex items-center gap-3 cursor-pointer hover:border-white/14 transition-colors"
                    onClick={() => setSelectedInvitation(inv)}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{inv.event?.name ?? "Fuar"}</p>
                      <p className="text-xs text-muted-foreground">{inv.organizer?.full_name ?? ""}</p>
                    </div>
                    {inv.status === "accepted" ? (
                      <Badge variant="cyan" className="text-xs flex-shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />Kabul Edildi</Badge>
                    ) : (
                      <Badge className="text-xs bg-red-500/15 border-red-500/25 text-red-400 flex-shrink-0"><XCircle className="w-3 h-3 mr-1" />Reddedildi</Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* ─ Randevular ─ */}
            <div className="space-y-3">
              {(pendingInvitations.length > 0 || pastInvitations.length > 0) && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ziyaretçi Randevuları</p>
              )}

              {pendingMeetings.length > 0 && (
                <div className="space-y-2">
                  {!pendingInvitations.length && !pastInvitations.length && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bekleyen</p>
                  )}
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

              {pastMeetings.length > 0 && (
                <div className="space-y-2">
                  {!pendingInvitations.length && !pastInvitations.length && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Geçmiş</p>
                  )}
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
                          <p className="text-xs text-muted-foreground">{new Date(r.proposed_at).toLocaleDateString("tr-TR")}</p>
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

              {requests.length === 0 && invitations.length === 0 && (
                <div className="glass rounded-2xl border border-white/8 p-10 text-center">
                  <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Henüz randevu veya davet yok.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Apply success banner */}
      {applySuccess && (
        <div className="fixed bottom-6 right-6 z-50 glass rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 flex items-center gap-3 shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">{applySuccess} başvurusu gönderildi!</p>
            <p className="text-xs text-muted-foreground">Organizatör onayından sonra aktifleşecek.</p>
          </div>
          <button onClick={() => setApplySuccess(null)} className="ml-2 text-muted-foreground hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onApply={(ev) => { setApplyingTo(ev); setApplyError(null); }}
          alreadyApplied={myEventIds.has(selectedEvent.id) || appliedIds.has(selectedEvent.id)}
        />
      )}

      {/* Invitation detail modal */}
      {selectedInvitation && (
        <InvitationDetailModal
          inv={selectedInvitation}
          onClose={() => setSelectedInvitation(null)}
          onAccept={() => { handleRespondInvitation(selectedInvitation.id, "accepted"); setSelectedInvitation(null); }}
          onReject={() => { handleRespondInvitation(selectedInvitation.id, "rejected"); setSelectedInvitation(null); }}
          isPending={isPending}
        />
      )}

      {/* Apply modal */}
      {applyingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            className="w-full max-w-md glass rounded-2xl border border-white/12 p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Fuara Başvur</h2>
                <p className="text-sm text-muted-foreground mt-1">{applyingTo.name}</p>
              </div>
              <button onClick={() => { setApplyingTo(null); setApplyError(null); }} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="glass rounded-xl border border-brand-indigo/20 p-3 text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-brand-indigo-light mb-1">Nasıl çalışır?</p>
                Başvurunuz organizatöre iletilir. Organizatör onayladıktan sonra stand tahsisi yapılır ve QR kodunuz aktifleşir.
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Başvuru Notu (İsteğe bağlı)
                </Label>
                <Textarea
                  placeholder="Fuara neden katılmak istediğinizi, hangi ürün/hizmetleri sergileyeceğinizi kısaca belirtin..."
                  value={applyNote}
                  onChange={(e) => setApplyNote(e.target.value)}
                  className="resize-none h-24"
                />
              </div>

              {applyError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {applyError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="gradient" className="flex-1" disabled={isPending} onClick={handleApply}>
                <Send className="w-3.5 h-3.5" />
                {isPending ? "Gönderiliyor..." : "Başvuruyu Gönder"}
              </Button>
              <Button variant="outline" onClick={() => { setApplyingTo(null); setApplyError(null); }}>
                İptal
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardShell>
  );
}
