"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin, Calendar, Building2, Package, LogIn,
  CheckCircle2, AlertCircle, Zap, Tag, Trophy, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkInToBoothScan } from "@/features/leads/actions";
import type { UserRole } from "@/types";

interface EventRow { id: string; name: string; location: string; start_date: string; end_date: string }
interface Product  { id: string; name: string; description: string; image_url: string | null }
interface ExhibitorRow {
  id: string; company_name: string; description: string;
  logo_url: string | null; tags: string[];
  products: Product[];
}

interface Props {
  boothId: string;
  boothCode: string;
  qrToken: string;
  event: EventRow | null;
  exhibitor: ExhibitorRow | null;
  visitorRole: UserRole | null;
}

export function BoothScanClient({ boothId, boothCode, qrToken, event, exhibitor, visitorRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checkedIn, setCheckedIn] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [goldenReveal, setGoldenReveal] = useState(false);
  const [bonusPoints, setBonusPoints]   = useState(0);

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      const result = await checkInToBoothScan(boothId);
      if (result.error === "login_required") {
        router.push(`/login?redirect=/scan/booth/${qrToken}`);
        return;
      }
      if (result.error) { setError(result.error); return; }

      setCheckedIn(true);

      if (result.isGolden && result.bonusPoints > 0) {
        setTimeout(() => {
          setBonusPoints(result.bonusPoints);
          setGoldenReveal(true);
        }, 800);
      }
    });
  }

  return (
    <div className="min-h-screen bg-brand-dark text-foreground">
      <div className="h-1 w-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-violet" />

      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">

        {/* Exhibitor / booth header */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="glass rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {exhibitor?.logo_url ? (
                <Image src={exhibitor.logo_url} alt={exhibitor.company_name} width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-white leading-tight">
                {exhibitor?.company_name ?? `Stand ${boothCode}`}
              </h1>
              <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-muted-foreground">
                {event && (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {event.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {event.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {exhibitor?.description && (
            <p className="text-sm text-muted-foreground mb-4">{exhibitor.description}</p>
          )}

          {exhibitor && exhibitor.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {exhibitor.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/20 text-brand-indigo-light">
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}

          {!exhibitor && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/4 border border-white/8 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Bu stand yakında bir firma ile dolacak. QR'ı okutarak check-in yapabilirsin.</span>
            </div>
          )}
        </motion.div>

        {/* Altın QR sürpriz reveal */}
        <AnimatePresence>
          {goldenReveal && (
            <motion.div
              key="golden"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-2xl border-2 border-brand-gold bg-brand-gold/10 p-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-brand-gold" />
                <Trophy className="w-8 h-8 text-brand-gold" />
                <Sparkles className="w-6 h-6 text-brand-gold" />
              </div>
              <h2 className="font-display text-xl font-bold text-brand-gold mb-1">
                Altın QR Buldunuz!
              </h2>
              <p className="text-sm text-white/80 mb-3">
                Tebrikler! Bu gizli altın stantı keşfettiniz.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-gold/20 border border-brand-gold/40">
                <Trophy className="w-4 h-4 text-brand-gold" />
                <span className="text-brand-gold font-bold text-lg">+{bonusPoints} Bonus Puan</span>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Puan hesabınıza eklendi. Fuarı keşfetmeye devam edin!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check-in card */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/10 p-6"
        >
          <AnimatePresence mode="wait">
            {checkedIn ? (
              <motion.div key="success" initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex flex-col items-center text-center py-2">
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Check-in Başarılı!</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {exhibitor
                    ? `${exhibitor.company_name} firmasıyla bağlantın kuruldu.`
                    : "Stand ziyaretiniz kaydedildi. +20 puan kazandınız."}
                </p>
                <Link href="/visitor" className="text-xs text-brand-indigo-light hover:underline">Paneline dön →</Link>
              </motion.div>
            ) : visitorRole === null ? (
              <motion.div key="login" className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-brand-cyan" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Standı Tara, Puan Kazan</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Ziyaretçi hesabınla giriş yap, check-in yap ve puan kazan.
                </p>
                <Button variant="gradient" asChild className="w-full">
                  <Link href={`/login?redirect=/scan/booth/${qrToken}`}>
                    <LogIn className="w-4 h-4" /> Giriş Yap
                  </Link>
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Hesabın yok mu?{" "}
                  <Link href={`/register?role=visitor&redirect=/scan/booth/${qrToken}`} className="text-brand-indigo-light hover:underline">
                    Ziyaretçi olarak kayıt ol
                  </Link>
                </p>
              </motion.div>
            ) : visitorRole !== "visitor" ? (
              <motion.div key="wrong-role" className="flex flex-col items-center text-center py-2">
                <AlertCircle className="w-10 h-10 text-yellow-400 mb-3" />
                <h2 className="font-display text-base font-bold text-white mb-1">Ziyaretçi hesabı gerekli</h2>
                <p className="text-sm text-muted-foreground">Bu sayfayı ziyaretçi rolüyle kullanabilirsin.</p>
              </motion.div>
            ) : (
              <motion.div key="checkin" className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-brand-indigo-light" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">Standa Check-in Yap</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Stantı ziyaret ettiğini kaydet ve puan kazan.
                </p>
                {error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full mb-4">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                <Button variant="gradient" className="w-full" onClick={handleCheckIn} disabled={isPending}>
                  {isPending ? "Kaydediliyor..." : "Check-in Yap (+20 puan)"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ürünler */}
        {exhibitor && exhibitor.products.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-brand-cyan" />
              <h3 className="font-semibold text-white text-sm">Ürün & Hizmetler</h3>
            </div>
            <div className="space-y-3">
              {exhibitor.products.slice(0, 4).map((product) => (
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
                    {product.description && <p className="text-xs text-muted-foreground truncate">{product.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.p initial={{ y: 4 }} animate={{ y: 0 }} transition={{ delay: 0.35 }} className="text-center text-xs text-muted-foreground/40">
          BasExpo — Akıllı Fuar Sistemi
        </motion.p>
      </div>
    </div>
  );
}
