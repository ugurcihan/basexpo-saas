"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  CheckCircle2,
  LogIn,
  Building2,
  Package,
  AlertCircle,
  Tag,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createLeadFromScan } from "@/features/leads/actions";
import type { UserRole } from "@/types";

interface Product { id: string; name: string; description: string; image_url: string | null }
type EventRow = { id: string; name: string; location: string; start_date: string; end_date: string };

interface ExhibitorData {
  id: string;
  company_name: string;
  description: string;
  logo_url: string | null;
  tags: string[];
  qr_token: string;
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
}

export function ScanClient({ exhibitor, visitorRole, alreadyCheckedIn: initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checkedIn, setCheckedIn] = useState(initial);
  const [error, setError] = useState<string | null>(null);

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

  const ev = getEvent(exhibitor.event);

  return (
    <div className="min-h-screen bg-brand-dark text-foreground">
      {/* Top gradient strip */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-indigo via-brand-cyan to-brand-violet" />

      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        {/* Exhibitor header card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {exhibitor.logo_url ? (
                <Image src={exhibitor.logo_url} alt={exhibitor.company_name} width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-white leading-tight">
                {exhibitor.company_name}
              </h1>
              <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {ev?.name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {ev?.location}
                </span>
              </div>
            </div>
          </div>

          {exhibitor.description && (
            <p className="text-sm text-muted-foreground mb-4">{exhibitor.description}</p>
          )}

          {exhibitor.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {exhibitor.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/20 text-brand-indigo-light"
                >
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Check-in action */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/10 p-6"
        >
          <AnimatePresence mode="wait">
            {checkedIn ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center py-2"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">
                  Check-in Başarılı!
                </h2>
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
                <h2 className="font-display text-lg font-bold text-white mb-1">
                  Standı Tara, Bağlantı Kur
                </h2>
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
                <h2 className="font-display text-base font-bold text-white mb-1">
                  Ziyaretçi hesabı gerekli
                </h2>
                <p className="text-sm text-muted-foreground">
                  Bu sayfayı ziyaretçi rolüyle giriş yaparak kullanabilirsin.
                </p>
              </motion.div>
            ) : (
              <motion.div key="checkin" className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-brand-indigo-light" />
                </div>
                <h2 className="font-display text-lg font-bold text-white mb-1">
                  Standa Check-in Yap
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Standı ziyaret ettiğini firma temsilcisine bildir. Bilgilerin paylaşılacak.
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

        {/* Products */}
        {exhibitor.products.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl border border-white/8 p-5"
          >
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
                    {product.description && (
                      <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* BasExpo branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center text-xs text-muted-foreground/40"
        >
          BasExpo — Akıllı Fuar Sistemi
        </motion.p>
      </div>
    </div>
  );
}
