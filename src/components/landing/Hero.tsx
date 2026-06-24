"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Zap, TrendingUp, FileCheck } from "lucide-react";
import Link from "next/link";
import { InstallBadges } from "@/components/landing/AppInstallSection";

const STATS = [
  { value: 8500, suffix: "+", label: "Ziyaretçi", icon: Users },
  { value: 120, suffix: "+", label: "Katılımcı Firma", icon: Zap },
  { value: 14000, suffix: "+", label: "Lead Oluşturuldu", icon: TrendingUp },
];

const PHONE_NOTIFICATIONS = [
  {
    id: 0,
    emoji: "📅",
    app: "BasExpo",
    time: "şimdi",
    title: "Etkinlik Hatırlatıcı",
    body: "Saat 15:00 · B Salonu — CEO Konuşması",
    expand: "47 katılımcı B Salonunda. Oturumun başlamasına 5 dakika kaldı.",
    colorClass: "bg-brand-indigo/25 border-brand-indigo/40",
  },
  {
    id: 1,
    emoji: "🤝",
    app: "BasExpo",
    time: "2 dk önce",
    title: "AI Eşleşme Bulundu",
    body: "TechVision A.Ş. — Uyum Skoru: %94",
    expand: "Profilinize göre en yüksek uyum. Stand C-12'ye gidin ve QR'ı tarayın.",
    colorClass: "bg-brand-cyan/20 border-brand-cyan/35",
  },
  {
    id: 2,
    emoji: "🏆",
    app: "BasExpo",
    time: "8 dk önce",
    title: "Rozet Kazandınız!",
    body: "Ağ Kurucusu · +50 puan eklendi",
    expand: "Toplamda 50 puanınız var. 200 puana ulaşınca şarj aleti hediye çeki kazanırsınız.",
    colorClass: "bg-brand-gold/20 border-brand-gold/35",
  },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }

    const particles: Particle[] = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="hero-canvas"
      aria-hidden="true"
    />
  );
}

