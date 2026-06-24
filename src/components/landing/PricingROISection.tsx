"use client";

import { motion } from "framer-motion";
import { Check, X, ArrowRight, BarChart3, Calendar, Sparkles, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COMPARISON = [
  {
    label: "Lead toplama",
    traditional: "Kağıt form — saatler harcanır",
    basexpo: "Anlık QR — sıfır kayıp",
    traditionalOk: false,
  },
  {
    label: "ROI belgesi",
    traditional: "Hazırlanamaz — veri dağınık",
    basexpo: "Otomatik PDF — 1 tıkla",
    traditionalOk: false,
  },
  {
    label: "KOSGEB desteği",
    traditional: "Belge yok — başvuru zor",
    basexpo: "Hazır rapor — başvuruya ekle",
    traditionalOk: false,
  },
  {
    label: "Ziyaretçi eşleşmesi",
    traditional: "Rastgele — düşük dönüşüm",
    basexpo: "AI %90+ doğruluk",
    traditionalOk: false,
  },
  {
    label: "Fuar sonrası takip",
    traditional: "Excel listesi — unutulur",
    basexpo: "CRM entegre — otomatik",
    traditionalOk: false,
  },
];

const ROI_PROOF = [
  {
    label: "1 B2B müşteri",
    value: "150K – 1M TL",
    sub: "sektöre göre sözleşme değeri",
    color: "brand-cyan",
  },
  {
    label: "BasExpo maliyeti",
    value: "156K TL/yıl",
    sub: "13.000 TL × 12 ay",
    color: "brand-indigo",
  },
  {
    label: "Tahmini ROI",
    value: "2.5x – 6x",
    sub: "Türkiye B2B fuar ortalaması",
    color: "brand-violet",
  },
];

const YEAR_TIMELINE = [
  {
    period: "Oca – Mar",
    icon: BarChart3,
    title: "Lead Takibi & CRM",
    desc: "Önceki fuarın lead'lerini takip et, teklif dönüşümlerini kaydet, pipeline'ı kapat.",
    color: "brand-indigo",
  },
  {
    period: "Nis – May",
    icon: Calendar,
    title: "Ön Kayıt & Hazırlık",
    desc: "Gelecek fuar ön kaydı açılır. Hangi firmalar rakip stantta? Rekabet analizi hazır.",
    color: "brand-cyan",
  },
  {
    period: "Haz – Tem",
    icon: Sparkles,
    title: "AI Profil & Eşleşme",
    desc: "AI eşleşme motoru güncellenip fuara 3 ay kala potansiyel müşteri listeni sunar.",
    color: "brand-violet",
  },
  {
    period: "Ağu – Eki",
    icon: FileCheck,
    title: "Fuar Hazırlık Dashboard",
    desc: "Stand planlaması, materyal listesi, KOSGEB rapor taslağı — hepsi tek ekranda.",
    color: "brand-gold",
  },
];

export function PricingROISection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-indigo/3 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo/10 border border-brand-indigo/25 text-sm text-brand-indigo-light mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            Neden 13.000 TL/ay Mantıklı?
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            13.000 TL/ay —{" "}
            <span className="text-gradient-indigo">Karşılığında Ne Kazanırsınız?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Geleneksel yöntemle karşılaştırın. Rakamlar konuşsun.
          </p>
        </motion.div>

        {/* "Neden aylık?" answer block */}
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="glass-strong rounded-2xl border border-brand-gold/20 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/8 bg-brand-gold/5">
              <p className="font-display text-xl font-bold text-white">
                &ldquo;Yılda 1 fuara katılan firma neden aylık ödeme yapsın?&rdquo;
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Çünkü platform fuar haftasında değil, yıl boyunca değer üretir.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/8">
              {YEAR_TIMELINE.map((item, i) => {
                const Icon = item.icon;
                const colorTextMap: Record<string, string> = {
                  "brand-indigo": "text-brand-indigo-light",
                  "brand-cyan": "text-brand-cyan",
                  "brand-violet": "text-brand-violet-light",
                  "brand-gold": "text-brand-gold",
                };
                const colorBgMap: Record<string, string> = {
                  "brand-indigo": "bg-brand-indigo/15",
                  "brand-cyan": "bg-brand-cyan/15",
                  "brand-violet": "bg-brand-violet/15",
                  "brand-gold": "bg-brand-gold/15",
                };
                return (
                  <motion.div
                    key={item.period}
                    initial={{ y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="px-5 py-5"
                  >
                    <div className={`w-8 h-8 rounded-lg ${colorBgMap[item.color]} flex items-center justify-center mb-3`}>
                      <Icon className={`w-4 h-4 ${colorTextMap[item.color]}`} />
                    </div>
                    <p className={`text-xs font-bold mb-1 ${colorTextMap[item.color]}`}>{item.period}</p>
                    <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-white/8 bg-white/2">
              <p className="text-xs text-muted-foreground/70 text-center">
                Yılda sadece fuar döneminde kullanmak isterseniz:{" "}
                <span className="text-white font-medium">3 aylık paket — fuar öncesi, fuar ayı, fuar sonrası.</span>
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Comparison table */}
          <motion.div
            initial={{ y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="glass-strong rounded-2xl border border-white/8 overflow-hidden"
          >
            <div className="grid grid-cols-[1fr,auto,auto] gap-0 px-6 py-4 border-b border-white/8 bg-white/3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kalem</span>
              <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider px-4">Geleneksel</span>
              <span className="text-xs font-semibold text-brand-cyan uppercase tracking-wider px-4">BasExpo</span>
            </div>

            {COMPARISON.map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="grid grid-cols-[1fr,auto,auto] gap-0 px-6 py-4 border-b border-white/5 last:border-0 items-start"
              >
                <div>
                  <p className="text-sm font-medium text-white">{row.label}</p>
                </div>
                <div className="px-4 max-w-[140px]">
                  <div className="flex items-start gap-1.5">
                    <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground/70 leading-snug">{row.traditional}</p>
                  </div>
                </div>
                <div className="px-4 max-w-[140px]">
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-brand-cyan flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-brand-cyan/90 leading-snug font-medium">{row.basexpo}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ROI proof + CTA */}
          <div className="space-y-6">
            {ROI_PROOF.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`glass rounded-xl border border-${item.color}/20 p-6`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                    <p className={`font-display text-3xl font-bold text-${item.color === "brand-cyan" ? "brand-cyan" : item.color === "brand-indigo" ? "brand-indigo-light" : "brand-violet-light"}`}>
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{item.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.36 }}
              className="glass rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5 animate-pulse" />
                <p className="text-sm text-emerald-300 leading-relaxed">
                  <strong className="text-emerald-200">KOSGEB desteği hesaba katılırsa</strong> — yatırım maliyeti
                  sıfıra yaklaşır, net ROI katlanır.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="space-y-3"
            >
              <Button asChild size="xl" variant="gradient" className="w-full font-semibold">
                <Link href="/register?role=exhibitor">
                  Firma Olarak Başla — 13.000 TL/ay
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground/60">
                ✓ İlk 14 gün ücretsiz deneyin · ✓ Kredi kartı gerekmez
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
