"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin, Calendar, CheckCircle2, LogIn, Building2, Package,
  AlertCircle, Tag, Zap, Trophy, ChevronDown, ChevronUp,
  Phone, Globe, Linkedin, Mail, ClipboardList, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLeadFromScan } from "@/features/leads/actions";
import { submitSurveyResponses } from "@/features/surveys/actions";
import type { UserRole } from "@/types";
import type { RewardTierWithStats } from "@/features/loyalty/actions";

interface Product { id: string; name: string; description: string; image_url: string | null }
type EventRow = { id: string; name: string; location: string; start_date: string; end_date: string; gallery_urls?: string[] };

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: "yes_no" | "multiple_choice";
  options: string[] | null;
  sort_order: number;
  is_required: boolean;
}
interface Survey { id: string; title: string; is_active: boolean; questions: SurveyQuestion[] }

interface ExhibitorData {
  id: string;
  company_name: string;
  description: string;
  logo_url: string | null;
  tags: string[];
  qr_token: string;
  contact_name: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  phone: string | null;
  website: string | null;
  event: EventRow | EventRow[];
  products: Product[];
}

function getEvent(e: EventRow | EventRow[]): EventRow | null {
  if (!e) return null;
  return Array.isArray(e) ? (e[0] ?? null) : e;
}

interface Props {
  exhibitor: ExhibitorData;
  visitorRole: UserRole | null;
  alreadyCheckedIn: boolean;
  rewardTiers: RewardTierWithStats[];
  visitorPoints: number;
  survey: Survey | null;
}

