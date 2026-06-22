"use client";

import { motion } from "framer-motion";
import {
  Brain,
  QrCode,
  LayoutDashboard,
  Network,
  Trophy,
  BarChart2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Matchmaking",
    description:
      "pgvector ile vektör benzerliği. Ziyaretçi ilgi alanları ile firma etiketleri eşleştirilir, %90+ doğrulukla öneri üretilir.",
    color: "indigo",
    tag: "Yapay Zeka",
  },
  {
    icon: QrCode,
    title: "QR Lead Capture",
    description:
      "Her firma ve ziyaretçiye benzersiz QR token. Stand ziyareti anında lead'e dönüşür, kayıp sıfır.",
    color: "cyan",
    tag: "Çekirdek Özellik",
  },
  {
    icon: LayoutDashboard,
    title: "Rol Bazlı Paneller",
    description:
      "Organizatör, firma ve ziyaretçi için ayrı dashboard'lar. Herkes kendi metriklerini, kendi görünümünde görür.",
    color: "violet",
    tag: "UX",
  },
  {
    icon: Network,
    title: "Networking & Toplantı",
    description:
      "Bağlantı isteği gönder, toplantı planla, 1-1 mesajlaş. Fuar sonrası ilişki yönetimi de platformda.",
    color: "indigo",
    tag: "B2B Network",
  },
  {
    icon: Trophy,
    title: "Rozet & Sadakat Sistemi",
    description:
      "Stant ziyaretleri, bağlantılar ve toplantılar puana dönüşür. 500 puan biriktir, bir sonraki fuara ücretsiz gir.",
    color: "gold",
    tag: "Ödül",
  },
  {
    icon: BarChart2,
    title: "Gerçek Zamanlı Analitik",
    description:
      "Ziyaretçi sayısı, lead dönüşüm oranı, AI eşleşme skoru. Supabase Realtime ile anlık güncelleme.",
    color: "violet",
    tag: "Analitik",
  },
];

const colorConfig = {
  indigo: {
    bg: "bg-brand-indigo/10",
    border: "border-brand-indigo/20",
    icon: "text-brand-indigo-light",
    tag: "bg-brand-indigo/15 text-brand-indigo-light",
    hover: "hover:border-brand-indigo/40",
  },
  cyan: {
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/20",
    icon: "text-brand-cyan",
    tag: "bg-brand-cyan/15 text-brand-cyan",
    hover: "hover:border-brand-cyan/40",
  },
  violet: {
    bg: "bg-brand-violet/10",
    border: "border-brand-violet/20",
    icon: "text-brand-violet-light",
    tag: "bg-brand-violet/15 text-brand-violet-light",
    hover: "hover:border-brand-violet/40",
  },
  gold: {
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/20",
    icon: "text-brand-gold",
    tag: "bg-brand-gold/15 text-brand-gold",
    hover: "hover:border-brand-gold/40",
  },
};

export function Features() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1226] to-brand-dark pointer-events-none" />

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
            <span className="w-1.5 h-1.5 rounded-full bg-brand-violet animate-pulse" />
            Herkes İçin Farklı Değer
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Platformun{" "}
            <span className="text-gradient-indigo">Temel Motorları</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organizatörden ziyaretçiye, firmadan sponsora — her role özel araçlar tek çatı altında.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const colors = colorConfig[feature.color as keyof typeof colorConfig];

            return (
              <motion.div
                key={feature.title}
                initial={{ y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.6,
                  delay: (index % 3) * 0.1 + Math.floor(index / 3) * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group glass rounded-2xl p-6 border ${colors.border} ${colors.hover} transition-all duration-300`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.tag}`}
                  >
                    {feature.tag}
                  </span>
                </div>

                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
