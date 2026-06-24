"use client";

import { motion } from "framer-motion";
import { Check, X, ArrowRight, QrCode, Bell, FileText, Handshake, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COMPARISON = [
  {
    label: "Lead toplama",
    traditional: "Kağıt form — saatler harcanır",
    basexpo: "Anlık QR — sıfır kayıp",
  },
  {
    label: "ROI belgesi",
    traditional: "Hazırlanamaz — veri dağınık",
    basexpo: "Otomatik PDF — tek tıkla",
  },
  {
    label: "Ziyaretçi eşleşmesi",
    traditional: "Rastgele — düşük dönüşüm",
    basexpo: "AI eşleşme — yüksek alaka",
  },
  {
    label: "Fuar sonrası takip",
    traditional: "Excel listesi — unutulur",
    basexpo: "CRM entegre — otomatik",
  },
];

const ROI_PROOF = [
  {
    label: "1 B2B müşteri",
    value: "150K – 1M TL",
    sub: "sektöre göre sözleşme değeri",
    textClass: "text-brand-cyan",
    borderClass: "border-brand-cyan/20",
  },
  {
    label: "BasExpo maliyeti",
    value: "156K TL/yıl",
    sub: "13.000 TL × 12 ay",
    textClass: "text-brand-indigo-light",
    borderClass: "border-brand-indigo/20",
  },
  {
    label: "Tahmini ROI",
    value: "2.5x – 6x",
    sub: "Türkiye B2B fuar ortalaması",
    textClass: "text-brand-violet-light",
    borderClass: "border-brand-violet/20",
  },
];

const SALES_CYCLE = [
  {
    period: "Gün 1–5",
    icon: QrCode,
    title: "Fuar",
    desc: "QR ile lead topla, AI eşleşme çalışsın, ilk temas kurulsun.",
    basexpo: "QR lead yakalama · AI eşleşme · Anlık bildirim",
    color: "brand-indigo",
  },
  {
    period: "Hafta 1–3",
    icon: Bell,
    title: "Takip",
    desc: "Fuar bitti — asıl iş şimdi başlıyor. Lead'leri ısıt, demo talep et.",
    basexpo: "Otomatik hatırlatıcı · Demo takvimi · Lead skoru",
    color: "brand-cyan",
  },
  {
    period: "Ay 1–3",
    icon: FileText,
    title: "Teklif",
    desc: "Kararın eşiğindesiniz. Fuar ROI raporu güven verir, somut iş değeri süreci hızlandırır.",
    basexpo: "Fuar ROI PDF · İş değeri belgesi · Teklif takibi",
    color: "brand-violet",
  },
  {
    period: "Ay 3–6",
    icon: Handshake,
    title: "Karar",
    desc: "Müşteri karar veriyor. Pipeline'daki tüm data burada.",
    basexpo: "CRM takip · Toplantı geçmişi · İlerleme skoru",
    color: "brand-gold",
  },
  {
    period: "Ay 6–12",
    icon: TrendingUp,
    title: "Sözleşme & Yenileme",
    desc: "Müşteri kapandı. Sonraki fuara bu yılın datası ile daha güçlü girilir.",
    basexpo: "ROI özeti · Sonraki fuar planı · Bütçe gerekçesi",
    color: "brand-indigo",
  },
];

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
const colorBorderMap: Record<string, string> = {
  "brand-indigo": "border-brand-indigo/25",
  "brand-cyan": "border-brand-cyan/25",
  "brand-violet": "border-brand-violet/25",
  "brand-gold": "border-brand-gold/25",
};

const CTA_FEATURES = [
  "QR lead + AI eşleşme",
  "Fuar ROI PDF raporu",
  "Fuar sonrası otomatik takip",
  "Yıl boyu aktif platform",
];

export function PricingROISection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-indigo/3 to-transparent pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo/10 border border-brand-indigo/25 text-sm text-brand-indigo-light mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            Yatırımın Anatomisi
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Karşılığında{" "}
            <span className="text-gradient-indigo">Ne Kazanırsınız?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Geleneksel yöntemle karşılaştırın. Rakamlar konuşsun.
          </p>
        </motion.div>

        {/* B2B Sales Cycle Block */}
        <motion.div
          initial={{ y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="px-6 lg:px-10 pt-8 pb-6 text-center border-b border-white/8">
              <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-3">
                Bir kapanan iş,{" "}
                <span className="text-brand-cyan">yıllık ücretin tamamını çıkarır.</span>
              </h3>
              <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                13.000 TL/ay = 156.000 TL/yıl. Sektörüne göre tek bir B2B sözleşmesi
                150.000 – 1.000.000 TL —{" "}
                <strong className="text-white">
                  yani kapanan ilk iş bütün yılın maliyetini çıkarır; gerisi kârdır.
                </strong>{" "}
                Peki neden aylık? Çünkü fuarda tanıştığın lead o gün satın almaz. Asıl
                risk fuarı kaçırmak değil,{" "}
                <strong className="text-white">fuardan sonra lead&apos;in soğuması.</strong>{" "}
                BasExpo o teması kayıt altına alır ve sonraki aylarda hatırlatır.
              </p>
            </div>

            {/* ROI Proof strip — fiyat çıpası, timeline'dan önce */}
            <div className="px-6 lg:px-10 py-5 border-b border-white/8">
              <div className="grid grid-cols-3 gap-3">
                {ROI_PROOF.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={`glass rounded-xl border ${item.borderClass} p-4 text-center`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className={`font-display text-xl lg:text-2xl font-bold ${item.textClass}`}>
                      {item.value}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{item.sub}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="px-4 lg:px-8 py-8">
              <div className="hidden lg:block relative mb-6">
                <div className="absolute top-5 left-[10%] right-[10%] h-px bg-gradient-to-r from-brand-indigo/40 via-brand-cyan/40 to-brand-indigo/40" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {SALES_CYCLE.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.period}
                      initial={{ y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className={`relative rounded-xl border p-4 ${colorBorderMap[step.color]} ${colorBgMap[step.color]}`}
                    >
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                        <span className="text-[8px] font-bold bg-brand-cyan text-brand-dark px-2 py-0.5 rounded-full whitespace-nowrap">
                          BasExpo aktif
                        </span>
                      </div>
                      <div className={`w-8 h-8 rounded-lg ${colorBgMap[step.color]} flex items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 ${colorTextMap[step.color]}`} />
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${colorTextMap[step.color]}`}>
                        {step.period}
                      </p>
                      <p className="text-sm font-bold text-white mb-1">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{step.desc}</p>
                      <div className={`text-[9px] font-medium ${colorTextMap[step.color]} leading-relaxed`}>
                        {step.basexpo}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom insight */}
            <div className="px-6 lg:px-10 pb-6 pt-2">
              <div className="glass rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-brand-cyan" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-1">
                    Fuar günü topladığın lead&apos;i Excel&apos;e atarsan, aylar içinde soğur ve kaybolur.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    BasExpo o günü kayba uğratmaz — her adımda hatırlatır, belgeler, izler.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom: Comparison + Pricing CTA */}
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

          {/* Pricing CTA card */}
          <motion.div
            initial={{ y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="glass-strong rounded-2xl border border-brand-indigo/25 p-8 space-y-6"
          >
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Aylık abonelik</p>
              <div className="flex items-end gap-1">
                <p className="font-display text-5xl font-bold text-white">13.000</p>
                <p className="text-2xl text-muted-foreground font-normal mb-1">TL</p>
              </div>
              <p className="text-sm text-muted-foreground/60 mt-1">/ ay &nbsp;·&nbsp; 156.000 TL / yıl</p>
            </div>

            <ul className="space-y-3">
              {CTA_FEATURES.map((feat) => (
                <li key={feat} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-brand-indigo-light" />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <Button asChild size="xl" variant="gradient" className="w-full font-semibold">
                <Link href="/register?role=exhibitor">
                  Firma Olarak Başla — 13.000 TL/ay
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground/60">
                ✓ İptal istediğin zaman · ✓ AI destekli fuar platformu
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
