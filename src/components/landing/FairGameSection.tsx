"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Network,
  Zap,
  QrCode,
} from "lucide-react";

const COLS = 9;
const ROWS = 7;

// ─── Booth tanımları (9 firma) ───────────────────────────────────────────────
interface Booth {
  id: string;
  name: string;
  short: string;
  sector: string;
  matchScore: number;
  description: string;
  color: "indigo" | "cyan" | "violet" | "gold";
  row: number;
  col: number;
}

// ─── Özel bölge tanımları (3 merkez alan) ───────────────────────────────────
interface SpecialZone {
  id: string;
  icon: string;
  name: string;
  description: string;
  realFeature: string;
  points: number;
  row: number;
  col: number;
}

const BOOTHS: Booth[] = [
  // Üst sıra (row 0)
  { id: "tech", name: "TechVision A.Ş.", short: "TechV", sector: "Yazılım & SaaS", matchScore: 94, description: "Kurumsal dijital dönüşüm ve bulut çözümleri", color: "indigo", row: 0, col: 0 },
  { id: "logi", name: "LogiPro Lojistik", short: "LogiP", sector: "Lojistik & Tedarik", matchScore: 87, description: "Akıllı lojistik ve tedarik zinciri yönetimi", color: "cyan", row: 0, col: 2 },
  { id: "fin", name: "FinTech Çözümleri", short: "FinTe", sector: "Finans & Ödeme", matchScore: 82, description: "Kurumsal ödeme altyapısı ve finansal analitik", color: "violet", row: 0, col: 4 },
  { id: "agro", name: "AgroTech Tarım", short: "AgroT", sector: "Tarım Teknolojisi", matchScore: 76, description: "IoT tabanlı akıllı tarım yönetim sistemleri", color: "gold", row: 0, col: 6 },
  // Orta sıra — yan stantlar (row 3)
  { id: "med", name: "MedSystem Sağlık", short: "MedSy", sector: "Sağlık Teknolojisi", matchScore: 91, description: "Hastane bilgi sistemleri ve telemedicine çözümleri", color: "cyan", row: 3, col: 0 },
  { id: "edu", name: "EduSoft Eğitim", short: "EduSo", sector: "Eğitim Teknolojisi", matchScore: 85, description: "Online eğitim platformu ve içerik yönetim sistemi", color: "indigo", row: 3, col: 8 },
  // Alt sıra (row 6)
  { id: "retail", name: "RetailX Perakende", short: "RetaX", sector: "Perakende & E-Ticaret", matchScore: 79, description: "Omnichannel perakende ve müşteri deneyimi yönetimi", color: "violet", row: 6, col: 0 },
  { id: "clean", name: "CleanEnergy Enerji", short: "ClnEn", sector: "Yenilenebilir Enerji", matchScore: 88, description: "Güneş ve rüzgar enerji sistemleri entegrasyonu", color: "gold", row: 6, col: 4 },
  { id: "prop", name: "PropTech Gayrimenkul", short: "PropT", sector: "Gayrimenkul Tech", matchScore: 73, description: "Dijital gayrimenkul yönetimi ve değerleme platformu", color: "cyan", row: 6, col: 8 },
];

const SPECIALS: SpecialZone[] = [
  {
    id: "network",
    icon: "🌐",
    name: "Networking Köşesi",
    description: "Diğer ziyaretçilerle bağlantı kur, toplantı ayarla. Fuarın en canlı noktası.",
    realFeature: "Gerçek platformda AI önerileriyle 1-1 bağlantı isteği gönderebilir ve toplantı planlayabilirsin.",
    points: 15,
    row: 3,
    col: 2,
  },
  {
    id: "sponsor",
    icon: "⭐",
    name: "Platin Sponsor Alanı",
    description: "Fuarın ana sponsorlarından özel teklifler ve demo gösterimleri.",
    realFeature: "Platin/Altın/Gümüş sponsor firmalara özel görünürlük alanı. Fuarın en stratejik noktası.",
    points: 20,
    row: 3,
    col: 4,
  },
  {
    id: "goldenqr",
    icon: "🏅",
    name: "Altın QR Noktası",
    description: "Fuardaki gizli çekiliş noktası! Tara, büyük ödül kazanmak için yarış.",
    realFeature: "Köşe stantlarına yerleştirilen Altın QR kodlar çekilişe katılır. 1 kazanan büyük ödülü alır.",
    points: 25,
    row: 3,
    col: 6,
  },
];

