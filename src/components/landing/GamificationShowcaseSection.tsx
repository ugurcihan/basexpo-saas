"use client";

import { motion } from "framer-motion";
import { Trophy, Crown, Star } from "lucide-react";

const ITEMS = [
  {
    icon: Trophy,
    color: "gold" as const,
    title: "Puan & Loot Box",
    description:
      "+50 giriş, +20 stant, +30 toplantı. Yeterli puan biriktir, otomatik kutu kazan. Kutuyu aç — içinden Common, Rare, Epic veya Legendary ödül çıkabilir.",
    tag: "Ödül Sistemi",
    pills: ["+50 Giriş", "+20 Stant", "+30 Toplantı"],
  },
  {
    icon: Crown,
    color: "violet" as const,
    title: "Liderlik Tablosu",
    description:
      "Fuar sıralaması, Türkiye sıralaması, Dünya sıralaması — üç ayrı liderlik tablosu. Puan biriktir, rakipleri geç, zirveye tırman.",
    tag: "Rekabet",
    pills: ["🏆 Fuar", "🇹🇷 Türkiye", "🌍 Dünya"],
  },
  {
    icon: Star,
    color: "cyan" as const,
    title: "Altın QR & Ödüller",
    description:
      "Organizatörün fuara özel Altın QR'larını bul, tara, sürpriz ödülü anında kazan. Milestone ödülleri: ilk N kişiye özel hediyeler.",
    tag: "Altın QR",
    pills: ["✨ Altın QR", "🎁 Milestone", "🏅 Rozet"],
  },
];

const colorConfig = {
  gold: {
    bg: "bg-brand-gold/10",
    border: "border-brand-gold/25",
    hover: "hover:border-brand-gold/50",
    icon: "text-brand-gold",
    tag: "bg-brand-gold/15 text-brand-gold",
    pill: "bg-brand-gold/10 text-brand-gold border border-brand-gold/20",
    glow: "rgba(245,158,11,0.12)",
  },
  violet: {
    bg: "bg-brand-violet/10",
    border: "border-brand-violet/25",
    hover: "hover:border-brand-violet/50",
    icon: "text-brand-violet-light",
    tag: "bg-brand-violet/15 text-brand-violet-light",
    pill: "bg-brand-violet/10 text-brand-violet-light border border-brand-violet/20",
    glow: "rgba(139,92,246,0.12)",
  },
  cyan: {
    bg: "bg-brand-cyan/10",
    border: "border-brand-cyan/25",
    hover: "hover:border-brand-cyan/50",
    icon: "text-brand-cyan",
    tag: "bg-brand-cyan/15 text-brand-cyan",
    pill: "bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20",
    glow: "rgba(34,211,238,0.12)",
  },
};

export function GamificationShowcaseSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D1226] via-brand-dark to-[#0D1226] pointer-events-none" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.25) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ y: 16 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/25 text-sm text-brand-gold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
            Fuar Oyunlaştırma Sistemi
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Oyna, Kazan,{" "}
            <span className="text-brand-gold">Zirveye Çık</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Her stant ziyareti puana dönüşür. Puanlar kutulara, kutular ödüllere.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ITEMS.map((item, index) => {
            const Icon = item.icon;
            const colors = colorConfig[item.color];

            return (
              <motion.div
                key={item.title}
                initial={{ y: 16 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group glass rounded-2xl p-6 border ${colors.border} ${colors.hover} transition-all duration-300 relative overflow-hidden`}
                style={{ boxShadow: `0 0 40px ${colors.glow}` }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.tag}`}>
                    {item.tag}
                  </span>
                </div>

                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Pill badges */}
                <div className="flex flex-wrap gap-2">
                  {item.pills.map((pill) => (
                    <span key={pill} className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.pill}`}>
                      {pill}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
