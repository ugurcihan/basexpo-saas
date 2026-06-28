"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { QrCode } from "lucide-react";

const LINKS = {
  Ürün: [
    { label: "Organizatörler", href: "/register?role=organizer" },
    { label: "Katılımcı Firmalar", href: "/register?role=exhibitor" },
    { label: "Ziyaretçiler", href: "/register?role=visitor" },
  ],
  Şirket: [
    { label: "Hakkımızda", href: "#" },
    { label: "Blog", href: "#" },
    { label: "İletişim", href: "/contact" },
  ],
  Hukuki: [
    { label: "Gizlilik Politikası", href: "/privacy" },
    { label: "Kullanım Şartları", href: "/terms" },
    { label: "KVKK", href: "/kvkk" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-brand-darker">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {/* Brand column */}
          <motion.div
            initial={{ y: 20 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="col-span-2 md:col-span-1 space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-brand-indigo-light" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                BasExpo
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI destekli fuar platformu. Organizatörler için ücretsiz, firmalar için güçlü.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <span className="text-xs text-muted-foreground">Organizatöre ücretsiz · Firmaya ROI</span>
            </div>
          </motion.div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links], colIndex) => (
            <motion.div
              key={category}
              initial={{ y: 20 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (colIndex + 1) * 0.1 }}
              className="space-y-4"
            >
              <h4 className="text-sm font-semibold text-white">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BasExpo. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Next.js · Supabase · AI Matchmaking
          </p>
        </div>
      </div>
    </footer>
  );
}
