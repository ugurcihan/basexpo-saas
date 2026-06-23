"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Tag, Search, LogIn, LogOut, Navigation } from "lucide-react";
import type { HallWithMap, BoothOnMap } from "@/features/events/hallMapActions";

interface Props {
  halls: HallWithMap[];
  currentUserId?: string;
}

function getDirectionText(
  entrance: { x_pct: number; y_pct: number },
  booth: { x_pct: number | null; y_pct: number | null },
): string {
  if (booth.x_pct == null || booth.y_pct == null) return "";
  const dx = booth.x_pct - entrance.x_pct;
  const dy = booth.y_pct - entrance.y_pct;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const h = dx > 6 ? "sağa" : dx < -6 ? "sola" : "düz";
  const v = dy > 6 ? "ileriye" : dy < -6 ? "geri" : "";
  const proximity = dist < 15 ? "yakın" : dist < 35 ? "orta" : "uzak";

  const dir = [h, v].filter(Boolean).join(" ve ");
  return `Girişten ${dir || "düz"} ilerleyin · mesafe ${proximity}`;
}

export function FloorMapViewer({ halls, currentUserId }: Props) {
  const [activeHallIdx, setActiveHallIdx] = useState(0);
  const [hoveredBooth, setHoveredBooth] = useState<BoothOnMap | null>(null);
  const [popupBooth, setPopupBooth]   = useState<BoothOnMap | null>(null);
  const [search, setSearch]           = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const hall = halls[activeHallIdx];
  if (!hall) return null;

  const placedBooths = hall.booths.filter(b => b.x_pct != null && b.y_pct != null);
  const occupiedBooths = placedBooths.filter(b => b.exhibitor_id);

  const entrancePos = hall.entrance_x != null && hall.entrance_y != null
    ? { x_pct: hall.entrance_x, y_pct: hall.entrance_y }
    : null;
  const exitPos = hall.exit_x != null && hall.exit_y != null
    ? { x_pct: hall.exit_x, y_pct: hall.exit_y }
    : null;

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return placedBooths.filter(b =>
      b.exhibitor?.company_name.toLowerCase().includes(q) ||
      b.code.toLowerCase().includes(q)
    );
  }, [search, placedBooths]);

  function handleSearchSelect(booth: BoothOnMap) {
    setHighlightId(booth.id);
    setPopupBooth(booth);
    setSearch("");
    setTimeout(() => setHighlightId(null), 3500);
  }

  function getMarkerStyle(booth: BoothOnMap) {
    const isOwn       = booth.exhibitor?.owner_id === currentUserId;
    const isHighlight = highlightId === booth.id;
    if (isOwn)        return "bg-brand-gold border-brand-gold text-black shadow-brand-gold/40 shadow-md";
    if (isHighlight)  return "bg-brand-cyan border-brand-cyan text-black";
    if (booth.exhibitor_id) return "bg-brand-cyan/85 border-brand-cyan text-black";
    return "bg-white/20 border-white/40 text-white/80";
  }

  return (
    <div className="space-y-4">
      {/* Hall tabs */}
      {halls.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {halls.map((h, idx) => (
            <button
              key={h.id}
              onClick={() => { setActiveHallIdx(idx); setPopupBooth(null); setSearch(""); setHighlightId(null); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                idx === activeHallIdx
                  ? "bg-brand-cyan/20 border border-brand-cyan/50 text-brand-cyan"
                  : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/8"
              }`}
            >
              {h.name} <span className="text-xs opacity-60">· {h.floor}. Kat</span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Firma veya stand ara... (ör: Turkcell, A1)"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/40 focus:bg-white/8 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 glass rounded-xl border border-white/15 overflow-hidden shadow-xl">
            {searchResults.map(b => (
              <button
                key={b.id}
                onClick={() => handleSearchSelect(b)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-brand-cyan flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{b.exhibitor?.company_name ?? b.code}</p>
                  <p className="text-xs text-muted-foreground">Stand {b.code}</p>
                </div>
                {entrancePos && (
                  <span className="ml-auto text-xs text-brand-cyan/70 flex items-center gap-1">
                    <Navigation className="w-3 h-3" /> Göster
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        {search && searchResults.length === 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 glass rounded-xl border border-white/10 px-4 py-3">
            <p className="text-sm text-muted-foreground">Sonuç bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Map */}
      {hall.map_url ? (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          <img
            src={hall.map_url}
            alt={`${hall.name} kat planı`}
            className="w-full object-contain select-none"
            draggable={false}
          />

          {/* Entrance marker */}
          {entrancePos && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{ left: `${entrancePos.x_pct}%`, top: `${entrancePos.y_pct}%`, transform: "translate(-50%,-50%)" }}
            >
              <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg shadow-green-500/50">
                <LogIn className="w-2.5 h-2.5" /> GİRİŞ
              </div>
            </div>
          )}

          {/* Exit marker */}
          {exitPos && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{ left: `${exitPos.x_pct}%`, top: `${exitPos.y_pct}%`, transform: "translate(-50%,-50%)" }}
            >
              <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg shadow-red-500/50">
                <LogOut className="w-2.5 h-2.5" /> ÇIKIŞ
              </div>
            </div>
          )}

          {/* Booth markers */}
          {placedBooths.map(booth => {
            const isHighlight = highlightId === booth.id;
            return (
              <div
                key={booth.id}
                className="absolute"
                style={{
                  left: `${booth.x_pct}%`,
                  top:  `${booth.y_pct}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isHighlight ? 30 : 10,
                }}
              >
                {/* Pulse ring for highlighted booth */}
                {isHighlight && (
                  <div className="absolute inset-0 rounded-full bg-brand-cyan/40 animate-ping" style={{ width: 40, height: 40, left: -10, top: -10 }} />
                )}
                <button
                  className={`border-2 rounded-md flex items-center justify-center text-[10px] font-bold transition-all duration-150 hover:scale-125 hover:z-20 ${getMarkerStyle(booth)} ${isHighlight ? "scale-150 shadow-lg" : ""}`}
                  style={{
                    width: "clamp(20px, 2.5vw, 32px)",
                    height: "clamp(20px, 2.5vw, 32px)",
                  }}
                  onClick={() => setPopupBooth(prev => prev?.id === booth.id ? null : booth)}
                  onMouseEnter={() => setHoveredBooth(booth)}
                  onMouseLeave={() => setHoveredBooth(null)}
                >
                  {booth.code.slice(0, 3)}

                  {/* Mini tooltip */}
                  {hoveredBooth?.id === booth.id && !popupBooth && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-30 whitespace-nowrap">
                      <div className="bg-brand-darker border border-white/20 rounded-lg px-2 py-1 shadow-xl text-left">
                        <p className="text-xs font-semibold text-white">{booth.code}</p>
                        {booth.exhibitor
                          ? <p className="text-xs text-brand-cyan">{booth.exhibitor.company_name}</p>
                          : <p className="text-xs text-muted-foreground">Boş Stand</p>
                        }
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 flex-wrap">
            {[
              currentUserId && { color: "bg-brand-gold border-brand-gold",    label: "Senin Standın" },
              { color: "bg-brand-cyan/85 border-brand-cyan", label: "Firma Var" },
              { color: "bg-white/20 border-white/40",        label: "Boş" },
            ].filter(Boolean).map((item) => {
              const { color, label } = item as { color: string; label: string };
              return (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded border flex-shrink-0 ${color}`} />
                  <span className="text-[10px] text-white/70">{label}</span>
                </div>
              );
            })}
          </div>

          {/* Stand count */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <span className="text-xs text-white/70">{placedBooths.length} stand · {hall.name}</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-64 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
          <MapPin className="w-8 h-8 text-muted-foreground" />
          <div className="text-center">
            <p className="text-white font-medium">Harita Henüz Yüklenmedi</p>
            <p className="text-sm text-muted-foreground">{hall.name} için kat planı organizatör tarafından eklenecek</p>
          </div>
        </div>
      )}

      {/* Booth popup */}
      <AnimatePresence>
        {popupBooth && (
          <motion.div
            key="popup"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="glass rounded-2xl border border-white/10 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {popupBooth.exhibitor?.logo_url ? (
                  <img
                    src={popupBooth.exhibitor.logo_url}
                    alt={popupBooth.exhibitor.company_name}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-indigo/15 border border-brand-indigo/25 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-brand-indigo-light" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Stand {popupBooth.code}</p>
                  {popupBooth.exhibitor ? (
                    <p className="font-semibold text-white">{popupBooth.exhibitor.company_name}</p>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">Boş Stand</p>
                  )}
                  {popupBooth.exhibitor?.owner_id === currentUserId && (
                    <span className="text-xs text-brand-gold font-medium">★ Senin Standın</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPopupBooth(null)}
                className="text-muted-foreground hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direction */}
            {entrancePos && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-cyan/8 border border-brand-cyan/20">
                <Navigation className="w-3.5 h-3.5 text-brand-cyan flex-shrink-0" />
                <p className="text-xs text-brand-cyan">
                  {getDirectionText(entrancePos, { x_pct: popupBooth.x_pct, y_pct: popupBooth.y_pct })}
                </p>
              </div>
            )}

            {popupBooth.exhibitor && (
              <div className="mt-4 space-y-3">
                {popupBooth.exhibitor.description && (
                  <p className="text-sm text-foreground line-clamp-3">{popupBooth.exhibitor.description}</p>
                )}
                {popupBooth.exhibitor.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {popupBooth.exhibitor.tags.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-indigo/15 border border-brand-indigo/25 text-brand-indigo-light">
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booth list below map */}
      {occupiedBooths.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {occupiedBooths.map(booth => (
            <button
              key={booth.id}
              onClick={() => { setPopupBooth(prev => prev?.id === booth.id ? null : booth); handleSearchSelect(booth); }}
              className={`glass rounded-xl border p-3 text-left transition-all hover:border-brand-cyan/30 ${
                popupBooth?.id === booth.id ? "border-brand-cyan/50 bg-brand-cyan/5" : "border-white/8"
              }`}
            >
              <p className="text-xs text-muted-foreground">Stand {booth.code}</p>
              <p className="text-sm font-medium text-white truncate">{booth.exhibitor?.company_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
