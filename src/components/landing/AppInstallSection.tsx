"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, CheckCircle2, Bell, Wifi, Zap, Shield } from "lucide-react";

// ─── BeforeInstallPrompt (Android Chrome) ───────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let deferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

type Platform = "ios" | "android" | "desktop" | "installed";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia("(display-mode: standalone)").matches) return "installed";
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

// ─── Resmi rozet bileşenleri ─────────────────────────────────────────────────

function AppleBadge({ onClick, size = "lg" }: { onClick: () => void; size?: "sm" | "lg" }) {
  const h = size === "sm" ? "h-10" : "h-14";
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-5 ${h} rounded-xl bg-black border border-white/20 hover:border-white/50 hover:bg-zinc-900 transition-all duration-200 active:scale-95`}
    >
      {/* Apple logo */}
      <svg viewBox="0 0 24 24" className={size === "sm" ? "w-5 h-5" : "w-7 h-7"} fill="white">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
      <div className="text-left">
        <p className={`text-white/60 leading-none ${size === "sm" ? "text-[9px]" : "text-[10px]"}`}>
          Download on the
        </p>
        <p className={`text-white font-semibold leading-tight mt-0.5 ${size === "sm" ? "text-xs" : "text-base"}`}>
          App Store
        </p>
      </div>
    </button>
  );
}

function PlayBadge({ onClick, installed, size = "lg" }: { onClick: () => void; installed: boolean; size?: "sm" | "lg" }) {
  const h = size === "sm" ? "h-10" : "h-14";
  return (
    <button
      onClick={onClick}
      disabled={installed}
      className={`group flex items-center gap-3 px-5 ${h} rounded-xl bg-black border border-white/20 hover:border-white/50 hover:bg-zinc-900 transition-all duration-200 active:scale-95 disabled:opacity-70`}
    >
      {installed ? (
        <CheckCircle2 className={`${size === "sm" ? "w-5 h-5" : "w-7 h-7"} text-green-400`} />
      ) : (
        /* Google Play triangle logo */
        <svg viewBox="0 0 24 24" className={size === "sm" ? "w-5 h-5" : "w-7 h-7"} fill="none">
          <path d="M3.18 23.76c.3.17.64.24.99.19l12.6-11.95L13.2 8.43 3.18 23.76z" fill="#EA4335" />
          <path d="M20.75 10.37 17.4 8.5l-3.73 3.5 3.73 3.5 3.38-1.9a1.78 1.78 0 0 0 0-3.23z" fill="#FBBC04" />
          <path d="M3.18.24A1.78 1.78 0 0 0 2.5 1.6v20.8c0 .56.25 1.05.68 1.36L13.2 12.5 3.18.24z" fill="#4285F4" />
          <path d="M3.18.24l10.02 12.26 3.57-3.07L3.18.24z" fill="#34A853" />
        </svg>
      )}
      <div className="text-left">
        <p className={`text-white/60 leading-none ${size === "sm" ? "text-[9px]" : "text-[10px]"}`}>
          {installed ? "Yüklendi!" : "Get it on"}
        </p>
        <p className={`text-white font-semibold leading-tight mt-0.5 ${size === "sm" ? "text-xs" : "text-base"}`}>
          {installed ? "Ana ekranı aç" : "Google Play"}
        </p>
      </div>
    </button>
  );
}

// ─── iOS rehber modalı ────────────────────────────────────────────────────────

function IOSModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26 }}
        className="relative glass-strong rounded-2xl border border-white/10 p-6 w-full max-w-sm z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <img src="/icons/icon-192x192.png" alt="BasExpo" className="w-12 h-12 rounded-2xl" />
          <div>
            <h3 className="font-display font-bold text-white">BasExpo&apos;yu Yükle</h3>
            <p className="text-xs text-muted-foreground">iPhone · iPad · App Store gerekmez</p>
          </div>
        </div>

        <div className="space-y-5">
          {[
            {
              step: 1,
              title: "Safari'de bu sayfayı aç",
              desc: "Chrome veya başka tarayıcı kullanıyorsan Safari'ye geç.",
              icon: <span className="text-lg">🧭</span>,
            },
            {
              step: 2,
              title: "Alt ortadaki Paylaş butonuna bas",
              desc: "Yukarı ok çıkan kare ikon.",
              icon: <Share className="w-5 h-5 text-blue-400" />,
            },
            {
              step: 3,
              title: '"Ana Ekrana Ekle" seç',
              desc: "Listede aşağı kaydırarak bul.",
              icon: <Plus className="w-5 h-5 text-white" />,
            },
            {
              step: 4,
              title: 'Sağ üstten "Ekle"ye bas',
              desc: "Uygulama simgesi ana ekrana eklenir.",
              icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
            },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-white/8 border border-white/12 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-sm text-white font-medium">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 pt-4 border-t border-white/8">
          iOS 16.4+ · Tamamen ücretsiz · Otomatik güncellenir
        </p>
      </motion.div>
    </div>
  );
}

// ─── Telefon mockup ────────────────────────────────────────────────────────────

const PHONE_NOTIFICATIONS = [
  {
    id: 0,
    emoji: "📅",
    title: "Etkinlik Hatırlatıcı",
    body: "Saat 15:00 · B Salonu — CEO Konuşması",
    detail: "Ana sahne konuşması 15 dakika içinde başlıyor. Salon B, 3. kat.",
    colorBg: "bg-brand-indigo/20",
    colorBorder: "border-brand-indigo/30",
    colorText: "text-brand-indigo-light",
  },
  {
    id: 1,
    emoji: "🤝",
    title: "AI Eşleşme Bulundu",
    body: "TechVision A.Ş. — Uyum Skoru: %94",
    detail: "Ortak hedef kitle ve ürün kategorisi. Standı: C-14. Toplantı ayarla?",
    colorBg: "bg-brand-cyan/20",
    colorBorder: "border-brand-cyan/30",
    colorText: "text-brand-cyan",
  },
  {
    id: 2,
    emoji: "🏆",
    title: "Rozet Kazandınız!",
    body: "Ağ Kurucusu · +50 puan eklendi",
    detail: "5 farklı stant ziyaret ettiniz. Toplam puan: 280. Bir sonraki ödül 20 puan uzakta.",
    colorBg: "bg-brand-violet/20",
    colorBorder: "border-brand-violet/30",
    colorText: "text-brand-violet-light",
  },
];

function PhoneMockup() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="relative mx-auto w-[240px]">
      {/* Glow */}
      <div className="absolute -inset-8 bg-brand-indigo/20 rounded-full blur-3xl" />
      {/* Phone frame */}
      <div
        className="relative rounded-[36px] bg-zinc-900 border-2 border-white/10 shadow-2xl overflow-hidden"
        style={{ aspectRatio: "9/19" }}
      >
        {/* Dynamic Island notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10 flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-zinc-700" />
          <div className="w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600" />
        </div>
        {/* Screen content */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E] to-[#060912] flex flex-col">
          {/* Status bar */}
          <div className="flex justify-between items-center px-5 pt-3 pb-1">
            <span className="text-[9px] text-white/50">9:41</span>
            <div className="flex gap-1 items-center">
              <Wifi className="w-2.5 h-2.5 text-white/50" />
              <div className="w-4 h-2 rounded-sm border border-white/40 relative">
                <div className="absolute left-0.5 top-0.5 bottom-0.5 w-2.5 bg-white/60 rounded-sm" />
              </div>
            </div>
          </div>

          {/* App header */}
          <div className="px-4 pt-7 pb-2 flex items-center gap-2">
            <img src="/icons/icon-192x192.png" alt="" className="w-6 h-6 rounded-lg" />
            <span className="text-white text-xs font-bold">BasExpo</span>
            <div className="ml-auto w-5 h-5 rounded-full bg-brand-indigo/20 flex items-center justify-center">
              <Bell className="w-3 h-3 text-brand-indigo-light" />
            </div>
          </div>

          {/* Notification cards */}
          <div className="px-3 space-y-2 flex-1 overflow-hidden">
            {PHONE_NOTIFICATIONS.map((n) => {
              const isOpen = expanded === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setExpanded(isOpen ? null : n.id)}
                  className={`w-full text-left rounded-xl ${n.colorBg} border ${n.colorBorder} px-3 py-2.5 transition-all duration-300`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm leading-none mt-0.5">{n.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] font-bold ${n.colorText} mb-0.5`}>{n.title}</p>
                      <p className="text-[9px] text-white/70 leading-tight">{n.body}</p>
                      {isOpen && (
                        <p className="text-[8px] text-white/50 leading-tight mt-1.5 border-t border-white/10 pt-1.5">
                          {n.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <div className="px-3 pb-2 pt-1">
            <p className="text-[7px] text-white/25 text-center">
              {expanded !== null ? "Tekrar tıkla kapatmak için" : "Bildirimlere tıkla"}
            </p>
          </div>

          {/* Home bar */}
          <div className="flex justify-center pb-2">
            <div className="w-16 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Küçük rozet grubu (Hero için export) ─────────────────────────────────────

export function InstallBadges({ size = "sm" }: { size?: "sm" | "lg" }) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [showIOS, setShowIOS] = useState(false);
  const [androidDone, setAndroidDone] = useState(false);
  const [promptReady, setPromptReady] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    if (deferredPrompt) setPromptReady(true);
    const h = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setPromptReady(true);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  async function onAndroid() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setAndroidDone(true); deferredPrompt = null; }
  }

  if (platform === "installed") return null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {/* iOS — always show */}
        <AppleBadge onClick={() => setShowIOS(true)} size={size} />
        {/* Android — always show */}
        <PlayBadge onClick={onAndroid} installed={androidDone} size={size} />
      </div>
      <AnimatePresence>{showIOS && <IOSModal onClose={() => setShowIOS(false)} />}</AnimatePresence>
    </>
  );
}

