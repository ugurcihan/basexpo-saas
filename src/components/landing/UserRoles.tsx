"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Building2,
  UserCircle2,
  ChevronRight,
  Check,
  BarChart3,
  FileDown,
  Users2,
  FileCheck,
} from "lucide-react";
import Link from "next/link";

const ROLES = [
  {
    id: "organizer",
    icon: Settings2,
    color: "indigo",
    label: "Organizatör",
    tagline: "Fuarı Kur — Tamamen Ücretsiz",
    description:
      "Platform organizatöre ücretsiz. Ön kayıt verisi stant satışını kanıtlar, ısı haritası fuarı analiz eder, AI raporu yatırımcıya sunulur.",
    features: [
      "Fuar & salon yönetimi",
      "Firma davet & onay sistemi",
      "Gerçek zamanlı ısı haritası",
      "Fuar sonu AI PDF raporu",
      "Stant satışı için ön kayıt verisi kanıtı",
      "Ziyaretçi demografisi & davranış analizi",
    ],
    featureIcons: [null, null, null, null, BarChart3, Users2],
    trust: "✓ Excel'den kurtul · ✓ WhatsApp grubuna gerek yok · ✓ 5 dakikada kur",
    cta: "Fuar Oluştur",
    href: "/register?role=organizer",
    gradient: "from-brand-indigo/20 via-brand-indigo/5 to-transparent",
    border: "border-brand-indigo/25",
    iconBg: "bg-brand-indigo/15",
    iconColor: "text-brand-indigo-light",
    glowColor: "rgba(99,102,241,0.15)",
    badgeColor: "bg-brand-indigo/20 text-brand-indigo-light border-brand-indigo/30",
    checkColor: "text-brand-indigo-light",
  },
  {
    id: "exhibitor",
    icon: Building2,
    color: "cyan",
    label: "Katılımcı Firma",
    tagline: "13.000 TL/ay — 1 Müşteri Tüm Yatırımı Karşılar",
    description:
      "KVKK onaylı lead topla, detaylı fuar ROI raporu al, AI ile doğru ziyaretçiyle eşleş. Platform yıl boyu çalışır — fuardan önce hazırlık, sonra takip.",
    features: [
      "KVKK'lı lead toplama",
      "Markalı QR sayfa & ürün vitrini",
      "AI tabanlı ziyaretçi eşleşmesi",
      "Lead skoru & ROI dashboard",
      "Fuar ROI — tek tıkla PDF raporu",
      "Yıl boyu aktif lead CRM ve fuar hazırlık dashboard'u",
    ],
    featureIcons: [null, null, null, null, FileCheck, FileDown],
    trust: null,
    cta: "Firma Kaydı",
    href: "/register?role=exhibitor",
    gradient: "from-brand-cyan/20 via-brand-cyan/5 to-transparent",
    border: "border-brand-cyan/25",
    iconBg: "bg-brand-cyan/15",
    iconColor: "text-brand-cyan",
    glowColor: "rgba(34,211,238,0.15)",
    badgeColor: "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/30",
    checkColor: "text-brand-cyan",
    featured: true,
  },
  {
    id: "visitor",
    icon: UserCircle2,
    color: "violet",
    label: "Ziyaretçi",
    tagline: "Gez, Rozet Kazan, Hediye Kazan",
    description:
      "AI sana uygun firmaları önerir. Stantları gez, rozet kazan, puan biriktir. Kahve, şarj aleti veya hediye çekine dönüştür.",
    features: [
      "Kişisel QR bilet & rozet",
      "AI firma önerileri",
      "Kahve, şarj, hediye çeki ödül sistemi",
      "Toplantı & networking",
    ],
    featureIcons: [null, null, null, null],
    trust: null,
    cta: "Ziyaretçi Ol",
    href: "/register?role=visitor",
    gradient: "from-brand-violet/20 via-brand-violet/5 to-transparent",
    border: "border-brand-violet/25",
    iconBg: "bg-brand-violet/15",
    iconColor: "text-brand-violet-light",
    glowColor: "rgba(139,92,246,0.15)",
    badgeColor: "bg-brand-violet/20 text-brand-violet-light border-brand-violet/30",
    checkColor: "text-brand-violet-light",
  },
];

export function UserRoles() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            Herkes İçin Farklı Değer
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Sana Özel{" "}
            <span className="text-gradient-indigo">Fuar Deneyimi</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Organizatöre ücretsiz, firmaya ROI, ziyaretçiye ödül. Herkes kazanır.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {ROLES.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.div
                key={role.id}
                initial={{ y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.7,
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.3 },
                }}
                className="relative group"
              >
                {/* Glow on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: role.glowColor }}
                />

                <div
                  className={`relative glass-strong rounded-2xl border ${role.border} overflow-hidden h-full flex flex-col transition-all duration-300 group-hover:border-opacity-60`}
                >
                  {/* Top gradient */}
                  <div
                    className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${role.gradient} pointer-events-none`}
                  />

                  {/* Featured badge */}
                  {role.featured && (
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan">
                      Premium
                    </div>
                  )}

                  <div className="relative p-8 flex flex-col h-full">
                    {/* Role badge */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border w-fit mb-6 ${role.badgeColor}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {role.label}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl ${role.iconBg} border ${role.border} flex items-center justify-center mb-5`}
                    >
                      <Icon className={`w-7 h-7 ${role.iconColor}`} />
                    </div>

                    <h3 className="font-display text-2xl font-bold text-white mb-1">
                      {role.tagline}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                      {role.description}
                    </p>

                    {/* Feature list */}
                    <ul className="space-y-2.5 mb-8">
                      {role.features.map((feature, fi) => {
                        const FIcon = role.featureIcons?.[fi];
                        return (
                          <li key={feature} className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full ${role.iconBg} flex items-center justify-center flex-shrink-0`}
                            >
                              {FIcon
                                ? <FIcon className={`w-2.5 h-2.5 ${role.checkColor}`} />
                                : <Check className={`w-2.5 h-2.5 ${role.checkColor}`} />
                              }
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* CTA */}
                    <Button
                      asChild
                      variant={role.featured ? "gradient" : "outline"}
                      size="lg"
                      className="w-full group/btn"
                    >
                      <Link href={role.href}>
                        {role.cta}
                        <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
                    </Button>
                    {role.trust && (
                      <p className="text-center text-xs text-muted-foreground/60 mt-2">
                        {role.trust}
                      </p>
                    )}
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
