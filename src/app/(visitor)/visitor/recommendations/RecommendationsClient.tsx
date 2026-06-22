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
  LayoutDashboard,
  Sparkles,
  QrCode,
  Heart,
  Users,
  CalendarClock,
  Settings,
  Plus,
  X,
  Building2,
  MapPin,
  Tag,
  Zap,
  RefreshCw,
  AlertCircle,
  Brain,
  ArrowRight,
  CalendarDays,
  Ticket,
} from "lucide-react";
import {
  updateVisitorInterests,
  generateVisitorEmbedding,
  type AIRecommendation,
} from "@/features/ai/actions";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "QR Badge'im",      href: "/visitor/badge",             icon: QrCode },
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
  if (score >= 0.75) return "Mükemmel Eşleşme";
  if (score >= 0.55) return "Yüksek Eşleşme";
  if (score >= 0.4) return "İyi Eşleşme";
  return "Zayıf Eşleşme";
}

interface Props {
  profile: Profile;
  recommendations: AIRecommendation[];
  hasEmbedding: boolean;
  serverError: string | null;
}

export function RecommendationsClient({
  profile,
  recommendations: initialRecs,
  hasEmbedding,
  serverError,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [interests, setInterests] = useState<string[]>(profile.interests ?? []);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(serverError);
  const [step, setStep] = useState<"interests" | "generate" | "results">(
    initialRecs.length > 0 ? "results" : hasEmbedding ? "results" : "interests"
  );

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || interests.includes(t) || interests.length >= 15) return;
    setInterests((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setInterests((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSaveInterests() {
    if (interests.length === 0) { setError("En az bir ilgi alanı gir"); return; }
    setError(null);
    startTransition(async () => {
      const result = await updateVisitorInterests(interests);
      if (result.error) { setError(result.error); return; }
      setStep("generate");
    });
  }

  async function handleGenerateEmbedding() {
    setError(null);
    startTransition(async () => {
      const result = await generateVisitorEmbedding();
      if (result.error) { setError(result.error); return; }
      router.refresh();
    });
  }

  return (
    <DashboardShell
      role="visitor"
      userName={profile.full_name || profile.email}
      navItems={NAV_ITEMS}
    >
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-brand-violet-light" />
              AI Firma Önerileri
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              İlgi alanlarına göre vektörel benzerlik analizi
            </p>
          </div>
          {step === "results" && initialRecs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateEmbedding}
              disabled={isPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Enter interests */}
          {(step === "interests" || (step !== "results" && initialRecs.length === 0 && !hasEmbedding)) && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl border border-brand-violet/20 p-6 space-y-5"
            >
              {/* Explainer */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-violet/8 border border-brand-violet/15">
                <Sparkles className="w-4 h-4 text-brand-violet-light flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Nasıl çalışır?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    İlgi alanlarını gir → OpenAI embedding oluşturur → pgvector ile fuardaki
                    firmalarla cosine similarity hesaplar → En uygun firmalar sıralanır.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-white">İlgi Alanların</p>
                {interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-violet/15 border border-brand-violet/20 text-brand-violet-light"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Yapay zeka, robotik, medikal... (Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                    }}
                    disabled={interests.length >= 15}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addTag} disabled={!tagInput.trim() || interests.length >= 15}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Maks 15 · virgül veya Enter ile ekle</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <Button
                variant="gradient"
                className="w-full"
                onClick={handleSaveInterests}
                disabled={isPending || interests.length === 0}
              >
                {isPending ? "Kaydediliyor..." : "İlgi Alanlarını Kaydet"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Generate embedding */}
          {step === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl border border-brand-indigo/20 p-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-5">
                <Brain className="w-8 h-8 text-brand-indigo-light" />
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-2">
                AI Profilini Oluştur
              </h2>
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/20 text-brand-indigo-light"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                OpenAI bu ilgi alanlarından 1536 boyutlu bir vektör üretecek.
                Fuardaki firmalarla eşleşme hesaplanacak.
              </p>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full mb-4">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <Button
                variant="gradient"
                className="w-full max-w-xs"
                onClick={handleGenerateEmbedding}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    AI hesaplıyor...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Eşleşmeleri Hesapla
                  </>
                )}
              </Button>

              <button
                onClick={() => setStep("interests")}
                className="mt-4 text-xs text-muted-foreground hover:text-white transition-colors"
              >
                ← İlgi alanlarını değiştir
              </button>
            </motion.div>
          )}

          {/* STEP 3: Results */}
          {step === "results" && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Current interests */}
              {profile.interests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-white/3 border border-white/8"
                >
                  <span className="text-xs text-muted-foreground mr-1">Profilin:</span>
                  {profile.interests.map((i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-brand-violet/15 text-brand-violet-light">
                      {i}
                    </span>
                  ))}
                  <button
                    onClick={() => { setInterests(profile.interests); setStep("interests"); }}
                    className="ml-auto text-xs text-muted-foreground hover:text-white transition-colors"
                  >
                    Düzenle
                  </button>
                </motion.div>
              )}

              {initialRecs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
                >
                  <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">Eşleşen firma bulunamadı</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                    Fuarda henüz AI profiline sahip firma yok. Firmalar profillerini güncelledikçe burada görünecek.
                  </p>
                  <Button variant="outline" size="sm" className="mt-5" onClick={handleGenerateEmbedding} disabled={isPending}>
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
                    Tekrar Ara
                  </Button>
                </motion.div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground px-1">
                    {initialRecs.length} firma bulundu · cosine similarity
                  </p>
                  <div className="space-y-3">
                    {initialRecs.map((rec, i) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="group glass rounded-xl border border-white/8 hover:border-white/15 transition-all overflow-hidden"
                      >
                        <div className="p-5 flex items-start gap-4">
                          {/* Score */}
                          <div className="flex-shrink-0 w-14 text-center">
                            <p className={`text-2xl font-display font-bold ${scoreColor(rec.similarity)}`}>
                              {Math.round(rec.similarity * 100)}
                            </p>
                            <p className="text-xs text-muted-foreground/60 leading-tight mt-0.5">%</p>
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
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white truncate">{rec.company_name}</h3>
                              <span className={`text-xs flex-shrink-0 ${scoreColor(rec.similarity)}`}>
                                {scoreLabel(rec.similarity)}
                              </span>
                            </div>
                            {rec.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {rec.description}
                              </p>
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

                          {/* Action */}
                          <div className="flex-shrink-0">
                            <Button variant="gradient" size="sm" asChild>
                              <Link href={`/scan/${rec.qr_token}`}>
                                Tara
                              </Link>
                            </Button>
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
  );
}
