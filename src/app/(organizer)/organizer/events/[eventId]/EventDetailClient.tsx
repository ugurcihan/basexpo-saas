"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  BarChart2,
  Settings,
  Plus,
  ChevronLeft,
  Layers,
  Grid3X3,
  Trash2,
  AlertCircle,
  MapPin,
  Calendar,
  ClipboardList,
  Users,
  Trophy,
  Store,
  Activity,
  MessageSquare,
  QrCode,
  UserCircle2,
  Crown,
  Medal,
  Images,
  ImagePlus,
  X as XIcon,
  Award,
  FileBarChart,
  Map,
  GripVertical,
  GripHorizontal,
  Upload,
  Save,
} from "lucide-react";
import {
  createHall,
  deleteHall,
  createBooth,
  deleteBooth,
} from "@/features/events/hallActions";
import { addSponsor, removeSponsor, updateSponsorLayouts, updateSponsorLogo } from "@/features/events/sponsorActions";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { updateEventGallery } from "@/features/events/actions";
import { getCheckins, type CheckinRecord } from "@/features/events/checkinActions";
import {
  getEventRewardTiers,
  getRewardTierWinners,
  upsertRewardTier,
  deleteRewardTier,
  getEventLoyaltySummary,
  type RewardWinnerRow,
} from "@/features/loyalty/organizerActions";
import type { RewardTierWithStats } from "@/features/loyalty/actions";
import type { EventStatus } from "@/types";
import { ORGANIZER_NAV } from "../../_nav";