function InteractivePhoneMockup() {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ x: 40 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex items-center justify-center h-96 lg:h-[560px]"
    >
      {/* Glow behind phone */}
      <div className="absolute inset-0 bg-gradient-radial from-brand-indigo/15 via-transparent to-transparent rounded-full pointer-events-none" />

      {/* iOS Phone frame */}
      <div className="relative z-10 w-[260px] lg:w-[280px] h-[520px] lg:h-[560px] rounded-[42px] bg-[#08081a] border-2 border-white/15 shadow-2xl shadow-black/60 overflow-hidden flex flex-col">

        {/* Dynamic Island */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-28 h-7 bg-black rounded-full" />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-1 flex-shrink-0">
          <span className="text-white text-[11px] font-semibold">9:41</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[3, 4, 4, 4].map((h, i) => (
                <div key={i} className="w-0.5 rounded-sm bg-white" style={{ height: h * 2 + "px" }} />
              ))}
            </div>
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.5 8.5c2.7-2.7 6.4-4.4 10.5-4.4s7.8 1.7 10.5 4.4l-2.1 2.1c-2.2-2.2-5.2-3.5-8.4-3.5s-6.2 1.3-8.4 3.5L1.5 8.5z"/>
              <path d="M5.5 12.5c1.6-1.6 3.9-2.6 6.5-2.6s4.9 1 6.5 2.6l-2.1 2.1c-1.1-1.1-2.7-1.7-4.4-1.7s-3.3.6-4.4 1.7L5.5 12.5z"/>
              <circle cx="12" cy="18" r="2"/>
            </svg>
            <svg className="w-6 h-3.5 text-white" viewBox="0 0 24 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35"/>
              <rect x="1" y="1" width="16" height="10" rx="3" fill="currentColor"/>
              <path d="M23 4v4a2 2 0 000-4z" fill="currentColor" fillOpacity="0.4"/>
            </svg>
          </div>
        </div>

        {/* Lock screen time area */}
        <div className="text-center py-4 flex-shrink-0">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1">Bildirimler</p>
        </div>

        {/* Notification cards */}
        <div className="flex-1 px-3 space-y-2 overflow-hidden">
          {PHONE_NOTIFICATIONS.map((notif) => (
            <motion.div
              key={notif.id}
              onClick={() => setActiveCard(activeCard === notif.id ? null : notif.id)}
              layout
              className={`rounded-2xl border px-3 py-2.5 cursor-pointer transition-all duration-300 ${notif.colorClass} ${
                activeCard === notif.id ? "bg-white/14" : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[15px] leading-none">{notif.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-white text-[10px] font-bold truncate">{notif.title}</span>
                    <span className="text-white/30 text-[9px] shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-white/75 text-[11px] leading-snug">{notif.body}</p>
                  <AnimatePresence>
                    {activeCard === notif.id && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-white/50 text-[10px] mt-1.5 leading-relaxed overflow-hidden"
                      >
                        {notif.expand}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Demo hint */}
        <div className="text-center py-3 flex-shrink-0">
          <p className="text-white/20 text-[9px] uppercase tracking-wider">
            {activeCard !== null ? "Tekrar tıkla kapatmak için" : "Bildirimlere tıkla"}
          </p>
        </div>

        {/* Home bar */}
        <div className="flex justify-center pb-3 flex-shrink-0">
          <div className="w-28 h-1 rounded-full bg-white/25" />
        </div>
      </div>

      {/* Floating badges around phone */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-12 -left-2 lg:-left-8 glass rounded-xl px-3 py-2 flex items-center gap-2 border border-brand-violet/20"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-violet to-brand-indigo flex items-center justify-center">
          <Users className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-medium text-white">+127 aktif ziyaretçi</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-16 -right-2 lg:-right-6 glass rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-brand-cyan/25"
      >
        <div className="w-7 h-7 rounded-full bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
          <FileCheck className="w-3.5 h-3.5 text-brand-cyan" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-white leading-tight">KOSGEB Raporu</p>
          <p className="text-[10px] text-brand-cyan">Otomatik PDF</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-dark">
      <ParticleCanvas />
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-32"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 px-4 py-1.5 text-sm bg-brand-indigo/15 border border-brand-indigo/30 text-brand-indigo-light">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan inline-block mr-2 animate-pulse" />
                Türkiye&apos;nin Fuar Yönetim Platformu
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight"
            >
              <span className="text-white">Fuarda Lead Topla.</span>
              <br />
              <span className="text-gradient-indigo">AI ile Eşleş.</span>
              <br />
              <span className="text-white">KOSGEB&apos;e Raporla.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg"
            >
              Organizatörler için{" "}
              <span className="text-white font-medium">tamamen ücretsiz</span> — ön kayıt verisi, ısı haritası ve AI raporu karşılığında.
              Firmalar:{" "}
              <span className="text-brand-cyan font-medium">KVKK onaylı lead, KOSGEB belgesi ve AI eşleşme</span> — 13.000 TL/ay.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Button asChild size="xl" variant="gradient" className="font-semibold shadow-xl shadow-indigo-500/20">
                <Link href="/register?role=organizer">
                  Fuarını Oluştur — Ücretsiz
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white/15 hover:border-white/25">
                <Link href="/register?role=exhibitor">
                  Firmalar için Kaydol
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2">
              <p className="text-xs text-muted-foreground">Uygulamayı indir:</p>
              <InstallBadges size="sm" />
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-4 pt-4 border-t border-white/8"
            >
              {STATS.map(({ value, suffix, label, icon: Icon }) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-brand-indigo-light" />
                    <span className="font-display text-2xl font-bold text-white">
                      <AnimatedCounter target={value} suffix={suffix} />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right column — interactive phone mockup */}
          <InteractivePhoneMockup />
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-muted-foreground">Daha fazla ↓</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-brand-indigo-light" />
        </motion.div>
      </motion.div>
    </section>
  );
}
