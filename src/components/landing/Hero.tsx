"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, QrCode, Zap, Users, TrendingUp, FileCheck } from "lucide-react";
import Link from "next/link";
import { InstallBadges } from "@/components/landing/AppInstallSection";

const STATS = [
  { value: 8500, suffix: "+", label: "Ziyaretçi", icon: Users },
  { value: 120, suffix: "+", label: "Katılımcı Firma", icon: Zap },
  { value: 14000, suffix: "+", label: "Lead Oluşturuldu", icon: TrendingUp },
];

const HEADLINE_WORDS = ["Akıllı", "Fuar", "Deneyimi", "Başlıyor"];

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

      // Draw connections
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

function FloatingQRCard() {
  return (
    <motion.div
      animate={{
        y: [0, -18, 0],
        rotate: [0, 1, -1, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative"
    >
      <div className="glass-strong rounded-2xl p-5 border-gradient w-56">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse-glow" />
          <span className="text-xs text-muted-foreground font-medium">Canlı QR Takip</span>
        </div>
        <div className="bg-white rounded-xl p-3 mb-3">
          <QrCode className="w-full h-24 text-brand-dark" strokeWidth={1.5} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Firma</span>
            <span className="text-xs font-semibold text-brand-indigo-light">TechVision A.Ş.</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Lead Sayısı</span>
            <span className="text-xs font-semibold text-brand-cyan">+47 bugün</span>
          </div>
        </div>
      </div>

      {/* Ping effects */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-brand-cyan/60"
      />
      <motion.div
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-brand-indigo/60"
      />
    </motion.div>
  );
}

function MatchCard() {
  return (
    <motion.div
      animate={{
        y: [0, 12, 0],
        rotate: [0, -0.5, 0.5, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1,
      }}
      className="glass rounded-xl p-4 w-48 border-gradient"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-brand-indigo/20 flex items-center justify-center">
          <Zap className="w-3 h-3 text-brand-indigo-light" />
        </div>
        <span className="text-xs font-medium">AI Eşleşme</span>
      </div>
      <div className="space-y-1.5">
        {["SaaS Yazılım", "Lojistik Tech", "FinTech"].map((tag, i) => (
          <div key={tag} className="flex items-center gap-2">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan"
              style={{ width: `${85 - i * 15}%` }}
            />
            <span className="text-xs text-muted-foreground">{85 - i * 15}%</span>
          </div>
        ))}
      </div>
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
      {/* Animated particle background */}
      <ParticleCanvas />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />

      {/* Grid overlay */}
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
          {/* Left column — content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 px-4 py-1.5 text-sm bg-brand-indigo/15 border border-brand-indigo/30 text-brand-indigo-light">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan inline-block mr-2 animate-pulse" />
                Türkiye&apos;nin Akıllı Fuar Platformu
              </Badge>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight"
            >
              <span className="text-white">Fuarı Kur.</span>
              <br />
              <span className="text-gradient-indigo">Ücretsiz.</span>
              <br />
              <span className="text-white">Firmalar Gelsin.</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-lg"
            >
              Organizatörler için tamamen ücretsiz — ön kayıt verisi, AI raporu ve ısı haritası karşılığında.
              Firmalar: <span className="text-brand-cyan font-medium">KOSGEB destekli katılımın ROI belgesini otomatik üret</span> — 13.000 TL/ay.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Button asChild size="xl" variant="gradient" className="font-semibold shadow-xl shadow-indigo-500/20">
                <Link href="/register?role=organizer">
                  Fuarını Kur — Ücretsiz
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white/15 hover:border-white/25">
                <Link href="#fair-game">
                  Fuarı Gez
                </Link>
              </Button>
            </motion.div>

            {/* App install badges */}
            <motion.div variants={itemVariants} className="space-y-2">
              <p className="text-xs text-muted-foreground">Uygulamayı indir:</p>
              <InstallBadges size="sm" />
            </motion.div>

            {/* Animated stats */}
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

          {/* Right column — floating visual cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative flex items-center justify-center h-96 lg:h-[520px]"
          >
            {/* Central glow */}
            <div className="absolute inset-0 bg-gradient-radial from-brand-indigo/20 via-transparent to-transparent rounded-full" />

            {/* QR card — center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <FloatingQRCard />
            </div>

            {/* AI match card — top right */}
            <div className="absolute top-8 right-0 lg:-right-4">
              <MatchCard />
            </div>

            {/* Lead notification — bottom left */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-12 left-0 lg:-left-4 glass rounded-xl px-4 py-3 flex items-center gap-3 border border-brand-cyan/20"
            >
              <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-brand-cyan" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Rozet Kazandı!</p>
                <p className="text-xs text-muted-foreground">+10 puan · Networker</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse flex-shrink-0" />
            </motion.div>

            {/* Visitor badge — top left */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-16 left-4 lg:left-0 glass rounded-lg px-3 py-2 flex items-center gap-2 border border-brand-violet/20"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-violet to-brand-indigo flex items-center justify-center">
                <Users className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium text-white">
                +127 ziyaretçi aktif
              </span>
            </motion.div>

            {/* KOSGEB badge — bottom right */}
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-4 right-0 lg:-right-2 glass rounded-xl px-4 py-3 flex items-center gap-3 border border-brand-cyan/25"
            >
              <div className="w-8 h-8 rounded-full bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-4 h-4 text-brand-cyan" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">KOSGEB Raporu</p>
                <p className="text-xs text-brand-cyan">Otomatik PDF</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-muted-foreground">Fuarı Gez ↓</span>
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