// ─── Ana bölüm ────────────────────────────────────────────────────────────────

export function AppInstallSection() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [showIOS, setShowIOS] = useState(false);
  const [androidDone, setAndroidDone] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    if (deferredPrompt) return;
    const h = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  async function onAndroid() {
    if (!deferredPrompt) {
      alert("Chrome menüsünden (⋮) 'Uygulamayı Yükle' seçeneğine bas.");
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setAndroidDone(true); deferredPrompt = null; }
  }

  if (platform === "installed") return null;

  return (
    <>
      <section className="relative py-24 overflow-hidden bg-brand-darker">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-darker to-brand-dark pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-indigo/5 via-transparent to-brand-violet/5 pointer-events-none" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Sol: metin + rozetler */}
            <motion.div
              initial={{ y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Tag */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo/12 border border-brand-indigo/25 text-brand-indigo-light text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
                Ücretsiz · App Store Gerekmez
              </div>

              <div className="space-y-4">
                <h2 className="font-display text-4xl lg:text-5xl font-bold text-white leading-tight">
                  Cebinde olsun,{" "}
                  <span className="bg-gradient-to-r from-brand-indigo-light to-brand-cyan bg-clip-text text-transparent">
                    her an hazır
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                  Anlık bildirimler, fuar QR rozeti ve AI eşleşmeleri — tüm bunlar doğrudan
                  ana ekranında. İndirmesi 10 saniye, güncelleme otomatik.
                </p>
              </div>

              {/* Özellikler */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Bell, label: "Anlık Bildirimler", desc: "CEO konuşması, stant haberleri" },
                  { icon: Shield, label: "QR Badge", desc: "Tek dokunuşla kimliğini göster" },
                  { icon: Zap, label: "AI Eşleşme", desc: "Sana uygun firmaları bul" },
                  { icon: Wifi, label: "Çevrimdışı Çalışır", desc: "İnternet kesilse devam eder" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex gap-3 items-start p-3 rounded-xl bg-white/3 border border-white/6">
                    <div className="w-8 h-8 rounded-lg bg-brand-indigo/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-brand-indigo-light" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rozetler */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Telefonuna İndir
                </p>
                <div className="flex flex-wrap gap-3">
                  <AppleBadge onClick={() => setShowIOS(true)} size="lg" />
                  <PlayBadge onClick={onAndroid} installed={androidDone} size="lg" />
                </div>
                <p className="text-xs text-muted-foreground">
                  iOS 16.4+ · Android 8+ · Her iki platformda da ücretsiz
                </p>
              </div>
            </motion.div>

            {/* Sağ: telefon mockup */}
            <motion.div
              initial={{ y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex justify-center lg:justify-end"
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </div>
      </section>

      <AnimatePresence>{showIOS && <IOSModal onClose={() => setShowIOS(false)} />}</AnimatePresence>
    </>
  );
}
