"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, CalendarDays, Building2, BarChart2,
  Settings, Store, Activity, MessageSquare, UserCircle2,
  FileBarChart, ClipboardList, Trophy, QrCode, Map,
  Upload, Save, MousePointer, CheckCircle2, ArrowLeft,
  Trash2, Eye, LogIn, LogOut, UserCheck,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import {
  updateHallMap,
  updateBoothPositions,
  assignExhibitorToBooth,
  updateEntranceExit,
} from "@/features/events/hallMapActions";
import type { HallWithMap, BoothOnMap, ExhibitorOption } from "@/features/events/hallMapActions";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",               href: "/organizer",                         icon: LayoutDashboard },
  { label: "Fuarlar",             href: "/organizer/events",                  icon: CalendarDays },
  { label: "Katılım Talepleri",   href: "/organizer/participation-requests",  icon: ClipboardList },
  { label: "Ziyaretçilerim",      href: "/organizer/visitors",                icon: Building2 },
  { label: "Görevler",            href: "/organizer/tasks",                   icon: Trophy },
  { label: "Standlar",            href: "/organizer/booths",                  icon: Store },
  { label: "Stand Takip",         href: "/organizer/booth-tracking",          icon: Activity },
  { label: "Mesajlar",            href: "/organizer/messages",                icon: MessageSquare },
  { label: "Altın QR",            href: "/organizer/golden-qr",               icon: QrCode },
  { label: "Analiz",              href: "/organizer/analytics",               icon: BarChart2 },
  { label: "Fuar Raporu",         href: "/organizer/fair-report",             icon: FileBarChart },
  { label: "Marka Profilim",      href: "/organizer/profile",                 icon: UserCircle2 },
  { label: "Ayarlar",             href: "/organizer/settings",                icon: Settings },
];

type PendingPos = { x_pct: number; y_pct: number };
type PlaceMode  = "booth" | "entrance" | "exit";

interface Props {
  profile: Profile;
  hall: HallWithMap;
  exhibitors: ExhibitorOption[];
}