// ── Ödül Yönetimi Bileşeni ───────────────────────────────
function RewardManagementSection({ eventId }: { eventId: string }) {
  const [tiers, setTiers] = useState<RewardTierWithStats[]>([]);
  const [summary, setSummary] = useState<{ totalParticipants: number; totalPointsAwarded: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [newPoints, setNewPoints] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isLimited, setIsLimited] = useState(false);
  const [newMaxWinners, setNewMaxWinners] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [tierWinners, setTierWinners] = useState<Record<string, RewardWinnerRow[]>>({});

  async function load() {
    if (loaded) return;
    try {
      const [tierData, summaryData] = await Promise.all([
        getEventRewardTiers(eventId),
        getEventLoyaltySummary(eventId),
      ]);
      setTiers(tierData);
      setSummary({ totalParticipants: summaryData.totalParticipants, totalPointsAwarded: summaryData.totalPointsAwarded });
      setLoaded(true);
    } catch {
      setFormError("Veriler yüklenemedi. Sayfayı yenileyiniz.");
    }
  }

  async function toggleWinners(tierId: string) {
    if (expandedTier === tierId) { setExpandedTier(null); return; }
    if (!tierWinners[tierId]) {
      const winners = await getRewardTierWinners(tierId);
      setTierWinners((prev) => ({ ...prev, [tierId]: winners }));
    }
    setExpandedTier(tierId);
  }

  function handleAdd() {
    const pts = parseInt(newPoints);
    if (!pts || pts < 1) { setFormError("Geçerli bir puan eşiği girin."); return; }
    if (!newTitle.trim()) { setFormError("Ödül adı boş olamaz."); return; }
    if (isLimited) {
      const mw = parseInt(newMaxWinners);
      if (!mw || mw < 1) { setFormError("Geçerli bir kontenjan sayısı girin."); return; }
    }
    setFormError(null);
    startTransition(async () => {
      const { error } = await upsertRewardTier(eventId, {
        points_required: pts,
        reward_title: newTitle.trim(),
        reward_description: newDesc.trim() || undefined,
        max_winners: isLimited ? parseInt(newMaxWinners) : null,
      });
      if (error) { setFormError(error); return; }
      const updated = await getEventRewardTiers(eventId);
      setTiers(updated);
      setNewPoints(""); setNewTitle(""); setNewDesc(""); setNewMaxWinners(""); setIsLimited(false);
    });
  }

  function handleDelete(tierId: string) {
    startTransition(async () => {
      await deleteRewardTier(tierId);
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
    });
  }

  function formatClaimed(s: string) {
    return new Date(s).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.4 }}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 glass rounded-2xl border border-white/8 text-left"
        onClick={() => { setOpen(o => !o); load(); }}
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-brand-gold" />
          <span className="font-semibold text-white">Ödül Yönetimi</span>
          {loaded && tiers.length > 0 && (
            <span className="text-xs text-muted-foreground ml-1">({tiers.length} ödül eşiği)</span>
          )}
        </div>
        <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "-rotate-90" : "rotate-180"}`} />
      </button>

      {open && (
        <div className="glass rounded-2xl border border-white/8 border-t-0 rounded-t-none -mt-2 pt-4 px-5 pb-5 space-y-4 overflow-hidden">
          {/* Özet */}
          {summary && (
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-xl border border-white/8 p-3 text-center">
                <p className="font-display text-xl font-bold text-brand-cyan">{summary.totalParticipants}</p>
                <p className="text-xs text-muted-foreground">Puan Kazanan</p>
              </div>
              <div className="glass rounded-xl border border-white/8 p-3 text-center">
                <p className="font-display text-xl font-bold text-brand-gold">{summary.totalPointsAwarded}</p>
                <p className="text-xs text-muted-foreground">Dağıtılan Puan</p>
              </div>
            </div>
          )}

          {/* Mevcut ödül eşikleri */}
          {tiers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Henüz ödül eşiği yok. Aşağıdan ekle.
            </p>
          ) : (
            <div className="space-y-3">
              {tiers.map((tier) => {
                const hasLimit = tier.max_winners !== null;
                const pct = hasLimit ? Math.min((tier.winner_count / tier.max_winners!) * 100, 100) : 0;
                const winnerList = tierWinners[tier.id] ?? [];
                const isExpanded = expandedTier === tier.id;

                return (
                  <div key={tier.id} className="glass rounded-xl border border-white/8">
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{tier.reward_title}</p>
                          {tier.is_full && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">
                              Doldu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-gold mt-0.5">{tier.points_required} puan gerekli</p>
                        {tier.reward_description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{tier.reward_description}</p>
                        )}
                        {hasLimit ? (
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>İlk {tier.max_winners} kişi</span>
                              <span>{tier.winner_count}/{tier.max_winners} kazandı</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${tier.is_full ? "bg-red-500" : "bg-brand-gold"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Sınırsız · {tier.winner_count} kişi kazandı
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                        {tier.winner_count > 0 && (
                          <button
                            onClick={() => toggleWinners(tier.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold/10 border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/20 transition-colors font-medium"
                          >
                            {isExpanded ? "Gizle" : `${tier.winner_count} Kazananı Gör`}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tier.id)}
                          disabled={isPending}
                          className="text-red-400/60 hover:text-red-400 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Kazanan listesi */}
                    {isExpanded && (
                      <div className="border-t border-white/8 px-4 py-3 space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Kazananlar</p>
                        {winnerList.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Henüz kazanan yok.</p>
                        ) : (
                          winnerList.map((w) => (
                            <div key={w.visitor_id} className="flex items-center gap-2 text-xs">
                              <span className={`font-bold w-5 text-center ${w.rank === 1 ? "text-brand-gold" : w.rank === 2 ? "text-slate-300" : w.rank === 3 ? "text-amber-700" : "text-muted-foreground"}`}>
                                {w.rank}.
                              </span>
                              <span className="text-white flex-1 truncate">{w.full_name ?? "—"}</span>
                              <span className="text-muted-foreground/60">{formatClaimed(w.claimed_at)}</span>
                            </div>
                          ))
                        )}
                        {hasLimit && winnerList.length < tier.max_winners! && (
                          <div className="mt-1 pt-1 border-t border-white/5">
                            {Array.from({ length: tier.max_winners! - winnerList.length }, (_, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/40 py-0.5">
                                <span className="w-5 text-center">{winnerList.length + i + 1}.</span>
                                <span>Boş slot</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Yeni ödül ekle */}
          <div className="border-t border-white/8 pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Yeni Ödül Eşiği</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Puan Eşiği</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Örn. 200"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-cyan/40 placeholder:text-muted-foreground/40"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ödül Adı</label>
                <input
                  type="text"
                  placeholder="Örn. Kahve Kuponu"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-cyan/40 placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Açıklama (opsiyonel)</label>
              <input
                type="text"
                placeholder="Örn. Fuarın kafesinden geçerli"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-cyan/40 placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Kontenjan seçeneği */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground block">Kontenjan</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsLimited(false)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                    !isLimited
                      ? "bg-brand-indigo/20 border-brand-indigo/40 text-brand-indigo-light"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  Sınırsız
                </button>
                <button
                  type="button"
                  onClick={() => setIsLimited(true)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                    isLimited
                      ? "bg-brand-gold/20 border-brand-gold/40 text-brand-gold"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  İlk X kişi
                </button>
              </div>
              {isLimited && (
                <input
                  type="number"
                  min={1}
                  placeholder="Örn. 10 (ilk 10 kişi)"
                  value={newMaxWinners}
                  onChange={(e) => setNewMaxWinners(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-brand-gold/40 placeholder:text-muted-foreground/40"
                />
              )}
            </div>

            {formError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {formError}
              </p>
            )}
            <button
              onClick={handleAdd}
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-brand-indigo/20 border border-brand-indigo/30 text-brand-indigo-light text-sm font-semibold hover:bg-brand-indigo/30 transition-colors disabled:opacity-50"
            >
              {isPending ? "Ekleniyor..." : "Ödül Eşiği Ekle"}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Giriş Kayıtları Bileşeni ─────────────────────────────
function CheckinSection({ eventId }: { eventId: string }) {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    if (loaded) return;
    const data = await getCheckins(eventId);
    setCheckins(data);
    setLoaded(true);
  }

  function formatTime(str: string) {
    return new Date(str).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }

  function durationText(inAt: string, outAt: string | null) {
    if (!outAt) return "İçeride";
    const mins = Math.round((new Date(outAt).getTime() - new Date(inAt).getTime()) / 60000);
    return mins < 60 ? `${mins} dk` : `${Math.floor(mins / 60)} sa ${mins % 60} dk`;
  }

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.35 }}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 glass rounded-2xl border border-white/8 text-left"
        onClick={() => { setOpen(o => !o); load(); }}
      >
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-brand-cyan" />
          <span className="font-semibold text-white">Giriş Kayıtları</span>
          {loaded && <span className="text-xs text-muted-foreground ml-1">({checkins.length} kayıt)</span>}
        </div>
        <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "-rotate-90" : "rotate-180"}`} />
      </button>
      {open && (
        <div className="glass rounded-2xl border border-white/8 border-t-0 rounded-t-none -mt-2 pt-2 overflow-hidden">
          {checkins.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">Henüz giriş kaydı yok. Kapı Tarayıcı ile ziyaretçi okutun.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {checkins.map(c => (
                <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.checked_out_at ? "bg-muted-foreground" : "bg-green-400"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.profile?.full_name ?? c.profile?.email ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      Giriş: {formatTime(c.checked_in_at)}
                      {c.checked_out_at && <> · Çıkış: {formatTime(c.checked_out_at)}</>}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.checked_out_at ? "bg-white/5 text-muted-foreground" : "bg-green-500/15 text-green-400"}`}>
                    {durationText(c.checked_in_at, c.checked_out_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}


const STATUS_MAP: Record<EventStatus, { label: string; variant: "default" | "cyan" | "violet" | "gold" | "outline" }> = {
  draft:     { label: "Taslak",  variant: "outline" },
  published: { label: "Yayında", variant: "default" },
  active:    { label: "Aktif",   variant: "cyan" },
  ended:     { label: "Bitti",   variant: "gold" },
};

const TIER_MAP: Record<number, { name: string; color: string; bg: string; icon: React.ElementType; cols: string }> = {
  1: { name: "Platin Sponsor",  color: "text-slate-200",         bg: "bg-slate-400/15 border-slate-400/30", icon: Crown,  cols: "col-span-12" },
  2: { name: "Altın Sponsor",   color: "text-brand-gold",        bg: "bg-brand-gold/12 border-brand-gold/25", icon: Medal,  cols: "col-span-6" },
  3: { name: "Gümüş Sponsor",   color: "text-brand-cyan",        bg: "bg-brand-cyan/10 border-brand-cyan/20", icon: Award,  cols: "col-span-4" },
  4: { name: "Bronz Sponsor",   color: "text-orange-400",        bg: "bg-orange-500/10 border-orange-500/20", icon: Award,  cols: "col-span-3" },
};

const TIER_OPTIONS = [
  { value: "1", label: "🥇 Platin — Ana Sponsor (tam genişlik)" },
  { value: "2", label: "🥈 Altın — 2'li sıra" },
  { value: "3", label: "🥉 Gümüş — 3'lü sıra" },
  { value: "4", label: "🏅 Bronz — 4'lü sıra" },
];

interface BoothRow { id: string; code: string; exhibitor_id: string | null }
interface HallRow  { id: string; name: string; floor: number; booths: BoothRow[] }

interface SponsorRow {
  id: string;
  tier: number;
  tier_name: string;
  width_pct: number;
  height_px: number;
  sort_order: number;
  custom_logo_url: string | null;
  exhibitor: { id: string; company_name: string; logo_url: string | null; tags: string[] } | null;
}

type SponsorLayout = { width_pct: number; height_px: number; sort_order: number };

interface EventWithHalls {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  status: EventStatus;
  organizer_id: string;
  gallery_urls: string[];
  halls: HallRow[];
}

interface Props {
  event: EventWithHalls;
  sponsors: SponsorRow[];
  eventExhibitors: { id: string; company_name: string }[];
}

export function EventDetailClient({ event: initialEvent, sponsors: initialSponsors, eventExhibitors }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState(initialEvent);
  const [sponsors, setSponsors] = useState(initialSponsors);

  // Hall/booth modal state
  const [hallModalOpen, setHallModalOpen] = useState(false);
  const [boothModal, setBoothModal]       = useState<{ hallId: string; hallName: string } | null>(null);
  const [hallName, setHallName]           = useState("");
  const [boothCode, setBoothCode]         = useState("");

  // Sponsor modal state
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [selectedExhibitorId, setSelectedExhibitorId] = useState("");
  const [selectedTier, setSelectedTier]               = useState("1");
  const [customTierName, setCustomTierName]           = useState("");

  // Sponsor layout state (drag/resize)
  const [sponsorLayouts, setSponsorLayouts] = useState<Record<string, SponsorLayout>>(() => {
    const init: Record<string, SponsorLayout> = {};
    initialSponsors.forEach(s => { init[s.id] = { width_pct: s.width_pct, height_px: s.height_px, sort_order: s.sort_order }; });
    return init;
  });
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [dragId, setDragId]           = useState<string | null>(null);
  const pyramidRef                    = useRef<HTMLDivElement>(null);

  // Sync layouts when sponsors refresh from server
  useEffect(() => {
    setSponsorLayouts(prev => {
      const next = { ...prev };
      sponsors.forEach(s => { if (!next[s.id]) next[s.id] = { width_pct: s.width_pct, height_px: s.height_px, sort_order: s.sort_order }; });
      return next;
    });
  }, [sponsors]);

  // Gallery state
  const [galleryUrls, setGalleryUrls]   = useState<string[]>(initialEvent.gallery_urls ?? []);
  const [galleryInput, setGalleryInput] = useState("");

  const [error, setError] = useState<string | null>(null);

  // ── Hall handlers ──────────────────────────────────────────
  async function handleAddHall() {
    if (!hallName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createHall(event.id, hallName.trim());
      if (result.error) { setError(result.error); return; }
      setHallModalOpen(false);
      setHallName("");
      router.refresh();
    });
  }

  async function handleDeleteHall(hallId: string) {
    startTransition(async () => {
      await deleteHall(hallId, event.id);
      setEvent((prev) => ({ ...prev, halls: prev.halls.filter((h) => h.id !== hallId) }));
    });
  }

  async function handleAddBooth() {
    if (!boothModal || !boothCode.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createBooth(boothModal.hallId, boothCode.trim().toUpperCase(), event.id);
      if (result.error) { setError(result.error); return; }
      setBoothModal(null);
      setBoothCode("");
      router.refresh();
    });
  }

  async function handleDeleteBooth(boothId: string, hallId: string) {
    startTransition(async () => {
      await deleteBooth(boothId, event.id);
      setEvent((prev) => ({
        ...prev,
        halls: prev.halls.map((h) =>
          h.id === hallId ? { ...h, booths: h.booths.filter((b) => b.id !== boothId) } : h
        ),
      }));
    });
  }

  // ── Sponsor handlers ───────────────────────────────────────
  async function handleAddSponsor() {
    if (!selectedExhibitorId) return;
    setError(null);
    const tier = parseInt(selectedTier, 10) || 1;
    const tierName = customTierName.trim() || (tier === 1 ? "Ana Sponsor" : tier === 2 ? "Altın Sponsor" : tier === 3 ? "Gümüş Sponsor" : "Bronz Sponsor");
    startTransition(async () => {
      const result = await addSponsor(event.id, selectedExhibitorId, tier, tierName);
      if (result.error) { setError(result.error); return; }
      setSponsorModalOpen(false);
      setSelectedExhibitorId("");
      setSelectedTier("1");
      setCustomTierName("");
      router.refresh();
    });
  }

  async function handleRemoveSponsor(sponsorId: string) {
    startTransition(async () => {
      await removeSponsor(sponsorId, event.id);
      setSponsors((prev) => prev.filter((s) => s.id !== sponsorId));
      setSponsorLayouts(prev => { const n = { ...prev }; delete n[sponsorId]; return n; });
    });
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    setSponsorLayouts(prev => {
      const fromOrder = prev[dragId]?.sort_order ?? 0;
      const toOrder   = prev[targetId]?.sort_order ?? 0;
      return { ...prev, [dragId]: { ...prev[dragId], sort_order: toOrder }, [targetId]: { ...prev[targetId], sort_order: fromOrder } };
    });
    setLayoutDirty(true);
    setDragId(null);
  }

  const handleResizeWidth = useCallback((e: React.MouseEvent, sponsorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX    = e.clientX;
    const startPct  = sponsorLayouts[sponsorId]?.width_pct ?? 100;
    const containerW = pyramidRef.current?.offsetWidth ?? 1;
    const onMove = (ev: MouseEvent) => {
      const delta = ((ev.clientX - startX) / containerW) * 100;
      setSponsorLayouts(prev => ({
        ...prev, [sponsorId]: { ...prev[sponsorId], width_pct: Math.max(15, Math.min(100, startPct + delta)) },
      }));
      setLayoutDirty(true);
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sponsorLayouts]);

  const handleResizeHeight = useCallback((e: React.MouseEvent, sponsorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = sponsorLayouts[sponsorId]?.height_px ?? 80;
    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY;
      setSponsorLayouts(prev => ({
        ...prev, [sponsorId]: { ...prev[sponsorId], height_px: Math.max(60, Math.min(320, startH + delta)) },
      }));
      setLayoutDirty(true);
    };
    const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sponsorLayouts]);

  async function handleSaveLayout() {
    setLayoutSaving(true);
    const updates = sponsors.map(s => ({
      id: s.id,
      width_pct: sponsorLayouts[s.id]?.width_pct ?? 100,
      height_px:  sponsorLayouts[s.id]?.height_px ?? 80,
      sort_order: sponsorLayouts[s.id]?.sort_order ?? 0,
    }));
    const res = await updateSponsorLayouts(updates, event.id);
    if (res.error) setError(res.error);
    else { setLayoutDirty(false); router.refresh(); }
    setLayoutSaving(false);
  }

  async function handleLogoUpload(sponsorId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext  = file.name.split(".").pop();
    const path = `sponsor-logos/${sponsorId}.${ext}`;
    const { data, error: upErr } = await supabase.storage
      .from("sponsor-logos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setError("Logo yüklenemedi: " + upErr.message); return; }
    const { data: urlData } = supabase.storage.from("sponsor-logos").getPublicUrl(data.path);
    startTransition(async () => {
      const res = await updateSponsorLogo(sponsorId, urlData.publicUrl, event.id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  // ── Gallery handlers ───────────────────────────────────────
  async function handleAddGalleryUrl() {
    const url = galleryInput.trim();
    if (!url || galleryUrls.includes(url)) return;
    const next = [...galleryUrls, url];
    setGalleryUrls(next);
    setGalleryInput("");
    await updateEventGallery(event.id, next);
  }

  async function handleRemoveGalleryUrl(url: string) {
    const next = galleryUrls.filter((u) => u !== url);
    setGalleryUrls(next);
    await updateEventGallery(event.id, next);
  }

  const status = STATUS_MAP[event.status];

  // Group sponsors by tier
  const sponsorsByTier = sponsors.reduce<Record<number, SponsorRow[]>>((acc, s) => {
    if (!acc[s.tier]) acc[s.tier] = [];
    acc[s.tier].push(s);
    return acc;
  }, {});

  // Exhibitors not yet sponsors (for the add dialog)
  const sponsoredExhibitorIds = new Set(sponsors.map((s) => s.exhibitor?.id).filter(Boolean));
  const availableExhibitors = eventExhibitors.filter((e) => !sponsoredExhibitorIds.has(e.id));

  return (
    <DashboardShell role="organizer" userName="" navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
          <Link
            href="/organizer/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Fuarlarım
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-bold text-white">{event.name}</h1>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(event.start_date).toLocaleDateString("tr-TR")} → {new Date(event.end_date).toLocaleDateString("tr-TR")}
                </span>
              </div>
            </div>
            <Link href={`/organizer/events/${event.id}/gate`}>
              <Button variant="outline" size="sm" className="gap-2 flex-shrink-0">
                <QrCode className="w-4 h-4" /> Kapı Tarayıcı
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ── Stats ──────────────────────────────────────────── */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { label: "Salon",       value: event.halls.length,                                                                        icon: Layers    },
            { label: "Stand",       value: event.halls.reduce((s, h) => s + h.booths.length, 0),                                      icon: Grid3X3   },
            { label: "Dolu Stand",  value: event.halls.reduce((s, h) => s + h.booths.filter((b) => b.exhibitor_id).length, 0),        icon: Building2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="glass rounded-xl p-4 border border-white/8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-indigo/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-brand-indigo-light" />
              </div>
              <div>
                <p className="text-xl font-display font-bold text-white">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── ÖDÜL YÖNETİMİ ──────────────────────────────────── */}
        <RewardManagementSection eventId={event.id} />

        {/* ── SPONSOR PİRAMİDİ ───────────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-brand-gold" />
              <h2 className="font-semibold text-white">Sponsor Piramidi</h2>
              <span className="text-xs text-muted-foreground">({sponsors.length} sponsor)</span>
              {layoutDirty && (
                <span className="text-xs text-brand-cyan animate-pulse">• değişiklik var</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {layoutDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveLayout}
                  disabled={layoutSaving}
                  className="gap-1.5 border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/10"
                >
                  <Save className="w-3.5 h-3.5" />
                  {layoutSaving ? "Kaydediliyor..." : "Düzeni Kaydet"}
                </Button>
              )}
              <Button
                variant="gradient"
                size="sm"
                onClick={() => { setError(null); setSponsorModalOpen(true); }}
                disabled={availableExhibitors.length === 0}
              >
                <Plus className="w-4 h-4" /> Sponsor Ekle
              </Button>
            </div>
          </div>

          {sponsors.length === 0 ? (
            <div className="glass rounded-2xl border border-dashed border-brand-gold/20 p-8 flex flex-col items-center text-center">
              <Crown className="w-10 h-10 text-brand-gold/30 mb-3" />
              <p className="text-muted-foreground text-sm">Henüz sponsor yok.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Katılımcı firmalar arasından sponsor seçin.</p>
            </div>
          ) : (() => {
            const TIER_COLORS: Record<number, { text: string; border: string; bg: string }> = {
              1: { text: "text-slate-200",   border: "border-slate-400/40",   bg: "bg-slate-400/10"  },
              2: { text: "text-brand-gold",   border: "border-brand-gold/35",  bg: "bg-brand-gold/10" },
              3: { text: "text-brand-cyan",   border: "border-brand-cyan/30",  bg: "bg-brand-cyan/8"  },
              4: { text: "text-orange-400",   border: "border-orange-500/30",  bg: "bg-orange-500/8"  },
            };
            const getColor = (tier: number) => TIER_COLORS[Math.min(tier, 4)] ?? TIER_COLORS[4];

            return (
              <div className="space-y-4" ref={pyramidRef}>
                {Object.keys(sponsorsByTier).map(Number).sort((a, b) => a - b).map((tier) => {
                  const tierSponsors = [...sponsorsByTier[tier]].sort(
                    (a, b) => (sponsorLayouts[a.id]?.sort_order ?? 0) - (sponsorLayouts[b.id]?.sort_order ?? 0)
                  );
                  const tierName = tierSponsors[0]?.tier_name ?? `Seviye ${tier}`;
                  const { text: textCls } = getColor(tier);
                  return (
                    <div key={tier} className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Crown className={`w-3.5 h-3.5 ${textCls}`} />
                        <span className={`text-xs font-semibold ${textCls}`}>{tierName}</span>
                        <span className="text-xs text-muted-foreground/50">— sürükle/bırak sıralamak için, kenara tutup çek boyutu ayarla</span>
                      </div>
                      <div className="flex flex-row flex-wrap gap-3 items-stretch">
                        {tierSponsors.map((sponsor) => {
                          const layout  = sponsorLayouts[sponsor.id] ?? { width_pct: 100, height_px: 80, sort_order: 0 };
                          const logoSrc = sponsor.custom_logo_url ?? sponsor.exhibitor?.logo_url ?? null;
                          const { text: tc, border: bc, bg: bgc } = getColor(tier);
                          const isDraggingThis = dragId === sponsor.id;
                          return (
                            <div
                              key={sponsor.id}
                              draggable
                              onDragStart={() => setDragId(sponsor.id)}
                              onDragOver={e => e.preventDefault()}
                              onDrop={() => handleDrop(sponsor.id)}
                              onDragEnd={() => setDragId(null)}
                              style={{
                                flexBasis: `calc(${layout.width_pct}% - 12px)`,
                                minWidth: 120,
                                height: layout.height_px,
                              }}
                              className={`relative glass rounded-xl border ${bc} ${bgc} flex flex-col items-center justify-center overflow-hidden group cursor-grab active:cursor-grabbing select-none transition-opacity ${isDraggingThis ? "opacity-40" : ""}`}
                            >
                              {/* Logo veya firma adı */}
                              <div className="flex flex-col items-center justify-center w-full h-full px-6 pb-4 pt-2 pointer-events-none">
                                {logoSrc ? (
                                  <img
                                    src={logoSrc}
                                    alt={sponsor.exhibitor?.company_name ?? ""}
                                    className="max-h-[65%] max-w-[85%] object-contain"
                                  />
                                ) : (
                                  <span className={`font-bold text-sm text-center leading-tight ${tc}`}>
                                    {sponsor.exhibitor?.company_name ?? "—"}
                                  </span>
                                )}
                              </div>

                              {/* Logo yükle overlay (hover) */}
                              <label className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                                <Upload className="w-4 h-4 text-white" />
                                <span className="text-[10px] text-white/80">Logo Yükle</span>
                                <span className="text-[9px] text-white/50 text-center leading-tight">
                                  Önerilen: {Math.round((layout.width_pct / 100) * 800)}×{layout.height_px}px
                                </span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                  className="hidden"
                                  onChange={ev => { ev.stopPropagation(); handleLogoUpload(sponsor.id, ev); }}
                                />
                              </label>

                              {/* Silme butonu */}
                              <button
                                onClick={e => { e.stopPropagation(); handleRemoveSponsor(sponsor.id); }}
                                disabled={isPending}
                                className="absolute top-1.5 right-7 z-20 opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:bg-red-500/20 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>

                              {/* Sağ kenar — genişlik resize */}
                              <div
                                className="absolute right-0 top-0 bottom-4 w-4 cursor-col-resize flex items-center justify-center hover:bg-white/15 z-20 rounded-r-xl"
                                onMouseDown={e => handleResizeWidth(e, sponsor.id)}
                                onClick={e => e.stopPropagation()}
                              >
                                <GripVertical className="w-3 h-3 text-white/30" />
                              </div>

                              {/* Alt kenar — yükseklik resize */}
                              <div
                                className="absolute bottom-0 left-4 right-4 h-4 cursor-row-resize flex items-center justify-center hover:bg-white/15 z-20 rounded-b-xl"
                                onMouseDown={e => handleResizeHeight(e, sponsor.id)}
                                onClick={e => e.stopPropagation()}
                              >
                                <GripHorizontal className="w-3 h-3 text-white/30" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </motion.div>

        {/* ── GALERİ YÖNETİMİ ──────────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.18 }}>
          <div className="flex items-center gap-2 mb-4">
            <Images className="w-5 h-5 text-brand-violet-light" />
            <h2 className="font-semibold text-white">Fotoğraf Galerisi</h2>
            <span className="text-xs text-muted-foreground">({galleryUrls.length} fotoğraf)</span>
          </div>

          <div className="glass rounded-2xl border border-white/8 p-5 space-y-4">
            {/* URL input */}
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/photo.jpg"
                value={galleryInput}
                onChange={(e) => setGalleryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddGalleryUrl()}
                className="flex-1 font-mono text-xs"
              />
              <Button variant="gradient" size="sm" onClick={handleAddGalleryUrl} disabled={!galleryInput.trim() || isPending}>
                <ImagePlus className="w-4 h-4" /> Ekle
              </Button>
            </div>

            {/* Gallery grid */}
            {galleryUrls.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-4">Henüz fotoğraf eklenmedi. URL girerek galeri oluştur.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {galleryUrls.map((url) => (
                  <div key={url} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveGalleryUrl(url)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── SALONLAR & STANDLAR ───────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-indigo-light" />
              <h2 className="font-semibold text-white">Salon & Stand Yönetimi</h2>
            </div>
            <Button variant="gradient" size="sm" onClick={() => { setError(null); setHallModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Salon Ekle
            </Button>
          </div>

          {event.halls.length === 0 ? (
            <div className="glass rounded-2xl border border-dashed border-white/15 p-10 flex flex-col items-center text-center">
              <Layers className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">Henüz salon yok.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">&quot;Salon Ekle&quot; ile ilk salonu oluştur.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {event.halls.map((hall, hi) => (
                <motion.div
                  key={hall.id}
                  initial={{ y: 16 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.15 + hi * 0.07 }}
                  className="glass rounded-2xl border border-white/8 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-indigo-light" />
                      <span className="font-semibold text-white">{hall.name}</span>
                      <span className="text-xs text-muted-foreground">Kat {hall.floor} · {hall.booths.length} stand</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/organizer/halls/${hall.id}/map-editor`}>
                        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/10 hover:border-brand-cyan/60">
                          <Map className="w-3.5 h-3.5" /> Harita Düzenle
                        </Button>
                      </Link>
                      <Button
                        variant="ghost" size="sm" className="text-xs h-8"
                        onClick={() => { setError(null); setBoothCode(""); setBoothModal({ hallId: hall.id, hallName: hall.name }); }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Stand
                      </Button>
                      <button
                        onClick={() => handleDeleteHall(hall.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {hall.booths.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 text-center py-2">Bu salonda stand yok.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {hall.booths.map((booth) => (
                          <div
                            key={booth.id}
                            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                              booth.exhibitor_id
                                ? "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan"
                                : "border-white/10 bg-white/5 text-muted-foreground"
                            }`}
                          >
                            <Grid3X3 className="w-3 h-3" />
                            {booth.code}
                            <button
                              onClick={() => handleDeleteBooth(booth.id, hall.id)}
                              disabled={isPending}
                              className="hidden group-hover:flex items-center justify-center w-4 h-4 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── GİRİŞ KAYITLARI ────────────────────────────────── */}
        <CheckinSection eventId={event.id} />

      </div>

      {/* ── ADD HALL MODAL ───────────────────────────────────── */}
      <Dialog open={hallModalOpen} onOpenChange={setHallModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Salon Ekle</DialogTitle>
            <DialogDescription>Fuara yeni bir salon oluştur.</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="hall-name">Salon Adı</Label>
            <Input
              id="hall-name"
              placeholder="A Salonu"
              value={hallName}
              onChange={(e) => setHallName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddHall()}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setHallModalOpen(false)} disabled={isPending}>İptal</Button>
            <Button variant="gradient" onClick={handleAddHall} disabled={isPending || !hallName.trim()}>
              {isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD BOOTH MODAL ──────────────────────────────────── */}
      <Dialog open={!!boothModal} onOpenChange={(o) => !o && setBoothModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Stand Ekle</DialogTitle>
            <DialogDescription>{boothModal?.hallName} — stand kodu gir.</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="booth-code">Stand Kodu</Label>
            <Input
              id="booth-code"
              placeholder="A01"
              value={boothCode}
              onChange={(e) => setBoothCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleAddBooth()}
              className="font-mono"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Otomatik büyük harfe çevrilir. Örn: A01, B12</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBoothModal(null)} disabled={isPending}>İptal</Button>
            <Button variant="gradient" onClick={handleAddBooth} disabled={isPending || !boothCode.trim()}>
              {isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ADD SPONSOR MODAL ────────────────────────────────── */}
      <Dialog open={sponsorModalOpen} onOpenChange={(o) => { setSponsorModalOpen(o); if (!o) setError(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sponsor Ekle</DialogTitle>
            <DialogDescription>Katılımcı firmayı sponsor olarak tanımla.</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Firma</Label>
              <Select value={selectedExhibitorId} onValueChange={setSelectedExhibitorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Firma seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {availableExhibitors.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Seviye Numarası</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">1 = en büyük</p>
              </div>
              <div className="space-y-2">
                <Label>Seviye Adı</Label>
                <Input
                  value={customTierName}
                  onChange={(e) => setCustomTierName(e.target.value)}
                  placeholder="Ana Sponsor"
                />
                <p className="text-xs text-muted-foreground">Boş = otomatik</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setSponsorModalOpen(false); setError(null); }} disabled={isPending}>İptal</Button>
            <Button variant="gradient" onClick={handleAddSponsor} disabled={isPending || !selectedExhibitorId}>
              {isPending ? "Ekleniyor..." : "Sponsor Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
