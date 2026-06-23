"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Package,
  QrCode,
  Users,
  TrendingUp,
  Settings,
  Download,
  Copy,
  Check,
  Smartphone,
  MessageSquare,
  Brain,
  CalendarClock,
  Store,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Panel",            href: "/exhibitor",                icon: LayoutDashboard },
  { label: "Marka Profili",    href: "/exhibitor/profile",        icon: Building2 },
  { label: "QR Yarat",         href: "/exhibitor/qr",             icon: QrCode },
  { label: "Ürünlerim",        href: "/exhibitor/products",       icon: Package },
  { label: "Ziyaretçilerim",   href: "/exhibitor/leads",          icon: Users },
  { label: "Mesajlar",         href: "/exhibitor/messages",       icon: MessageSquare },
  { label: "Analiz AI",        href: "/exhibitor/analytics",      icon: Brain },
  { label: "Yaklaşan Fuarlar", href: "/exhibitor/upcoming-fairs", icon: CalendarClock },
  { label: "Fuar Standlarım",  href: "/exhibitor/my-booths",      icon: Store },
  { label: "Randevu Talepleri", href: "/exhibitor/meeting-requests", icon: CalendarClock },
  { label: "ROI Raporu",          href: "/exhibitor/roi-report",         icon: TrendingUp },
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

interface ExhibitorForQR {
  id: string;
  company_name: string;
  qr_token: string;
  event: { name: string; location: string };
}

export function QRClient({ exhibitor }: { exhibitor: ExhibitorForQR }) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const scanUrl = `${mounted ? window.location.origin : ""}/scan/${exhibitor.qr_token}`;

  function handleCopy() {
    navigator.clipboard.writeText(scanUrl).then(() => {
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
      link.download = `${exhibitor.company_name}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }

  return (
    <DashboardShell role="exhibitor" userName="" navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 max-w-xl space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">QR Kodum</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {exhibitor.event.name} · {exhibitor.event.location}
          </p>
        </motion.div>

        {/* QR card */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/8 p-8 flex flex-col items-center"
        >
          {/* QR code — client-only to prevent SSR hydration mismatch */}
          <div
            ref={qrRef}
            className="p-5 bg-white rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.25)] mb-6"
          >
            {mounted ? (
              <QRCodeSVG
                value={scanUrl}
                size={220}
                level="H"
                includeMargin={false}
                fgColor="#0A0F1E"
                bgColor="#FFFFFF"
              />
            ) : (
              <div className="w-[220px] h-[220px] bg-gray-100 rounded-lg animate-pulse" />
            )}
          </div>

          {/* Company name */}
          <h2 className="font-display text-xl font-bold text-white mb-1">
            {exhibitor.company_name}
          </h2>
          <p className="text-muted-foreground text-sm mb-6 text-center">
            Ziyaretçiler bu kodu tarayarak profiline ulaşır ve lead oluşturur.
          </p>

          {/* Token */}
          <div className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-2">
            <code className="text-xs text-muted-foreground font-mono break-all">
              {exhibitor.qr_token}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/8 transition-colors flex-shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button variant="gradient" className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4" /> PNG İndir
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Kopyalandı!" : "URL Kopyala"}
            </Button>
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-brand-indigo/8 border border-brand-indigo/15"
        >
          <Smartphone className="w-4 h-4 text-brand-indigo-light flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            QR kodunu bas, stand levhasına yapıştır. Ziyaretçi telefonu ile tararsa Faz 4&apos;te
            otomatik lead oluşacak.
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