export function MapEditorClient({ profile, hall, exhibitors }: Props) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [, startTransition] = useTransition();

  const [mapUrl, setMapUrl]             = useState<string | null>(hall.map_url);
  const [booths, setBooths]             = useState<BoothOnMap[]>(hall.booths);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const [pendingPositions, setPendingPositions] = useState<Record<string, PendingPos>>({});
  const [uploading, setUploading]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [savedOk, setSavedOk]           = useState(false);
  const [placeMode, setPlaceMode]       = useState<PlaceMode>("booth");
  const [entrancePos, setEntrancePos]   = useState<PendingPos | null>(
    hall.entrance_x != null && hall.entrance_y != null
      ? { x_pct: hall.entrance_x, y_pct: hall.entrance_y }
      : null
  );
  const [exitPos, setExitPos]           = useState<PendingPos | null>(
    hall.exit_x != null && hall.exit_y != null
      ? { x_pct: hall.exit_x, y_pct: hall.exit_y }
      : null
  );
  const [assigningBoothId, setAssigningBoothId] = useState<string | null>(null);

  const mapRef      = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBoothPos = useCallback((booth: BoothOnMap): PendingPos | null => {
    if (pendingPositions[booth.id]) return pendingPositions[booth.id];
    if (booth.x_pct != null && booth.y_pct != null) {
      return { x_pct: booth.x_pct, y_pct: booth.y_pct };
    }
    return null;
  }, [pendingPositions]);

  const placedBooths   = booths.filter(b => getBoothPos(b) !== null);
  const unplacedBooths = booths.filter(b => getBoothPos(b) === null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${hall.event_id}/${hall.id}.${ext}`;

    const { data, error } = await supabase.storage
      .from("hall-maps")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      alert("Görsel yüklenemedi: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("hall-maps").getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl;

    if (file.type === "image/svg+xml") {
      await updateHallMap(hall.id, publicUrl, 1000, 1000);
      setMapUrl(publicUrl);
      setUploading(false);
    } else {
      const img = new Image();
      img.onload = async () => {
        await updateHallMap(hall.id, publicUrl, img.naturalWidth, img.naturalHeight);
        setMapUrl(publicUrl);
        setUploading(false);
      };
      img.src = publicUrl;
    }
  }

  function getPctFromClick(e: React.MouseEvent<HTMLDivElement>): { x_pct: number; y_pct: number } | null {
    if (!mapRef.current) return null;
    const rect = mapRef.current.getBoundingClientRect();
    return {
      x_pct: ((e.clientX - rect.left) / rect.width) * 100,
      y_pct: ((e.clientY - rect.top)  / rect.height) * 100,
    };
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    const pct = getPctFromClick(e);
    if (!pct) return;

    if (placeMode === "entrance") {
      setEntrancePos(pct);
    } else if (placeMode === "exit") {
      setExitPos(pct);
    } else if (placeMode === "booth" && selectedBoothId) {
      setPendingPositions(prev => ({ ...prev, [selectedBoothId]: pct }));
      setSelectedBoothId(null);
    }
  }

  function handleMarkerClick(e: React.MouseEvent, boothId: string) {
    e.stopPropagation();
    if (placeMode === "booth") {
      setSelectedBoothId(prev => prev === boothId ? null : boothId);
    }
  }

  function handleRemovePosition(boothId: string) {
    setPendingPositions(prev => {
      const next = { ...prev };
      delete next[boothId];
      return next;
    });
    setBooths(prev => prev.map(b => b.id === boothId ? { ...b, x_pct: null, y_pct: null } : b));
  }

  async function handleAssignExhibitor(boothId: string, profileId: string | null) {
    setAssigningBoothId(boothId);
    const res = await assignExhibitorToBooth(boothId, profileId);
    if (res.error) {
      alert("Atama başarısız: " + res.error);
    } else {
      setBooths(prev => prev.map(b => {
        if (b.id !== boothId) return b;
        const ex = exhibitors.find(e => e.profile_id === profileId);
        return {
          ...b,
          exhibitor_id: profileId,
          exhibitor: ex ? { company_name: ex.company_name, logo_url: ex.logo_url, tags: [], description: null, owner_id: profileId! } : null,
        };
      }));
    }
    setAssigningBoothId(null);
  }

  async function handleSave() {
    setSaving(true);

    const allPositions: { boothId: string; x_pct: number; y_pct: number }[] = [];
    for (const booth of booths) {
      const pos = getBoothPos(booth);
      if (pos) allPositions.push({ boothId: booth.id, x_pct: pos.x_pct, y_pct: pos.y_pct });
    }

    const savePos = updateBoothPositions(allPositions, hall.event_id);
    const saveEntrExit = updateEntranceExit(
      hall.id,
      entrancePos?.x_pct ?? null,
      entrancePos?.y_pct ?? null,
      exitPos?.x_pct ?? null,
      exitPos?.y_pct ?? null,
    );

    const [posResult] = await Promise.all([savePos, saveEntrExit]);
    setSaving(false);

    if (posResult.error) {
      alert("Kayıt başarısız: " + posResult.error);
    } else {
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
    }
  }

  const selectedBooth = booths.find(b => b.id === selectedBoothId);

  const cursorClass = placeMode !== "booth"
    ? "cursor-crosshair"
    : selectedBoothId
    ? "border-brand-cyan/60 cursor-crosshair"
    : "border-white/10 cursor-default";

  const modeInstruction = placeMode === "entrance"
    ? "Haritada GİRİŞ noktasını işaretleyin"
    : placeMode === "exit"
    ? "Haritada ÇIKIŞ noktasını işaretleyin"
    : selectedBooth
    ? `"${selectedBooth.code}" standını yerleştirmek için haritada bir yer seçin`
    : null;

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-4 lg:p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Geri
          </Button>
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-brand-indigo-light" />
            <h1 className="font-display text-xl font-bold text-white">{hall.name} — Harita Editörü</h1>
            <span className="text-xs text-muted-foreground">{hall.floor}. Kat</span>
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            {/* Placement mode selector */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => { setPlaceMode("booth"); }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${placeMode === "booth" ? "bg-brand-indigo/40 text-white" : "text-muted-foreground hover:text-white"}`}
                title="Stand yerleştir"
              >
                <MousePointer className="w-3 h-3" /> Stand
              </button>
              <button
                onClick={() => { setPlaceMode("entrance"); setSelectedBoothId(null); }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${placeMode === "entrance" ? "bg-green-500/30 text-green-400" : "text-muted-foreground hover:text-white"}`}
                title="Giriş noktası"
              >
                <LogIn className="w-3 h-3" /> Giriş
              </button>
              <button
                onClick={() => { setPlaceMode("exit"); setSelectedBoothId(null); }}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${placeMode === "exit" ? "bg-red-500/30 text-red-400" : "text-muted-foreground hover:text-white"}`}
                title="Çıkış noktası"
              >
                <LogOut className="w-3 h-3" /> Çıkış
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Yükleniyor..." : mapUrl ? "Görseli Değiştir" : "Kat Planı Yükle"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="gradient"
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {savedOk ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Kaydediliyor..." : savedOk ? "Kaydedildi!" : "Kaydet"}
            </Button>
          </div>
        </div>

        {/* Instructions banner */}
        {modeInstruction && (
          <motion.div
            key={placeMode + selectedBoothId}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              placeMode === "entrance" ? "bg-green-500/10 border border-green-500/25 text-green-400" :
              placeMode === "exit"     ? "bg-red-500/10 border border-red-500/25 text-red-400" :
              "bg-brand-cyan/10 border border-brand-cyan/25 text-brand-cyan"
            }`}
          >
            <MousePointer className="w-4 h-4 flex-shrink-0" />
            <span>{modeInstruction}</span>
          </motion.div>
        )}

        <div className="flex gap-4 h-[calc(100vh-250px)]">

          {/* Map area */}
          <div className="flex-1 min-w-0">
            {mapUrl ? (
              <div
                ref={mapRef}
                className={`relative w-full h-full rounded-xl overflow-hidden border ${cursorClass}`}
                onClick={handleMapClick}
              >
                <img
                  src={mapUrl}
                  alt={`${hall.name} kat planı`}
                  className="w-full h-full object-contain bg-white/5"
                  draggable={false}
                />

                {/* Entrance marker */}
                {entrancePos && (
                  <div
                    className="absolute z-20 pointer-events-none"
                    style={{ left: `${entrancePos.x_pct}%`, top: `${entrancePos.y_pct}%`, transform: "translate(-50%,-50%)" }}
                  >
                    <div className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg shadow-green-500/40">
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
                    <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-lg shadow-red-500/40">
                      <LogOut className="w-2.5 h-2.5" /> ÇIKIŞ
                    </div>
                  </div>
                )}

                {/* Booth markers */}
                {booths.map(booth => {
                  const pos = getBoothPos(booth);
                  if (!pos) return null;
                  const isSelected  = selectedBoothId === booth.id;
                  const hasExhibitor = booth.exhibitor_id != null;

                  return (
                    <div
                      key={booth.id}
                      className="absolute"
                      style={{ left: `${pos.x_pct}%`, top: `${pos.y_pct}%`, transform: "translate(-50%, -50%)" }}
                    >
                      <button
                        className={`group relative w-7 h-7 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                          isSelected
                            ? "bg-brand-gold border-brand-gold text-black scale-125 shadow-lg shadow-brand-gold/40"
                            : hasExhibitor
                            ? "bg-brand-cyan/80 border-brand-cyan text-black hover:scale-110"
                            : "bg-white/30 border-white/60 text-white hover:scale-110"
                        }`}
                        onClick={(e) => handleMarkerClick(e, booth.id)}
                        title={booth.code + (booth.exhibitor?.company_name ? ` — ${booth.exhibitor.company_name}` : "")}
                      >
                        {booth.code.slice(0, 3)}
                        {booth.exhibitor && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 w-44">
                            <div className="bg-brand-darker border border-white/15 rounded-lg p-2 shadow-xl text-left">
                              <p className="text-xs font-semibold text-white">{booth.code}</p>
                              <p className="text-xs text-brand-cyan">{booth.exhibitor.company_name}</p>
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="w-full h-full rounded-xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-brand-indigo/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
                  <Map className="w-8 h-8 text-brand-indigo-light" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Kat Planı Yükle</p>
                  <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP veya SVG · Maks. 10 MB</p>
                  <p className="text-xs text-muted-foreground mt-2">Tüyap, CNR veya özel salon planınızı yükleyin</p>
                </div>
                <Button variant="outline" size="sm" disabled={uploading} className="gap-2">
                  <Upload className="w-4 h-4" />
                  {uploading ? "Yükleniyor..." : "Görsel Seç"}
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64 flex-shrink-0 space-y-3 overflow-y-auto">

            {/* Stats */}
            <div className="glass rounded-xl border border-white/8 p-3">
              <p className="text-xs text-muted-foreground mb-2">Stand Durumu</p>
              <div className="flex gap-3">
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-brand-cyan">{placedBooths.length}</p>
                  <p className="text-xs text-muted-foreground">Yerleştirildi</p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center flex-1">
                  <p className="text-lg font-bold text-amber-400">{unplacedBooths.length}</p>
                  <p className="text-xs text-muted-foreground">Bekliyor</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-white/8 pt-2">
                <div className={`w-2 h-2 rounded-full ${entrancePos ? "bg-green-400" : "bg-white/20"}`} />
                <span>Giriş {entrancePos ? "işaretlendi" : "yok"}</span>
                <div className={`w-2 h-2 rounded-full ml-2 ${exitPos ? "bg-red-400" : "bg-white/20"}`} />
                <span>Çıkış {exitPos ? "işaretlendi" : "yok"}</span>
              </div>
            </div>

            {/* Firm assignment section */}
            {exhibitors.length > 0 && (
              <div className="glass rounded-xl border border-brand-violet/20 p-3 space-y-2">
                <p className="text-xs text-brand-violet-light font-medium flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Firma — Stand Atama
                </p>
                <p className="text-[10px] text-muted-foreground">Stand seçin → Firmayı dropdown&apos;dan atayın</p>
                {booths.map(booth => (
                  <div key={booth.id} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-muted-foreground">{booth.code}</span>
                      {booth.exhibitor && <span className="text-[10px] text-brand-cyan truncate">{booth.exhibitor.company_name}</span>}
                    </div>
                    <select
                      value={booth.exhibitor_id ?? ""}
                      disabled={assigningBoothId === booth.id}
                      onChange={e => {
                        startTransition(async () => {
                          await handleAssignExhibitor(booth.id, e.target.value || null);
                        });
                      }}
                      className="w-full text-[11px] bg-white/5 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-brand-violet/50 disabled:opacity-50"
                    >
                      <option value="">— Firma Yok —</option>
                      {exhibitors.map(ex => (
                        <option key={ex.profile_id} value={ex.profile_id}>
                          {ex.company_name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Unplaced booths */}
            {unplacedBooths.length > 0 && (
              <div className="glass rounded-xl border border-amber-500/20 p-3 space-y-1">
                <p className="text-xs text-amber-400 font-medium mb-2">Yerleştirilmemiş Standlar</p>
                {unplacedBooths.map(booth => (
                  <button
                    key={booth.id}
                    onClick={() => { setPlaceMode("booth"); setSelectedBoothId(prev => prev === booth.id ? null : booth.id); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                      selectedBoothId === booth.id
                        ? "bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan"
                        : "hover:bg-white/5 text-muted-foreground hover:text-white"
                    }`}
                  >
                    <span className="w-7 h-5 rounded bg-white/10 flex items-center justify-center font-mono font-bold text-white text-[10px]">
                      {booth.code.slice(0, 3)}
                    </span>
                    <span className="font-medium">{booth.code}</span>
                    {booth.exhibitor && <span className="truncate text-muted-foreground">{booth.exhibitor.company_name}</span>}
                    {selectedBoothId === booth.id && (
                      <MousePointer className="w-3 h-3 ml-auto text-brand-cyan flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Placed booths */}
            {placedBooths.length > 0 && (
              <div className="glass rounded-xl border border-white/8 p-3 space-y-1">
                <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Yerleştirilmiş Standlar
                </p>
                {placedBooths.map(booth => {
                  const pos = getBoothPos(booth)!;
                  return (
                    <div
                      key={booth.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs group ${
                        selectedBoothId === booth.id ? "bg-brand-gold/15 border border-brand-gold/30" : "hover:bg-white/5"
                      }`}
                    >
                      <span className={`w-7 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 ${
                        booth.exhibitor_id ? "bg-brand-cyan/20 text-brand-cyan" : "bg-white/10 text-white"
                      }`}>
                        {booth.code.slice(0, 3)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white">{booth.code}</p>
                        {booth.exhibitor && <p className="text-muted-foreground truncate">{booth.exhibitor.company_name}</p>}
                        <p className="text-muted-foreground/60">{pos.x_pct.toFixed(1)}%, {pos.y_pct.toFixed(1)}%</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setPlaceMode("booth"); setSelectedBoothId(prev => prev === booth.id ? null : booth.id); }}
                          className="w-5 h-5 rounded hover:bg-brand-cyan/20 flex items-center justify-center text-muted-foreground hover:text-brand-cyan"
                          title="Taşı"
                        >
                          <MousePointer className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemovePosition(booth.id)}
                          className="w-5 h-5 rounded hover:bg-red-500/20 flex items-center justify-center text-muted-foreground hover:text-red-400"
                          title="Kaldır"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="glass rounded-xl border border-white/8 p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Renk Göstergesi</p>
              {[
                { color: "bg-brand-cyan/80 border-brand-cyan",    label: "Firma atanmış" },
                { color: "bg-white/30 border-white/60",           label: "Boş stand" },
                { color: "bg-brand-gold border-brand-gold",       label: "Seçili stand" },
                { color: "bg-green-500",                          label: "Giriş noktası" },
                { color: "bg-red-500",                            label: "Çıkış noktası" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
