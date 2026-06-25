"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark to-brand-darker pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-indigo/15 blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-cyan/10 blur-[80px] pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ y: 40 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Icon */}
          <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 items-center justify-center">
            <Rocket className="w-7 h-7 text-brand-indigo-light" />
          </div>

          <h2 className="font-display text-4xl lg:text-6xl font-bold text-white leading-tight">
            Fuarını Bugün Kur —{" "}
            <span className="text-gradient-indigo">Organizatör Planı</span>
          </h2>

          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Organizatörler için sıfır maliyet — ön kayıt verisi ve AI raporu karşılığında platform.
            Firmalar: 13.000 TL/ay ile rakiplerinizden önce lead toplayın.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              asChild
              size="xl"
              variant="gradient"
              className="font-semibold shadow-2xl shadow-indigo-500/25 px-10"
            >
              <Link href="/register?role=organizer">
                Fuarını Kur — Hemen Başla
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="xl"
              variant="outline"
              className="border-white/15 hover:border-white/25"
            >
              <Link href="/register?role=exhibitor">
                Firma Olarak Başla — 13.000 TL/ay
              </Link>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            {[
              "Kredi kartı gerekmez",
              "5 dakikada kurulum",
              "Organizatör hesabı — kurulum 2 dk",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