// ─── Pozisyon setleri ─────────────────────────────────────────────────────────
const BOOTH_MAP = new Map(BOOTHS.map((b) => [`${b.row},${b.col}`, b]));
const SPECIAL_MAP = new Map(SPECIALS.map((s) => [`${s.row},${s.col}`, s]));

function isWalkable(r: number, c: number) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

// ─── Renk sistemi ────────────────────────────────────────────────────────────
const C = {
  indigo: {
    bg: "bg-brand-indigo/20",
    bgV: "bg-brand-indigo/45",
    border: "border-brand-indigo/40",
    borderV: "border-brand-indigo/70",
    text: "text-brand-indigo-light",
    badge: "bg-brand-indigo/15 text-brand-indigo-light border-brand-indigo/25",
    dot: "bg-brand-indigo-light",
  },
  cyan: {
    bg: "bg-brand-cyan/20",
    bgV: "bg-brand-cyan/45",
    border: "border-brand-cyan/40",
    borderV: "border-brand-cyan/70",
    text: "text-brand-cyan",
    badge: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25",
    dot: "bg-brand-cyan",
  },
  violet: {
    bg: "bg-brand-violet/20",
    bgV: "bg-brand-violet/45",
    border: "border-brand-violet/40",
    borderV: "border-brand-violet/70",
    text: "text-brand-violet-light",
    badge: "bg-brand-violet/15 text-brand-violet-light border-brand-violet/25",
    dot: "bg-brand-violet-light",
  },
  gold: {
    bg: "bg-brand-gold/20",
    bgV: "bg-brand-gold/45",
    border: "border-brand-gold/40",
    borderV: "border-brand-gold/70",
    text: "text-brand-gold",
    badge: "bg-brand-gold/15 text-brand-gold border-brand-gold/25",
    dot: "bg-brand-gold",
  },
};

// ─── Rozet eşikleri ───────────────────────────────────────────────────────────
const BADGES = [
  { count: 3,  icon: "🤝", name: "Networker",       desc: "3 ziyaret",  pts: 30 },
  { count: 6,  icon: "🗺️", name: "Fuar Gezgini",    desc: "6 ziyaret",  pts: 60 },
  { count: 9,  icon: "🏆", name: "Fuar Şampiyonu",  desc: "9 stant",    pts: 90 },
  { count: 12, icon: "🌟", name: "Efsane Ziyaretçi",desc: "Tümü keşfet",pts: 135 },
];

