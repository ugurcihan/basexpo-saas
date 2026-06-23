"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Globe, Phone, Tag } from "lucide-react";
import type { HallWithMap, BoothOnMap } from "@/features/events/hallMapActions";

interface Props {
  halls: HallWithMap[];
  currentUserId?: string;
}

export function FloorMapViewer({ halls, currentUserId }: Props) {
  const [activeHallIdx, setActiveHallIdx] = useState(0);
  const [hoveredBooth, setHoveredBooth] = useState<BoothOnMap | null>(null);
  const [popupBooth, setPopupBooth] = useState<BoothOnMap | null>(null);

  const hall = halls[activeHallIdx];
  if (!hall) return null;

  const placedBooths = hall.booths.filter(b => b.x_pct != null && b.y_pct != null);

  function getMarkerStyle(booth: BoothOnMap) {
    const isOwn = booth.exhibitor?.owner_id === currentUserId;
    if (isOwn)              return "bg-brand-gold border-brand-gold text-black shadow-brand-gold/40 shadow-md";
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
              onClick={() => { setActiveHallIdx(idx); setPopupBooth(null); }}
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

      {/* Map */}
      {hall.map_url ? (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5">
          <img
            src={hall.map_url}
            alt={`${hall.name} kat planı`}
            className="w-full object-contain select-none"
            draggable={false}
          />

          {/* Booth markers */}
          {placedBooths.map(booth => (
            <button
              key={booth.id}
              className={`absolute group border-2 rounded-md flex items-center justify-center text-[10px] font-bold transition-all duration-150 hover:scale-125 hover:z-20 ${getMarkerStyle(booth)}`}
              style={{
                left: `${booth.x_pct}%`,
                top:  `${booth.y_pct}%`,
                transform: "translate(-50%, -50%)",
                width: "clamp(20px, 2.5vw, 32px)",
                height: "clamp(20px, 2.5vw, 32px)",
              }}
              onClick={() => setPopupBooth(prev => prev?.id === booth.id ? null : booth)}
              onMouseEnter={() => setHoveredBooth(booth)}
              onMouseLeave={() => setHoveredBooth(null)}
            >
              {booth.code.slice(0, 3)}

              {/* Mini tooltip on hover */}
              {hoveredBooth?.id === booth.id && !popupBooth && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-30 whitespace-nowrap">
                  <div className="bg-brand-darker border border-white/20 rounded-lg px-2 py-1 shadow-xl text-left">
                    <p className="text-xs font-semibold text-white">{booth.code}</p>
                    {booth.exhibitor && <p className="text-xs text-brand-cyan">{booth.exhibitor.company_name}</p>}
                    {!booth.exhibitor && <p className="text-xs text-muted-foreground">Boş Stand</p>}
                  </div>
                </div>
              )}
            </button>
          ))}

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5">
            {[
              { color: "bg-brand-gold border-brand-gold",    label: "Senin Standın" },
              { color: "bg-brand-cyan/85 border-brand-cyan", label: "Firma Var" },
              { color: "bg-white/20 border-white/40",        label: "Boş" },
            ].filter(item => item.label !== "Senin Standın" || currentUserId).map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded border flex-shrink-0 ${color}`} />
                <span className="text-[10px] text-white/70">{label}</span>
              </div>
            ))}
          </div>

          {/* Stand count overlay */}
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
      {placedBooths.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {placedBooths.filter(b => b.exhibitor_id).map(booth => (
            <button
              key={booth.id}
              onClick={() => setPopupBooth(prev => prev?.id === booth.id ? null : booth)}
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
