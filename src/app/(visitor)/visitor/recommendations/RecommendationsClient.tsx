"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, Sparkles, Heart, Users,
  CalendarClock, Settings, Plus, X, Building2,
  MapPin, Tag, Zap, RefreshCw, AlertCircle,
  Brain, ArrowRight, CalendarDays, Ticket,
  Calendar, Clock, CheckCircle2, CalendarPlus,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  updateVisitorInterests,
  generateVisitorEmbedding,
  type AIRecommendation,
  type EventRecommendation,
} from "@/features/ai/actions";
import { addFavorite, removeFavorite } from "@/features/favorites/actions";
import { RequestMeetingModal } from "@/components/meeting/RequestMeetingModal";
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

function scoreColor(score: number): string {
  if (score >= 0.75) return "text-green-400";
  if (score >= 0.55) return "text-brand-cyan";
  if (score >= 0.4) return "text-brand-indigo-light";
  return "text-brand-violet-light";
}

function scoreLabel(score: number): string {
  if (score >= 0.75) return "Mükemmel";
  if (score >= 0.55) return "Yüksek";
  if (score >= 0.4) return "İyi";
  return "Zayıf";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  profile: Profile;
  recommendations: AIRecommendation[];
  hasEmbedding: boolean;
  serverError: string | null;
  eventRecommendations: EventRecommendation[];
  favoriteIds: string[];
}

