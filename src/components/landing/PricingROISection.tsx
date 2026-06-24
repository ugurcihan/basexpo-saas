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
    traditionalOk: false,
  },
  {
    label: "ROI belgesi",
    traditional: "Hazırlanamaz — veri dağınık",
    basexpo: "Otomatik PDF — 1 tıkla",
    traditionalOk: false,
  },
  {
    label: "Fuar ROI raporu",
    traditional: "Kağıt kayıt — veri kaybolur",
    basexpo: "Otomatik PDF — tek tıkla",
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

const SALES_CYCLE = [
  {
    period: "Gün 1–5",
    icon: QrCode,
    title: "Fuar",
    desc: "QR ile lead topla, AI eşleşme çalışsın, ilk temas kurulsun.",
    basexpo: "QR lead yakalama · AI eşleşme · Anlık bildirim",
    active: true,
    color: "brand-indigo",
  },
  {
    period: "Hafta 1–3",
    icon: Bell,
    title: "Takip",
    desc: "Fuar bitti — asıl iş şimdi başlıyor. Lead'leri ısıt, demo talep et.",
    basexpo: "Otomatik hatırlatıcı · Demo takvimi · Lead skoru",
    active: true,
    color: "brand-cyan",
  },
  {
    period: "Ay 1–3",
    icon: FileText,
    title: "Teklif",
    desc: "Kararın eşiğindesiniz. KOSGEB raporu güven verir, ROI belgesi süreci hızlandırır.",
    basexpo: "Fuar ROI PDF · İş değeri belgesi · Teklif takibi",
    active: true,
    color: "brand-violet",
  },
  {
    period: "Ay 3–6",
    icon: Handshake,
    title: "Karar",
    desc: "Müşteri karar veriyor. Pipeline'daki tüm data burada.",
    basexpo: "CRM takip · Geçmiş konuşmalar · İlerleme skoru",
    active: false,
    color: "brand-gold",
  },
  {
    period: "Ay 6–12",
    icon: TrendingUp,
    title: "Sözleşme & Yenileme",
    desc: "Müşteri kapandı. Sonraki fuara bu yılın datası ile daha güçlü girilir.",
    basexpo: "ROI özeti · Sonraki fuar planı · Bütçe gerekçesi",
    active: false,
    color: "brand-indigo",
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
              <p className="text-xs font-semibold text-brand-gold uppercase tracking-widest mb-3">
                &ldquo;1 haftalık fuar için neden yıl boyunca ödeme yapayım?&rdquo;
              </p>
              <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-2">
                Fuar <span className="text-brand-cyan">5 gün.</span> Sözleşme{" "}
                <span className="text-brand-violet-light">6 ay sonra.</span>
              </h3>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                B2B satışta karar anı fuarda değil, aylar sonradır. Fuarda tanıştınız — ödeme emrine{" "}
                <strong className="text-white">ortalama 4–8 ay sonra</strong> imza atılır.
                Platform bu yolculuğun tamamını yönetir.
              </p>
            </div>

            {/* Timeline */}
            <div className="px-4 lg:px-8 py-8">
              {/* Connector line (desktop) */}
              <div className="hidden lg:block relative mb-6">
                <div className="absolute top-5 left-[10%] right-[10%] h-px bg-gradient-to-r from-brand-indigo/40 via-brand-cyan/40 to-brand-indigo/40" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {SALES_CYCLE.map((step, i) => {
                  const Icon = step.icon;
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

                  return (
                    <motion.div
                      key={step.period}
                      initial={{ y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className={`relative rounded-xl border p-4 ${colorBorderMap[step.color]} ${step.active ? colorBgMap[step.color] : "bg-white/2"}`}
                    >
                      {step.active && (
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                          <span className="text-[8px] font-bold bg-brand-cyan text-brand-dark px-2 py-0.5 rounded-full whitespace-nowrap">
                            BasExpo aktif
                          </span>
                        </div>
                      )}
                      <div className={`w-8 h-8 rounded-lg ${colorBgMap[step.color]} flex items-center justify-center mb-3`}>
                        <Icon className={`w-4 h-4 ${colorTextMap[step.color]}`} />
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${colorTextMap[step.color]}`}>
                        {step.period}
                      </p>
                      <p className="text-sm font-bold text-white mb-1">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{step.desc}</p>
                      <div className={`text-[9px] font-medium ${step.active ? colorTextMap[step.color] : "text-muted-foreground/50"} leading-relaxed`}>
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
                    Bir B2B müşteri kararını ortalama 4–8 ayda verir.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bu 4–8 ayı Excel ile yönetirseniz lead&apos;ler soğur, fırsat kaybolur.
                    BasExpo her adımda sizi hatırlatır, belgeler, izler — sözleşme imzalanana kadar.
                  </p>
                </div>
              </div>
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
              className="space-y-3"
            >
              <Button asChild size="xl" variant="gradient" className="w-full font-semibold">
                <Link href="/register?role=exhibitor">
                  Firma Olarak Başla — 13.000 TL/ay
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground/60">
                ✓ İptal istediğin zaman · ✓ AI destekli fuar platformu
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