export function FairGameSection() {
  const [pos, setPos] = useState({ r: 2, c: 4 });
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [points, setPoints] = useState(0);
  const [popup, setPopup] = useState<{ type: "booth"; data: Booth } | { type: "special"; data: SpecialZone } | null>(null);
  const [flashBadge, setFlashBadge] = useState<(typeof BADGES)[0] | null>(null);
  const [lastBadgeAt, setLastBadgeAt] = useState(0);
  const [focused, setFocused] = useState(false);
  const [flashCell, setFlashCell] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (dr: number, dc: number) => {
      setPos((prev) => {
        const nr = prev.r + dr;
        const nc = prev.c + dc;
        if (!isWalkable(nr, nc)) return prev;

        const key = `${nr},${nc}`;
        const booth = BOOTH_MAP.get(key);
        const special = SPECIAL_MAP.get(key);
        const isNew = !visited.has(key);

        if ((booth || special) && isNew) {
          const pts = booth ? 10 : (special?.points ?? 15);
          setVisited((v) => {
            const next = new Set(v);
            next.add(key);
            const count = next.size;
            setPoints((p) => p + pts);

            // Flash cell
            setFlashCell(key);
            setTimeout(() => setFlashCell(null), 600);

            // Popup
            if (booth) setPopup({ type: "booth", data: booth });
            if (special) setPopup({ type: "special", data: special });

            // Badge check
            const badge = BADGES.slice().reverse().find((b) => b.count <= count);
            if (badge && badge.count > lastBadgeAt) {
              setLastBadgeAt(badge.count);
              setTimeout(() => {
                setFlashBadge(badge);
                setTimeout(() => setFlashBadge(null), 3000);
              }, 800);
            }

            return next;
          });
        } else if (booth && visited.has(key)) {
          setPopup({ type: "booth", data: booth });
        } else if (special && visited.has(key)) {
          setPopup({ type: "special", data: special });
        }

        return { r: nr, c: nc };
      });
    },
    [visited, lastBadgeAt]
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!focused) return;
      const map: Record<string, [number, number]> = {
        ArrowUp: [-1, 0], w: [-1, 0], W: [-1, 0],
        ArrowDown: [1, 0], s: [1, 0], S: [1, 0],
        ArrowLeft: [0, -1], a: [0, -1], A: [0, -1],
        ArrowRight: [0, 1], d: [0, 1], D: [0, 1],
      };
      const d = map[e.key];
      if (d) { e.preventDefault(); move(d[0], d[1]); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [move, focused]);

  const visitedCount = visited.size;
  const allDone = visitedCount >= 12;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <section id="fair-game" className="py-24 lg:py-32 relative overflow-hidden bg-brand-darker">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-indigo/6 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 lg:px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
            Demo Fuar Alanı
          </div>
          <h2 className="font-display text-3xl lg:text-5xl font-bold text-white mb-3">
            Fuarı Şimdiden{" "}
            <span className="text-gradient-indigo">Keşfet</span>
          </h2>
          <p className="text-base lg:text-lg text-muted-foreground max-w-xl mx-auto">
            Stantları gez, rozet kazan. Merkezdeki özel alanlarda sürprizler var!
            <span className="hidden lg:inline"> (WASD veya ↑↓←→)</span>
          </p>
        </motion.div>

        {/* Main layout */}
        <div className="flex flex-col xl:flex-row gap-6 items-start justify-center">

          {/* ─── Oyun Alanı ─────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full xl:flex-1 max-w-2xl mx-auto xl:mx-0"
          >
            {/* Scoreboard */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="glass px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="text-sm font-bold text-white">{points}p</span>
                </div>
                <div className="glass px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-brand-cyan" />
                  <span className="text-sm font-bold text-white">{visitedCount}/12</span>
                </div>
              </div>
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-xs font-bold text-brand-gold"
                >
                  🌟 Efsane Ziyaretçi!
                </motion.div>
              )}
            </div>

            {/* Board */}
            <div
              ref={boardRef}
              tabIndex={0}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onClick={() => { boardRef.current?.focus(); setFocused(true); }}
              className={`relative rounded-2xl border p-2.5 outline-none transition-all duration-300 cursor-pointer select-none ${
                focused
                  ? "border-brand-indigo/40 shadow-lg shadow-brand-indigo/10 bg-[#07091a]"
                  : "border-white/8 bg-[#06081a]/80 hover:border-white/14"
              }`}
            >
              {/* Click-to-focus overlay */}
              <AnimatePresence>
                {!focused && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-20 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(6,9,26,0.72)", backdropFilter: "blur(2px)" }}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-2xl bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">🏃</span>
                      </div>
                      <p className="text-base font-semibold text-white">Tıkla ve Oyna</p>
                      <p className="text-sm text-muted-foreground mt-1 hidden lg:block">
                        WASD veya ok tuşları ile gez
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Grid */}
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: ROWS }).map((_, r) =>
                  Array.from({ length: COLS }).map((_, c) => {
                    const key = `${r},${c}`;
                    const booth = BOOTH_MAP.get(key);
                    const special = SPECIAL_MAP.get(key);
                    const isPlayer = pos.r === r && pos.c === c;
                    const isVisited = visited.has(key);
                    const isFlashing = flashCell === key;

                    /* BOOTH CELL */
                    if (booth) {
                      const col = C[booth.color];
                      return (
                        <motion.div
                          key={key}
                          animate={isFlashing ? { scale: [1, 1.12, 1] } : {}}
                          transition={{ duration: 0.5 }}
                          className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
                            isVisited
                              ? `${col.bgV} ${col.borderV}`
                              : `${col.bg} ${col.border}`
                          } ${isPlayer ? "ring-2 ring-white/70 ring-offset-[1.5px] ring-offset-[#07091a]" : ""}`}
                        >
                          {isPlayer ? (
                            <span className="text-base leading-none z-10">🏃</span>
                          ) : (
                            <>
                              <span className={`text-[9px] lg:text-[10px] font-bold leading-tight text-center px-0.5 ${isVisited ? "text-white" : "text-white/70"}`}>
                                {booth.short}
                              </span>
                              {isVisited && (
                                <span className="text-[8px] text-white/60 mt-0.5">✓</span>
                              )}
                            </>
                          )}
                          {/* Visited shimmer */}
                          {isVisited && !isPlayer && (
                            <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                          )}
                        </motion.div>
                      );
                    }

                    /* SPECIAL CELL */
                    if (special) {
                      return (
                        <motion.div
                          key={key}
                          animate={isFlashing ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.5 }}
                          className={`aspect-square rounded-lg border flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                            isVisited
                              ? "bg-brand-gold/30 border-brand-gold/60"
                              : "bg-brand-gold/10 border-brand-gold/30"
                          } ${isPlayer ? "ring-2 ring-white/70 ring-offset-[1.5px] ring-offset-[#07091a]" : ""}`}
                        >
                          {isPlayer ? (
                            <span className="text-base leading-none">🏃</span>
                          ) : (
                            <span className={`text-sm lg:text-base leading-none transition-all ${isVisited ? "" : "opacity-60"}`}>
                              {special.icon}
                            </span>
                          )}
                          {/* Gold pulse ring for unvisited specials */}
                          {!isVisited && !isPlayer && (
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute inset-0 rounded-lg border border-brand-gold/50"
                            />
                          )}
                        </motion.div>
                      );
                    }

                    /* CORRIDOR CELL */
                    return (
                      <div
                        key={key}
                        className={`aspect-square rounded-md transition-all duration-100 ${
                          isPlayer
                            ? "bg-brand-indigo/15 ring-2 ring-brand-indigo/50 ring-offset-[1px] ring-offset-[#07091a]"
                            : "bg-white/[0.018] hover:bg-white/[0.035]"
                        }`}
                      >
                        {isPlayer && (
                          <div className="w-full h-full flex items-center justify-center">
                            <motion.span
                              animate={{ y: [0, -2, 0] }}
                              transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                              className="text-base leading-none"
                            >
                              🏃
                            </motion.span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Legend row */}
              <div className="flex items-center justify-center gap-4 mt-2.5 text-[10px] text-muted-foreground/50">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-brand-indigo/30 border border-brand-indigo/40 inline-block" />
                  Firma Standı
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-brand-gold/20 border border-brand-gold/35 inline-block" />
                  Özel Alan
                </span>
                <span className="flex items-center gap-1 hidden lg:flex">
                  <span className="text-xs">🏃</span>
                  Sen
                </span>
              </div>
            </div>

            {/* Mobile controls */}
            <div className="mt-4 flex flex-col items-center gap-1.5 xl:hidden">
              <button
                onPointerDown={() => move(-1, 0)}
                className="w-11 h-11 glass rounded-xl border border-white/10 flex items-center justify-center active:bg-white/10 transition-colors touch-manipulation"
              >
                <ArrowUp className="w-4 h-4 text-white/80" />
              </button>
              <div className="flex gap-1.5">
                {[
                  [0, -1, <ArrowLeft key="l" className="w-4 h-4 text-white/80" />],
                  [1, 0, <ArrowDown key="d" className="w-4 h-4 text-white/80" />],
                  [0, 1, <ArrowRight key="r" className="w-4 h-4 text-white/80" />],
                ].map(([dr, dc, icon], i) => (
                  <button
                    key={i}
                    onPointerDown={() => move(dr as number, dc as number)}
                    className="w-11 h-11 glass rounded-xl border border-white/10 flex items-center justify-center active:bg-white/10 transition-colors touch-manipulation"
                  >
                    {icon as React.ReactNode}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground/40 mt-2.5 hidden xl:block">
              ↑ ↓ ← → veya W A S D ile gez · Altın alanlarda sürpriz ödüller!
            </p>
          </motion.div>

          {/* ─── Sağ Panel ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="w-full xl:w-72 space-y-3"
          >
            {/* Popup */}
            <AnimatePresence mode="wait">
              {popup ? (
                <motion.div
                  key={popup.type === "booth" ? popup.data.id : popup.data.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className={`glass-strong rounded-2xl border p-4 ${
                    popup.type === "booth"
                      ? C[popup.data.color].border
                      : "border-brand-gold/40"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    {popup.type === "booth" ? (
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${C[popup.data.color].badge}`}>
                        {popup.data.sector}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-brand-gold/15 text-brand-gold border-brand-gold/30 flex items-center gap-1">
                        <span>{popup.data.icon}</span>
                        Özel Alan
                      </span>
                    )}
                    <button
                      onClick={() => setPopup(null)}
                      className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors ml-2 flex-shrink-0"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>

                  {popup.type === "booth" ? (
                    <>
                      <h3 className="font-display font-bold text-white text-base mb-1 leading-tight">
                        {popup.data.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                        {popup.data.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs ${C[popup.data.color].text}`}>AI Eşleşme</span>
                          <span className="text-sm font-bold text-white">%{popup.data.matchScore}</span>
                        </div>
                        {visited.has(`${popup.data.row},${popup.data.col}`) && (
                          <span className="text-xs font-semibold text-brand-gold flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            +10 puan
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-display font-bold text-white text-base mb-1 leading-tight">
                        {popup.data.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                        {popup.data.description}
                      </p>
                      <div className="bg-brand-gold/8 border border-brand-gold/20 rounded-lg px-3 py-2 mb-2">
                        <p className="text-xs text-brand-gold/80 leading-relaxed">
                          💡 {popup.data.realFeature}
                        </p>
                      </div>
                      {visited.has(`${popup.data.row},${popup.data.col}`) && (
                        <span className="text-xs font-semibold text-brand-gold flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          +{popup.data.points} puan kazandın!
                        </span>
                      )}
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl border border-white/8 p-4 text-center"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2.5">
                    <QrCode className="w-4 h-4 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">
                    Bir standa gir — firma bilgileri ve eşleşme skoru burada görünür.
                  </p>
                  <p className="text-xs text-brand-gold/60 mt-1.5">
                    ⭐ Ortadaki altın alanlarda sürpriz var!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rozet listesi */}
            <div className="glass rounded-2xl border border-white/8 p-4">
              <h4 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">
                Rozetler
              </h4>
              <div className="space-y-2">
                {BADGES.map((b) => {
                  const earned = visitedCount >= b.count;
                  return (
                    <div
                      key={b.name}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-400 ${
                        earned
                          ? "bg-brand-gold/10 border border-brand-gold/20"
                          : "bg-white/[0.02] border border-white/5"
                      }`}
                    >
                      <span className={`text-lg leading-none transition-all duration-300 ${earned ? "" : "grayscale opacity-25"}`}>
                        {b.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold leading-tight ${earned ? "text-white" : "text-muted-foreground/35"}`}>
                          {b.name}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${earned ? "text-brand-gold/80" : "text-muted-foreground/25"}`}>
                          {b.desc}
                        </p>
                      </div>
                      {earned ? (
                        <span className="text-xs font-bold text-brand-gold shrink-0">+{b.pts}p</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30 shrink-0">{b.count} ziyaret</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tüm ziyaret CTA */}
            {allDone && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass-strong rounded-2xl border border-brand-gold/30 p-4 text-center bg-brand-gold/5"
              >
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm font-bold text-white mb-1">Tebrikler, Efsane!</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Gerçek platformda 500 puana bir sonraki fuara ücretsiz girersin.
                </p>
                <a
                  href="/register?role=visitor"
                  className="block w-full py-2 px-3 rounded-xl bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-sm font-semibold hover:bg-brand-gold/30 transition-colors"
                >
                  Ziyaretçi Ol — Ücretsiz
                </a>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ─── Rozet kazanma toastı ─────────────────────────────────────────── */}
      <AnimatePresence>
        {flashBadge && (
          <motion.div
            initial={{ opacity: 0, y: 80, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 40, x: "-50%", scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-8 left-1/2 z-50 glass-strong rounded-2xl border border-brand-gold/50 px-5 py-3.5 flex items-center gap-3 shadow-2xl shadow-brand-gold/25 pointer-events-none"
          >
            <span className="text-3xl">{flashBadge.icon}</span>
            <div>
              <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">Rozet Kazandın!</p>
              <p className="text-base font-bold text-white leading-tight">{flashBadge.name}</p>
            </div>
            <div className="ml-1 px-2.5 py-1 rounded-full bg-brand-gold/25 border border-brand-gold/40 text-brand-gold text-sm font-bold">
              +{flashBadge.pts}p
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
