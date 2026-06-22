"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Sparkles,
  QrCode,
  Heart,
  Users,
  CalendarClock,
  Settings,
  Download,
  Copy,
  Check,
  Info,
  CalendarDays,
  Ticket,
} from "lucide-react";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "QR Badge'im",      href: "/visitor/badge",             icon: QrCode },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

export function BadgeClient({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const badgeUrl = `${mounted ? window.location.origin : ""}/visitor-profile/${profile.id}`;

  function handleCopy() {
    navigator.clipboard.writeText(badgeUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    const svgBlob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = `${profile.full_name || "visitor"}-badge.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }

  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 max-w-md space-y-6">
        <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">QR Badge&apos;im</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Firma temsilcilerine göster, bağlantı kur
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/8 p-8 flex flex-col items-center"
        >
          {/* QR — only rendered client-side to avoid SSR/hydration mismatch */}
          <div
            ref={qrRef}
            className="p-5 bg-white rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.25)] mb-6"
          >
            {mounted ? (
              <QRCodeSVG
                value={badgeUrl}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#0A0F1E"
                bgColor="#FFFFFF"
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-gray-100 rounded-lg animate-pulse" />
            )}
          </div>

          {/* Identity */}
          <h2 className="font-display text-xl font-bold text-white mb-0.5">
            {profile.full_name || "İsimsiz Ziyaretçi"}
          </h2>
          <p className="text-sm text-muted-foreground mb-1">{profile.email}</p>

          {profile.interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {profile.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest}
                  className="px-2 py-0.5 rounded-full text-xs bg-brand-violet/15 border border-brand-violet/20 text-brand-violet-light"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 w-full mb-4">
            <Button variant="gradient" className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4" /> PNG İndir
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Kopyalandı!" : "Paylaş"}
            </Button>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-brand-violet/8 border border-brand-violet/15"
        >
          <Info className="w-4 h-4 text-brand-violet-light flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Badge&apos;ini fuarda firma standlarında göster. Firma temsilcisi bu kodu tarayarak
            seninle bağlantı kurabilir. (Faz 6&apos;da aktif olacak)
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
