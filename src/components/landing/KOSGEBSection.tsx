"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, QrCode, HandshakeIcon, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STEPS = [
  {
    icon: QrCode,
    number: "01",
    title: "Fuara Katıl — QR ile Lead Topla",
    description: "Standınızdaki QR kod her ziyaretçiyi KVKK onaylı olarak kayıt altına alır. Kağıt form yok, veri kaybı yok.",
    color: "brand-indigo",
  },
  {
    icon: HandshakeIcon,
    number: "02",
    title: "Toplantı Yap — Dönüşümleri Gir",
    description: "Gerçekleşen görüşmeleri ve potansiyel satış değerlerini BasExpo'ya kaydedin. Sistematik takip, sıfır efor.",
    color: "brand-violet",
  },
  {
    icon: FileCheck,
    number: "03",
    title: "Tek Tıkla PDF — Yöneticine Sun",
    description: "Lead sayısı, görüşme adedi, tahmini iş değeri ve ROI hesabı — hepsi düzenli formatta PDF olarak hazır.",
    color: "brand-cyan",
  },
];

function formatTL(val: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(val);
}

function ROICalculator() {
  const [cost, setCost] = useState(80000);
  const [avgDeal, setAvgDeal] = useState(150000);

  const leads = Math.round(cost / 2000);
  const estimatedWon = Math.max(1, Math.round(leads * 0.05));
  const revenue = estimatedWon * avgDeal;
  const roiPct = Math.round(((revenue - cost) / cost) * 100);

  return (
    <motion.div
      initial={{ y: 30 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="glass-strong rounded-2xl border border-brand-cyan/20 p-8 lg:p-10 space-y-8"
    >
      <div className="text-center">
        <h3 className="font-display text-xl font-bold text-white mb-1">ROI Hesaplayıcı</h3>
        <p className="text-sm text-muted-foreground">Fuarınızın tahmini getirisini görün</p>
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground">Fuar Katılım Maliyeti</label>
            <span className="text-sm font-bold text-white">{formatTL(cost)}</span>
          </div>
          <input
            type="range"
            min={10000}
            max={500000}
            step={5000}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-white/10 accent-brand-cyan cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground/60">
            <span>10.000 TL</span><span>500.000 TL</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground">Ortalama Satış Değeri</label>
            <span className="text-sm font-bold text-white">{formatTL(avgDeal)}</span>
          </div>
          <input
            type="range"
            min={50000}
            max={1000000}
            step={25000}
            value={avgDeal}
            onChange={(e) => setAvgDeal(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none bg-white/10 accent-brand-cyan cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground/60">
            <span>50.000 TL</span><span>1.000.000 TL</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 border border-white/8">
          <p className="text-xs text-muted-foreground mb-1">Tahmini Lead</p>
          <p className="font-display text-2xl font-bold text-white">{leads}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/8">
          <p className="text-xs text-muted-foreground mb-1">Tahmini Kapanış</p>
          <p className="font-display text-2xl font-bold text-white">{estimatedWon}</p>
        </div>
        <div className="glass rounded-xl p-4 border border-white/8">
          <p className="text-xs text-muted-foreground mb-1">Tahmini Gelir</p>
          <p className="font-display text-lg font-bold text-brand-cyan">{formatTL(revenue)}</p>
        </div>
        <div
          className={`glass rounded-xl p-4 border ${roiPct > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/8"}`}
        >
          <p className="text-xs text-muted-foreground mb-1">ROI</p>
          <p className={`font-display text-2xl font-bold ${roiPct > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {roiPct > 0 ? "+" : ""}{roiPct}%
          </p>
        </div>
      </div>

      <div className="text-center space-y-3">
        <p className="text-xs text-muted-foreground/70">
          Türkiye B2B fuar sektörü ortalamalarına dayalı tahmin. Sektörünüze göre değişiklik gösterebilir.
        </p>
        <Button asChild variant="gradient" size="lg" className="w-full">
          <Link href="/register?role=exhibitor">
            Hemen Başla — ROI&apos;ını Ölç
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export function KOSGEBSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-cyan/3 to-brand-dark pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ y: 30 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/25 text-sm text-brand-cyan mb-4">
            <FileCheck className="w-3.5 h-3.5" />
            Fuar ROI Belgelendirme
          </div>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
            Fuarın Getirisini{" "}
            <span className="text-gradient-cyan">Belgele</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fuar bittikten sonra gelen soruya veriyle cevap ver: &ldquo;Bu fuardan ne kazandık?&rdquo;
            <br />
            <strong className="text-white">Platform bunu otomatik hesaplar ve özetler.</strong>
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — 3 steps */}
          <div className="space-y-8">
            {/* Key insight box */}
            <motion.div
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass rounded-xl border border-brand-cyan/20 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-brand-cyan" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Fuar Bitti — Asıl Soru Şimdi Geliyor</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Fuar bittiğinde yönetici sorar: &ldquo;Bu fuardan ne kazandık?&rdquo;
                    <span className="text-brand-cyan font-medium"> Lead sayısı, görüşme adedi ve tahmini iş değeri tek ekranda — platforma sormak yeterli.</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Steps */}
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.number}
                    initial={{ y: 24 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.6, delay: i * 0.12 }}
                    className="glass rounded-xl border border-white/8 p-5 flex items-start gap-5 group hover:border-brand-cyan/20 transition-colors"
                  >
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-xl bg-${step.color}/15 border border-${step.color}/30 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${step.color === "brand-indigo" ? "brand-indigo-light" : step.color === "brand-violet" ? "brand-violet-light" : "brand-cyan"}`} />
                      </div>
                      <span className={`text-xs font-mono font-bold text-${step.color === "brand-indigo" ? "brand-indigo-light" : step.color === "brand-violet" ? "brand-violet-light" : "brand-cyan"}/50`}>
                        {step.number}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm mb-1">{step.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ y: 16 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { value: "KVKK", label: "Onaylı Lead" },
                { value: "1-Tık", label: "PDF Üret" },
                { value: "%0", label: "Manuel İş" },
              ].map(({ value, label }) => (
                <div key={label} className="glass rounded-xl p-4 border border-white/8 text-center">
                  <p className="font-display text-xl font-bold text-brand-cyan mb-0.5">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — interactive ROI calculator */}
          <ROICalculator />
        </div>
      </div>
    </section>
  );
}
