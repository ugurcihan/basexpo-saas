"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, MoreVertical, Download, CheckCircle2 } from "lucide-react";

// Intercept beforeinstallprompt as early as possible (module level)
let deferredPrompt: BeforeInstallPromptEvent | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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

function IOSGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative glass-strong rounded-2xl border border-white/10 p-6 w-full max-w-sm z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-brand-indigo/20 flex items-center justify-center text-2xl">
            <img src="/icons/icon-192x192.png" alt="BasExpo" className="w-10 h-10 rounded-xl" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white">BasExpo'yu Yükle</h3>
            <p className="text-xs text-muted-foreground">iPhone & iPad</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-brand-indigo/20 border border-brand-indigo/40 flex items-center justify-center flex-shrink-0 text-brand-indigo-light font-bold text-sm">1</div>
            <div>
              <p className="text-sm text-white font-medium">Paylaş butonuna bas</p>
              <p className="text-xs text-muted-foreground mt-0.5">Safari alt çubuğundaki kare ↑ ikonu</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
                <Share className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white">Paylaş</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 ml-4" />

          {/* Step 2 */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-brand-indigo/20 border border-brand-indigo/40 flex items-center justify-center flex-shrink-0 text-brand-indigo-light font-bold text-sm">2</div>
            <div>
              <p className="text-sm text-white font-medium">Ana Ekrana Ekle'ye bas</p>
              <p className="text-xs text-muted-foreground mt-0.5">Listede aşağı kaydır</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
                <Plus className="w-4 h-4 text-white" />
                <span className="text-xs text-white">Ana Ekrana Ekle</span>
              </div>
            </div>
          </div>

          <div className="w-px h-4 bg-white/10 ml-4" />

          {/* Step 3 */}
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Sağ üstten "Ekle"ye bas</p>
              <p className="text-xs text-muted-foreground mt-0.5">Uygulama ana ekranına eklenir ✓</p>
            </div>
          </div>
        </div>

        {/* Arrow pointing down to Safari bar */}
        <div className="mt-5 pt-4 border-t border-white/8 text-center">
          <p className="text-xs text-muted-foreground">Safari'de bu sayfayı açtığından emin ol</p>
        </div>
      </motion.div>
    </div>
  );
}

export function AppInstallSection() {
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [androidInstalled, setAndroidInstalled] = useState(false);
  const [promptReady, setPromptReady] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    // Check if deferred prompt already captured
    if (deferredPrompt) setPromptReady(true);

    // Also listen in case it fires after mount
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setPromptReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleAndroidInstall() {
    if (!deferredPrompt) {
      // Fallback: show manual instructions
      alert("Chrome adres çubuğundaki '⋮' menüsünden 'Uygulamayı Yükle' seçeneğine bas.");
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setAndroidInstalled(true);
      deferredPrompt = null;
    }
  }

  // Don't show if already installed
  if (platform === "installed") return null;

  return (
    <>
      <section className="relative py-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-indigo/4 to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-indigo/15 border border-brand-indigo/30 text-brand-indigo-light text-xs font-medium mb-5">
              <Download className="w-3.5 h-3.5" />
              Uygulamayı İndir — Ücretsiz
            </span>

            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Cebinde olsun,{" "}
              <span className="bg-gradient-to-r from-brand-indigo-light to-brand-cyan bg-clip-text text-transparent">
                her an hazır
              </span>
            </h2>
            <p className="text-muted-foreground text-base max-w-lg mx-auto mb-10">
              Anlık bildirimler, hızlı QR okuma ve çevrimdışı erişim. App Store gerekmez.
            </p>

            {/* Install buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* iOS button */}
              <button
                onClick={() => setShowIOSGuide(true)}
                className="group flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white/6 border border-white/12 hover:bg-white/10 hover:border-white/20 transition-all duration-200 min-w-[200px]"
              >
                {/* Apple logo SVG */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white flex-shrink-0" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <p className="text-[10px] text-white/60 leading-none">İndir</p>
                  <p className="text-sm font-semibold text-white leading-tight mt-0.5">iPhone / iPad</p>
                </div>
              </button>

              {/* Android button */}
              <button
                onClick={handleAndroidInstall}
                disabled={androidInstalled}
                className="group flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white/6 border border-white/12 hover:bg-white/10 hover:border-white/20 transition-all duration-200 min-w-[200px] disabled:opacity-60"
              >
                {androidInstalled ? (
                  <CheckCircle2 className="w-7 h-7 text-green-400 flex-shrink-0" />
                ) : (
                  /* Google Play logo SVG */
                  <svg viewBox="0 0 24 24" className="w-7 h-7 flex-shrink-0" fill="none">
                    <path d="M3.18 23.76c.3.17.64.24.99.19l12.6-11.95L13.2 8.43 3.18 23.76z" fill="#EA4335"/>
                    <path d="M20.75 10.37 17.4 8.5l-3.73 3.5 3.73 3.5 3.38-1.9a1.78 1.78 0 0 0 0-3.23z" fill="#FBBC04"/>
                    <path d="M3.18.24A1.78 1.78 0 0 0 2.5 1.6v20.8c0 .56.25 1.05.68 1.36L13.2 12.5 3.18.24z" fill="#4285F4"/>
                    <path d="M3.18.24l10.02 12.26 3.57-3.07L3.18.24z" fill="#34A853"/>
                  </svg>
                )}
                <div className="text-left">
                  <p className="text-[10px] text-white/60 leading-none">
                    {androidInstalled ? "Yüklendi!" : "İndir"}
                  </p>
                  <p className="text-sm font-semibold text-white leading-tight mt-0.5">
                    {androidInstalled ? "Ana ekranı kontrol et" : "Android"}
                  </p>
                </div>
              </button>
            </div>

            {/* Features */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mt-8">
              {["Anlık Bildirimler", "QR Tarama", "Çevrimdışı Çalışır", "Otomatik Güncelleme"].map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* iOS guide modal */}
      <AnimatePresence>
        {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
      </AnimatePresence>
    </>
  );
}