export function RecommendationsClient({
  profile,
  recommendations: initialRecs,
  hasEmbedding,
  serverError,
  eventRecommendations,
  favoriteIds: initialFavoriteIds,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(serverError);
  const [activeTab, setActiveTab] = useState<"firms" | "fairs">("firms");
  const [firmStep, setFirmStep] = useState<"interests" | "generate" | "results">(
    initialRecs.length > 0 ? "results" : hasEmbedding ? "results" : "interests"
  );

  // Favorites state (optimistic)
  const [favIds, setFavIds] = useState<Set<string>>(new Set(initialFavoriteIds));
  const [meetingModal, setMeetingModal] = useState<{ exhibitorId: string; exhibitorName: string } | null>(null);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || interests.includes(t) || interests.length >= 15) return;
    setInterests((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setInterests((prev) => prev.filter((t) => t !== tag));
  }

  function handleSaveInterests() {
    if (interests.length === 0) { setError("En az bir ilgi alanı gir"); return; }
    setError(null);
    startTransition(async () => {
      const result = await updateVisitorInterests(interests);
      if (result.error) { setError(result.error); return; }
      setFirmStep("generate");
    });
  }

  function handleGenerateEmbedding() {
    setError(null);
    startTransition(async () => {
      const result = await generateVisitorEmbedding();
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  function toggleFavorite(exhibitorId: string) {
    const isFav = favIds.has(exhibitorId);
    startTransition(async () => {
      if (isFav) {
        setFavIds((prev) => { const s = new Set(prev); s.delete(exhibitorId); return s; });
        await removeFavorite(exhibitorId);
      } else {
        setFavIds((prev) => new Set([...prev, exhibitorId]));
        await addFavorite(exhibitorId);
      }
    });
  }

  const TABS = [
    { id: "firms" as const, label: "Firmalar", icon: Building2, count: initialRecs.length },
    { id: "fairs" as const, label: "Fuarlar", icon: CalendarDays, count: eventRecommendations.length },
  ];

  return (
    <>
      {meetingModal && (
        <RequestMeetingModal
          exhibitorId={meetingModal.exhibitorId}
          exhibitorName={meetingModal.exhibitorName}
          isOpen={true}
          onClose={() => setMeetingModal(null)}
        />
      )}

      <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-violet-light" />
              AI Önerileri
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              İlgi alanlarına göre eşleştirilmiş firmalar ve fuarlar
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-violet/20 border border-brand-violet/25 text-white"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? "bg-brand-violet/30 text-brand-violet-light" : "bg-white/8 text-muted-foreground"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* ═══ FIRMS TAB ═══ */}
            {activeTab === "firms" && (
              <motion.div
                key="firms"
                initial={{ y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* STEP 1: Enter interests */}
                {firmStep !== "results" && (
                  <>
                    {firmStep === "interests" && (
                      <div className="glass rounded-2xl border border-brand-violet/20 p-6 space-y-5">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-violet/8 border border-brand-violet/15">
                          <Sparkles className="w-4 h-4 text-brand-violet-light flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-white">Nasıl çalışır?</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              İlgi alanlarını gir → OpenAI embedding oluşturur → fuardaki firmalarla cosine similarity hesaplar.
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-white">İlgi Alanların</p>
                          {interests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {interests.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-violet/15 border border-brand-violet/20 text-brand-violet-light">
                                  {tag}
                                  <button type="button" onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Yapay zeka, robotik, medikal... (Enter)"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                              disabled={interests.length >= 15}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={addTag} disabled={!tagInput.trim() || interests.length >= 15}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Maks 15 · virgül veya Enter</p>
                        </div>
                        {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
                        <Button variant="gradient" className="w-full" onClick={handleSaveInterests} disabled={isPending || interests.length === 0}>
                          {isPending ? "Kaydediliyor..." : "İlgi Alanlarını Kaydet"}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {firmStep === "generate" && (
                      <div className="glass rounded-2xl border border-brand-indigo/20 p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-5">
                          <Brain className="w-8 h-8 text-brand-indigo-light" />
                        </div>
                        <h2 className="font-display text-xl font-bold text-white mb-2">AI Profilini Oluştur</h2>
                        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                          {interests.map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/20 text-brand-indigo-light">{tag}</span>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                          OpenAI 1536 boyutlu vektör üretecek. Fuardaki firmalarla eşleşme hesaplanacak.
                        </p>
                        {error && <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
                        <Button variant="gradient" className="w-full max-w-xs" onClick={handleGenerateEmbedding} disabled={isPending}>
                          {isPending ? <><RefreshCw className="w-4 h-4 animate-spin" />AI hesaplıyor...</> : <><Zap className="w-4 h-4" />Eşleşmeleri Hesapla</>}
                        </Button>
                        <button onClick={() => setFirmStep("interests")} className="mt-4 text-xs text-muted-foreground hover:text-white transition-colors">← İlgi alanlarını değiştir</button>
                      </div>
                    )}
                  </>
                )}

                {/* STEP 3: Results */}
                {firmStep === "results" && (
                  <div className="space-y-4">
                    {/* Interests bar */}
                    {profile.interests.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-white/3 border border-white/8">
                        <span className="text-xs text-muted-foreground mr-1">Profilin:</span>
                        {profile.interests.map((i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-brand-violet/15 text-brand-violet-light">{i}</span>
                        ))}
                        <button
                          onClick={() => { setInterests(profile.interests); setFirmStep("interests"); }}
                          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-white"
                        >
                          <RefreshCw className="w-3 h-3" /> Yenile
                        </button>
                      </div>
                    )}

                    {initialRecs.length === 0 ? (
                      <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
                        <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground font-medium">Eşleşen firma bulunamadı</p>
                        <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                          Firmalar AI profillerini güncelledikçe burada görünecek.
                        </p>
                        <Button variant="outline" size="sm" className="mt-5" onClick={handleGenerateEmbedding} disabled={isPending}>
                          <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} /> Tekrar Ara
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground px-1">{initialRecs.length} firma · cosine similarity</p>
                        <div className="space-y-3">
                          {initialRecs.map((rec, i) => {
                            const isFav = favIds.has(rec.id);
                            return (
                              <motion.div
                                key={rec.id}
                                initial={{ y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="glass rounded-xl border border-white/8 hover:border-white/15 transition-all overflow-hidden"
                              >
                                <div className="p-5 flex items-start gap-4">
                                  {/* Score */}
                                  <div className="flex-shrink-0 w-14 text-center">
                                    <p className={`text-2xl font-display font-bold ${scoreColor(rec.similarity)}`}>
                                      {Math.round(rec.similarity * 100)}
                                    </p>
                                    <p className={`text-xs leading-tight ${scoreColor(rec.similarity)}`}>{scoreLabel(rec.similarity)}</p>
                                  </div>

                                  {/* Logo */}
                                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {rec.logo_url ? (
                                      <Image src={rec.logo_url} alt={rec.company_name} width={44} height={44} className="object-cover w-full h-full" />
                                    ) : (
                                      <Building2 className="w-5 h-5 text-muted-foreground/30" />
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white truncate mb-1">{rec.company_name}</h3>
                                    {rec.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{rec.description}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="w-3 h-3" /> {rec.event_name} · {rec.event_location}
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {rec.tags.slice(0, 3).map((tag) => (
                                          <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-white/5 text-muted-foreground">
                                            <Tag className="w-2.5 h-2.5" /> {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex-shrink-0 flex flex-col gap-2">
                                    {/* Favorite button */}
                                    <button
                                      onClick={() => toggleFavorite(rec.id)}
                                      disabled={isPending}
                                      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                                        isFav
                                          ? "bg-red-500/15 border-red-500/25 text-red-400"
                                          : "bg-white/5 border-white/10 text-muted-foreground hover:text-red-400 hover:border-red-500/20"
                                      }`}
                                      title={isFav ? "Favoriden çıkar" : "Favoriye ekle"}
                                    >
                                      <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                                    </button>
                                    {/* Randevu */}
                                    <button
                                      onClick={() => setMeetingModal({ exhibitorId: rec.id, exhibitorName: rec.company_name })}
                                      className="w-9 h-9 rounded-lg border bg-white/5 border-white/10 text-muted-foreground hover:text-brand-violet-light hover:border-brand-violet/20 flex items-center justify-center transition-all"
                                      title="Randevu talep et"
                                    >
                                      <CalendarPlus className="w-4 h-4" />
                                    </button>
                                    {/* Scan */}
                                    <Button variant="gradient" size="sm" asChild>
                                      <Link href={`/scan/${rec.qr_token}`}>Tara</Link>
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ FAIRS TAB ═══ */}
            {activeTab === "fairs" && (
              <motion.div
                key="fairs"
                initial={{ y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Interest-based note */}
                {profile.interests.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-white/3 border border-white/8">
                    <Sparkles className="w-3.5 h-3.5 text-brand-violet-light" />
                    <span className="text-xs text-muted-foreground">İlgi alanlarınıza göre sıralandı:</span>
                    {profile.interests.slice(0, 5).map((i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-brand-violet/15 text-brand-violet-light">{i}</span>
                    ))}
                  </div>
                )}

                {eventRecommendations.length === 0 ? (
                  <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
                    <h2 className="font-semibold text-white mb-2">Yaklaşan fuar bulunamadı</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">Organizatörler fuar ekledikçe burada görünecek.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground px-1">{eventRecommendations.length} fuar bulundu</p>
                    <div className="space-y-3">
                      {eventRecommendations.map((ev, i) => (
                        <motion.div
                          key={ev.id}
                          initial={{ y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="glass rounded-xl border border-white/8 hover:border-white/15 transition-all p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-white">{ev.name}</h3>
                                {ev.requires_approval && (
                                  <Badge className="text-xs bg-brand-indigo/15 border-brand-indigo/25 text-brand-indigo-light">
                                    <FileCheck className="w-3 h-3 mr-1" /> Başvuru Gerekli
                                  </Badge>
                                )}
                              </div>
                              {ev.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{ev.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(ev.start_date)}
                                  {ev.end_date && ev.end_date !== ev.start_date && <> — {formatDate(ev.end_date)}</>}
                                </span>
                                {ev.capacity !== null && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {ev.capacity > 0 ? `${ev.capacity} kişilik` : <span className="text-red-400">Kapasite dolu</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {ev.requires_approval ? (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href="/visitor/upcoming-fairs">
                                    <FileCheck className="w-3.5 h-3.5" /> Başvur
                                  </Link>
                                </Button>
                              ) : (
                                <Button variant="gradient" size="sm" asChild>
                                  <Link href="/visitor/upcoming-fairs">
                                    <Ticket className="w-3.5 h-3.5" /> Kayıt Ol
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DashboardShell>
    </>
  );
}
