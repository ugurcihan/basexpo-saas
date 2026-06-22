"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Crown, QrCode, Gift, CheckCircle2, AlertCircle, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanGoldenQR } from "@/features/events/goldenQRActions";

interface Props {
  token: string;
  initialResult: {
    qr?: { label: string; prize_description: string | null };
    requiresLogin?: boolean;
    alreadyScanned?: boolean;
    success?: boolean;
    error?: string;
  };
}

export function GoldenScanClient({ token, initialResult }: Props) {
  const [result, setResult] = useState(initialResult);
  const [isPending, startTransition] = useTransition();

  function handleScan() {
    startTransition(async () => {
      const res = await scanGoldenQR(token);
      setResult(res as typeof result);
    });
  }

  if (result.error) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl border border-red-500/20 p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-white mb-2">QR Kodu Geçersiz</h1>
          <p className="text-muted-foreground text-sm">{result.error}</p>
          <Button variant="outline" className="mt-6" asChild>
            <Link href="/">Ana Sayfa</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  if (result.alreadyScanned) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl border border-brand-gold/30 p-8 max-w-sm w-full text-center">
          <CheckCircle2 className="w-12 h-12 text-brand-gold mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-white mb-2">Zaten Katıldınız!</h1>
          <p className="text-sm text-muted-foreground mb-3">{result.qr?.label}</p>
          {result.qr?.prize_description && (
            <p className="text-brand-gold font-medium text-sm">{result.qr.prize_description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-4">Bu QR kodunu daha önce taradınız. Çekilişe katılımınız kaydedildi.</p>
        </motion.div>
      </div>
    );
  }

  if (result.success) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 overflow-hidden">
        {/* Confetti effect */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="fixed w-2 h-2 rounded-full"
            style={{ backgroundColor: ["#F59E0B", "#22D3EE", "#6366F1", "#8B5CF6"][i % 4], left: `${Math.random() * 100}%`, top: "-10px" }}
            animate={{ y: "110vh", rotate: 720, opacity: [1, 1, 0] }}
            transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: "easeIn" }}
          />
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="glass rounded-3xl border border-brand-gold/40 p-8 max-w-sm w-full text-center relative z-10"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Crown className="w-16 h-16 text-brand-gold mx-auto mb-4" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Çekilişe Katıldınız!</h1>
          <p className="text-brand-gold font-semibold mb-2">{result.qr?.label}</p>
          {result.qr?.prize_description && (
            <div className="glass rounded-xl border border-brand-gold/20 p-3 mt-3 mb-4">
              <div className="flex items-center gap-2 justify-center">
                <Gift className="w-4 h-4 text-brand-gold" />
                <span className="text-brand-gold font-medium text-sm">{result.qr.prize_description}</span>
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Katılımınız kaydedildi. Kazanan fuar kapanışında açıklanacak!</p>
          <div className="flex gap-2 mt-6 justify-center">
            <Sparkles className="w-4 h-4 text-brand-gold animate-pulse" />
            <Sparkles className="w-4 h-4 text-brand-cyan animate-pulse" style={{ animationDelay: "0.3s" }} />
            <Sparkles className="w-4 h-4 text-brand-violet animate-pulse" style={{ animationDelay: "0.6s" }} />
          </div>
        </motion.div>
      </div>
    );
  }

  if (result.requiresLogin) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl border border-brand-gold/30 p-8 max-w-sm w-full text-center">
          <Crown className="w-12 h-12 text-brand-gold mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold text-white mb-2">{result.qr?.label}</h1>
          {result.qr?.prize_description && (
            <p className="text-brand-gold text-sm font-medium mb-4">{result.qr.prize_description}</p>
          )}
          <p className="text-muted-foreground text-sm mb-6">
            Çekilişe katılmak için giriş yapmanız gerekiyor.
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="gradient" asChild>
              <Link href={`/login?redirect=/golden-scan/${token}`}><LogIn className="w-4 h-4 mr-2" /> Giriş Yap</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/register?role=visitor&redirect=/golden-scan/${token}`}>Üye Ol</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Initial state — show QR info and scan button (shouldn't reach here normally since server scans)
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl border border-brand-gold/30 p-8 max-w-sm w-full text-center">
        <Crown className="w-12 h-12 text-brand-gold mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold text-white mb-4">{result.qr?.label ?? "Altın QR"}</h1>
        <Button variant="gradient" onClick={handleScan} disabled={isPending} className="w-full">
          <QrCode className="w-4 h-4 mr-2" /> {isPending ? "Kaydediliyor..." : "Çekilişe Katıl"}
        </Button>
      </motion.div>
    </div>
  );
}