export function ScanClient({ exhibitor, visitorRole, alreadyCheckedIn: initial, rewardTiers, visitorPoints, survey }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checkedIn, setCheckedIn] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [surveyPending, startSurveyTransition] = useTransition();

  const ev = getEvent(exhibitor.event);
  const hasSurvey = survey && survey.is_active && survey.questions.length > 0;

  async function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      const result = await createLeadFromScan(exhibitor.id);
      if (result.error === "login_required") {
        router.push(`/login?redirect=/scan/${exhibitor.qr_token}`);
        return;
      }
      if (result.error) { setError(result.error); return; }
      setCheckedIn(true);
    });
  }

  function handleSurveyAnswer(questionId: string, value: string) {
    setSurveyAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  function handleSurveySubmit() {
    if (!survey) return;
    const responses = Object.entries(surveyAnswers).map(([questionId, responseValue]) => ({
      surveyId: survey.id,
      questionId,
      responseValue,
    }));
    if (responses.length === 0) return;
    startSurveyTransition(async () => {
      await submitSurveyResponses(responses);
      setSurveySubmitted(true);
    });
  }

  return (
    <div className="min-h-screen bg-brand-dark text-foreground">
      <div className="h-1 w-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-violet" />

      <div className="max-w-lg mx-auto px-4 py-10 space-y-5">

        {/* ── Dijital Kartvizit Header ─────────────────────────── */}
        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/10 overflow-hidden">
          {/* Üst band: logo + isim + yetkili */}
          <div className="p-6 bg-gradient-to-br from-brand-indigo/15 to-brand-violet/8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {exhibitor.logo_url ? (
                  <Image src={exhibitor.logo_url} alt={exhibitor.company_name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-xl font-bold text-white leading-tight">{exhibitor.company_name}</h1>
                {exhibitor.contact_name && (
                  <p className="text-brand-cyan text-sm font-medium mt-0.5">{exhibitor.contact_name}</p>
                )}
                {exhibitor.job_title && (
                  <p className="text-muted-foreground text-xs">{exhibitor.job_title}</p>
                )}
                <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-muted-foreground">
                  {ev?.name && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ev.name}</span>}
                  {ev?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                </div>
              </div>
            </div>

            {/* İletişim butonları */}
            {(exhibitor.phone || exhibitor.website || exhibitor.linkedin_url) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {exhibitor.phone && (
                  <a
                    href={`tel:${exhibitor.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/12 hover:bg-white/12 transition-colors text-xs text-white"
                  >
                    <Phone className="w-3 h-3 text-brand-cyan" /> {exhibitor.phone}
                  </a>
                )}
                {exhibitor.website && (
                  <a
                    href={exhibitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/12 hover:bg-white/12 transition-colors text-xs text-white"
                  >
                    <Globe className="w-3 h-3 text-brand-indigo-light" /> Web Sitesi
                  </a>
                )}
                {exhibitor.linkedin_url && (
                  <a
                    href={exhibitor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/12 hover:bg-white/12 transition-colors text-xs text-white"
                  >
                    <Linkedin className="w-3 h-3 text-blue-400" /> LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Açıklama + etiketler */}
          {(exhibitor.description || exhibitor.tags.length > 0) && (
            <div className="px-6 py-4 border-t border-white/8 space-y-3">
              {exhibitor.description && (
                <p className="text-sm text-muted-foreground">{exhibitor.description}</p>
              )}
              {exhibitor.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {exhibitor.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/20 text-brand-indigo-light">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ── Puan Bilgisi ──────────────────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.06 }}>
          <div className="rounded-2xl border border-brand-indigo/30 bg-brand-indigo/10 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-xl bg-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-brand-indigo-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">
                  Bu firmayı ziyaret et → <span className="text-brand-indigo-light">+20 puan</span> kazan!
                </p>
                {visitorPoints > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mevcut puanın: <span className="text-white font-medium">{visitorPoints} puan</span>
                    {visitorRole === "visitor" && (
                      <Link href="/visitor/loyalty" className="ml-2 text-brand-gold hover:underline">Puanlarım →</Link>
                    )}
                  </p>
                )}
              </div>
            </div>
            {rewardTiers.length > 0 && (
              <>
                <button
                  onClick={() => setRewardsOpen(v => !v)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 border-t border-brand-indigo/20 text-xs text-brand-indigo-light hover:bg-brand-indigo/10 transition-colors"
                >
                  <span className="flex items-center gap-1.5"><Trophy className="w-3 h-3 text-brand-gold" /> Fuar ödüllerine bak</span>
                  {rewardsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {rewardsOpen && (
                    <motion.div key="rp" initial={{ y: -8 }} animate={{ y: 0 }} exit={{ y: -8 }}>
                      <div className="px-4 pb-3 pt-2 space-y-2 border-t border-brand-indigo/10">
                        {rewardTiers.map(tier => (
                          <div key={tier.id} className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-white">{tier.reward_title}</span>
                              {tier.reward_description && (
                                <p className="text-xs text-muted-foreground truncate">{tier.reward_description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-brand-gold font-semibold">{tier.points_required} puan</span>
                              {tier.max_winners !== null && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full border ${tier.is_full ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-brand-gold/30 text-brand-gold/70"}`}>
                                  {tier.is_full ? "Doldu" : `İlk ${tier.max_winners}`}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>

        {/* ── Fuar Galerisi ─────────────────────────────────────── */}
        {ev?.gallery_urls && ev.gallery_urls.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.09 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">Fuar Galerisi</p>
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
              {ev.gallery_urls.map(url => (
                <div key={url} className="flex-shrink-0 w-56 h-36 snap-start rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Check-in ──────────────────────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl border border-white/10 p-6">
          <AnimatePresence mode="wait">
            {checkedIn ? (
              <motion.div key="success" initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex flex-col items-center text-center py-2">
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Bağlantı Kuruldu!</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {exhibitor.company_name} firmasıyla bağlantın kuruldu. Firma temsilcisi seni görebilir.
                </p>
                <Link href="/visitor" className="text-xs text-brand-indigo-light hover:underline">
                  Paneline dön →
                </Link>
              </motion.div>
            ) : visitorRole === null ? (
              <motion.div key="login" className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-brand-cyan" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Standı Tara, Bağlantı Kur</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Firma ile bağlantı kurmak için ziyaretçi hesabınla giriş yap.
                </p>
                <Button variant="gradient" asChild className="w-full">
                  <Link href={`/login?redirect=/scan/${exhibitor.qr_token}`}>
                    <LogIn className="w-4 h-4" /> Giriş Yap
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Hesabın yok mu?{" "}
                  <Link href={`/register?role=visitor&redirect=/scan/${exhibitor.qr_token}`} className="text-brand-indigo-light hover:underline">
                    Ziyaretçi olarak kayıt ol
                  </Link>
                </p>
              </motion.div>
            ) : visitorRole !== "visitor" ? (
              <motion.div key="wrong-role" className="flex flex-col items-center text-center py-2">
                <AlertCircle className="w-10 h-10 text-yellow-400 mb-3" />
                <h2 className="font-display text-base font-bold text-white mb-1">Ziyaretçi hesabı gerekli</h2>
                <p className="text-sm text-muted-foreground">Bu sayfayı ziyaretçi rolüyle giriş yaparak kullanabilirsin.</p>
              </motion.div>
            ) : (
              <motion.div key="checkin" className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-brand-indigo-light" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Standa Check-in Yap</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Firma temsilcisiyle bağlantı kur, +20 puan kazan. Bilgilerin paylaşılacak.
                </p>
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full mb-4">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                <Button variant="gradient" className="w-full" onClick={handleCheckIn} disabled={isPending}>
                  {isPending ? "Kaydediliyor..." : "Check-in Yap"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Anket (check-in sonrası) ───────────────────────── */}
        <AnimatePresence>
          {checkedIn && hasSurvey && !surveySubmitted && (
            <motion.div
              key="survey"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              className="glass rounded-2xl border border-brand-violet/25 p-5 space-y-4"
            >
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-brand-violet-light" />
                <h3 className="font-semibold text-white text-sm">{survey!.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{exhibitor.company_name} size birkaç soru sormak istiyor.</p>

              <div className="space-y-4">
                {survey!.questions.map((q, i) => (
                  <div key={q.id}>
                    <p className="text-sm text-white mb-2">
                      <span className="text-muted-foreground mr-1">{i + 1}.</span> {q.question_text}
                    </p>
                    {q.question_type === "yes_no" ? (
                      <div className="flex gap-2">
                        {["Evet", "Hayır"].map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleSurveyAnswer(q.id, opt)}
                            className={`flex-1 py-2 rounded-xl text-sm border transition-all ${
                              surveyAnswers[q.id] === opt
                                ? "border-brand-violet bg-brand-violet/20 text-white"
                                : "border-white/12 text-muted-foreground hover:border-white/25"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(q.options ?? []).map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleSurveyAnswer(q.id, opt)}
                            className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                              surveyAnswers[q.id] === opt
                                ? "border-brand-violet bg-brand-violet/20 text-white"
                                : "border-white/12 text-muted-foreground hover:border-white/25"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="gradient"
                className="w-full"
                onClick={handleSurveySubmit}
                disabled={surveyPending || Object.keys(surveyAnswers).length === 0}
              >
                <Send className="w-4 h-4" />
                {surveyPending ? "Gönderiliyor..." : "Yanıtları Gönder"}
              </Button>
            </motion.div>
          )}

          {checkedIn && hasSurvey && surveySubmitted && (
            <motion.div key="survey-done" initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-green-500/20 p-5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-white">Anket yanıtlarınız iletildi. Teşekkürler!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Ürünler ───────────────────────────────────────────── */}
        {exhibitor.products.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-brand-cyan" />
              <h3 className="font-semibold text-white text-sm">Ürün & Hizmetler</h3>
            </div>
            <div className="space-y-3">
              {exhibitor.products.slice(0, 4).map(product => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/8 overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Ödüller ───────────────────────────────────────────── */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.22 }}>
          <div className="glass rounded-2xl border border-brand-gold/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-brand-gold" />
              <h3 className="font-semibold text-white text-sm">Hediyeler & Ödüller</h3>
            </div>
            {rewardTiers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">Bu fuarda henüz ödül tanımlanmamış.</p>
            ) : (
              <div className="space-y-3">
                {rewardTiers.map(tier => (
                  <div key={tier.id} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{tier.reward_title}</p>
                      {tier.reward_description && (
                        <p className="text-xs text-muted-foreground truncate">{tier.reward_description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-brand-gold font-semibold">{tier.points_required} puan</span>
                      {tier.max_winners !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${tier.is_full ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-brand-gold/30 text-brand-gold/70"}`}>
                          {tier.is_full ? "Doldu" : `İlk ${tier.max_winners}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {visitorRole === "visitor" && (
                  <div className="pt-1 flex justify-end">
                    <Link href="/visitor/loyalty" className="text-xs text-brand-gold hover:underline">Puanlarım →</Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <motion.p initial={{ y: 4 }} animate={{ y: 0 }} transition={{ delay: 0.3 }} className="text-center text-xs text-muted-foreground/40">
          BasExpo — Akıllı Fuar Sistemi
        </motion.p>
      </div>
    </div>
  );
}
