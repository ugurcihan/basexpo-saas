"use client";

import { motion } from "framer-motion";
import { ScanLine, Sparkles, BarChart3 } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: ScanLine,
    color: "indigo",
    title: "Kayıt Ol, Biletini Al",
    description:
      "Fuara kaydol, ilgi alanlarını seç ve kişisel QR biletini al. Sistem seni tanıyor — hangi firmalarla eşleşeceğini bile önceden biliyor.",
    highlight: "Saniyeler içinde kayıt",
  },
  {
    step: "02",
    icon: Sparkles,
    color: "cyan",
    title: "Fuarı Gez, Stantları Keşfet",
    description:
      "AI sana en uygun firmaları önerir. Stantları ziyaret et, QR tara, rozet kazan. Her adım sadakat puanına dönüşür.",
    highlight: "Rozet + puan her ziyarette",
  },
  {
    step: "03",
    icon: BarChart3,
    color: "violet",
    title: "Bağlan, Ödül Kazan",
    description:
      "Firmalar seni hatırlar, sana özel teklifler gönderir. 500 puan biriktir — kahve, şarj aleti veya hediye çekine dönüştür. Networking kalıcı hale gelir.",
    highlight: "500 puan = Hediye Çeki",
  },
];

const colorMap = {
  indigo: {
    bg: "bg-brand-indigo/10",
    border: "border-brand-indigo/20",
    icon: "text-brand-indigo-light",
    step: "text-brand-indigo/40",
    badge: "bg-brand-indigo/15 text-brand-indigo-light",
    glow: "group-hover:shadow-brand-indigo/20",
    connector: "from-brand-indigo/30",
  },
  cyan: {
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/20",
    icon: "text-brand-cyan",
    step: "text-brand-cyan/40",
    badge: "bg-brand-cyan/15 text-brand-cyan",
    glow: "group-hover:shadow-brand-cyan/20",
    connector: "from-brand-cyan/30",
  },
  violet: {
    bg: "bg-brand-violet/10",
    border: "border-brand-violet/20",
    icon: "text-brand-violet-light",
    step: "text-brand-violet/40",
    badge: "bg-brand-violet/15 text-brand-violet-light",
    glow: "group-hover:shadow-brand-violet/20",
    connector: "from-brand-violet/30",
  },
};

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-[#0D1226] to-brand-dark pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo animate-pulse" />
            3 Adımda Fuar Deneyimi
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Gez, Kazan,{" "}
            <span className="text-gradient-indigo">Bağlan</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kayıttan rozete, rozetten hediye çekine kadar her adım otomatik ve akıllı.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector lines (desktop) */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-brand-indigo/30 via-brand-cyan/30 to-brand-violet/30" />

          {STEPS.map((step, index) => {
            const colors = colorMap[step.color as keyof typeof colorMap];
            const Icon = step.icon;

            return (
              <motion.div
                key={step.step}
                initial={{ y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.18,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <div
                  className={`group relative glass rounded-2xl p-8 border ${colors.border} hover:${colors.glow} hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full flex flex-col`}
                >
                  {/* Step number background */}
                  <div
                    className={`absolute top-6 right-6 font-display text-5xl font-black ${colors.step} select-none`}
                  >
                    {step.step}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-6`}
                  >
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>

                  <h3 className="font-display text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p
                    className="text-muted-foreground leading-relaxed mb-6 flex-1"
                    dangerouslySetInnerHTML={{ __html: step.description }}
                  />

                  {/* Highlight badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.badge} w-fit`}
                  >
                    <span className={`w-1 h-1 rounded-full ${colors.icon.replace("text-", "bg-")}`} />
                    {step.highlight}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
