"use client";

import { EXHIBITOR_NAV } from "../_nav";

import { useState, useTransition, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import {
  CalendarClock, MapPin, Calendar, ChevronRight, CheckCircle2,
  XCircle, Clock, UserCircle2, QrCode, Store, X, Send,
  Users, Tag, Info, Mail, Building2, Plus, Copy, ExternalLink, Trash2,
} from "lucide-react";
import { respondToMeeting } from "@/features/connections/actions";
import { applyToFair, createStandaloneExhibitor, deleteStandaloneExhibitor } from "@/features/exhibitors/actions";
import type { Profile } from "@/types";
import type { FirmMeetingRequest } from "@/features/connections/actions";

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
}

const TABS = [
  { key: "registered",  label: "Fuarlarım" },
  { key: "upcoming",    label: "Yaklaşan Fuarlar" },
  { key: "standalone",  label: "Bağımsız QR" },
  { key: "meetings",    label: "Randevular" },
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

// ── Standalone QR card ──────────────────────────────────────────
function StandaloneQRCard({ ex, onDelete }: { ex: ExhibitorRow; onDelete: (id: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    setUrl(`${window.location.origin}/scan/${ex.qr_token}`);
  }, [ex.qr_token]);

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ y: 14 }}
      animate={{ y: 0 }}
      className="glass rounded-xl border border-white/8 p-5"
    >
      <div className="flex items-start gap-5">
        {/* QR Code */}
        <div className="flex-shrink-0 p-2.5 bg-white rounded-xl shadow-md">
          {url ? (
            <QRCodeSVG value={url} size={100} level="M" fgColor="#1a1a2e" bgColor="white" />
          ) : (
            <div className="w-[100px] h-[100px] rounded-lg bg-gray-100 animate-pulse" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white">{ex.company_name}</p>
            <Badge className="text-[10px] bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25">Bağımsız</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Herhangi bir etkinlikte, kongre veya toplantıda kullanılabilir.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={copy}>
              {copied ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Kopyalandı!" : "Linki Kopyala"}
            </Button>
            <Link href={`/scan/${ex.qr_token}`} target="_blank">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <ExternalLink className="w-3 h-3" /> Önizle
              </Button>
            </Link>
            <Link href="/exhibitor/card?tab=survey">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 border-brand-violet/30 text-brand-violet-light hover:bg-brand-violet/10">
                Anket Ekle
              </Button>
            </Link>
            <Link href="/exhibitor/card">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <QrCode className="w-3 h-3" /> Kartviziti Düzenle
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10"
              disabled={deleting}
              onClick={() => startDelete(async () => { await deleteStandaloneExhibitor(ex.id); onDelete(ex.id); })}
            >
              <Trash2 className="w-3 h-3" /> Sil
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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

// ── Main client ─────────────────────────────────────────────────
export function FairsClient({ profile, myExhibitors, upcomingEvents, meetingRequests }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("registered");
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState(meetingRequests);
  const [applyingTo, setApplyingTo] = useState<UpcomingEvent | null>(null);
  const [applyNote, setApplyNote] = useState("");
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<UpcomingEvent | null>(null);

  // Standalone QR state
  const [standaloneLabel, setStandaloneLabel] = useState("");
  const [standaloneCreating, startStandaloneCreate] = useTransition();
  const [standaloneError, setStandaloneError] = useState<string | null>(null);
  const [localStandalone, setLocalStandalone] = useState<ExhibitorRow[]>([]);

  const eventExhibitors   = myExhibitors.filter(ex => getEvent(ex.event) !== null);
  const standaloneFromDB  = myExhibitors.filter(ex => getEvent(ex.event) === null);
  const standaloneAll     = [...standaloneFromDB, ...localStandalone];

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

  function handleCreateStandalone() {
    const label = standaloneLabel.trim() || (profile.full_name ? `${profile.full_name} — Bağımsız QR` : "Bağımsız QR");
    startStandaloneCreate(async () => {
      const { error, qrToken } = await createStandaloneExhibitor(label);
      if (error) {
        setStandaloneError(error);
      } else {
        setStandaloneError(null);
        setStandaloneLabel("");
        router.refresh();
      }
    });
  }

  function handleDeleteStandalone(id: string) {
    setLocalStandalone(prev => prev.filter(e => e.id !== id));
    router.refresh();
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
                    {ex.status !== "pending" && ex.status !== "rejected" && (
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
                    )}
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

        {/* ── Bağımsız QR ─────────────────────────────────────── */}
        {tab === "standalone" && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-5">
            {/* Info banner */}
            <div className="glass rounded-xl border border-brand-cyan/20 p-4 flex gap-3">
              <QrCode className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-white font-medium">Bağımsız QR</span> — Herhangi bir fuara bağlı olmayan dijital kartvizit QR kodları oluştur.
                Kongreler, workshoplar, iş toplantıları veya sosyal etkinliklerde kullanabilirsin.
                QR tarandığında ziyaretçiler dijital kartvizitin görür; anket ekleyebilirsin.
              </div>
            </div>

            {/* Create new */}
            <div className="glass rounded-xl border border-white/10 p-5 space-y-3">
              <p className="text-sm font-semibold text-white">Yeni Bağımsız QR Oluştur</p>
              <div className="flex gap-3">
                <Input
                  placeholder='Etiket — örn. "Kongre 2026", "Genel QR" (isteğe bağlı)'
                  value={standaloneLabel}
                  onChange={e => setStandaloneLabel(e.target.value)}
                  className="flex-1"
                  onKeyDown={e => { if (e.key === "Enter") handleCreateStandalone(); }}
                />
                <Button
                  variant="gradient"
                  className="gap-2 flex-shrink-0"
                  disabled={standaloneCreating}
                  onClick={handleCreateStandalone}
                >
                  <Plus className="w-4 h-4" />
                  {standaloneCreating ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </div>
              {standaloneError && (
                <p className="text-xs text-red-400">{standaloneError}</p>
              )}
            </div>

            {/* Existing standalones */}
            {standaloneAll.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-10 text-center">
                <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Henüz bağımsız QR yok. Yukarıdan oluşturabilirsin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {standaloneAll.map((ex, i) => (
                  <StandaloneQRCard key={ex.id} ex={ex} onDelete={handleDeleteStandalone} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Randevular ─────────────────────────────────────── */}
        {tab === "meetings" && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-4">
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

            {requests.length === 0 && (
              <div className="glass rounded-2xl border border-white/8 p-10 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Henüz randevu talebi yok.</p>
              </div>
            )}
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
