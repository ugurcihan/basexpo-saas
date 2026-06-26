"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, User, Plus, Trash2, Download, Printer,
  ChevronDown, ChevronRight, GripVertical, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Types ──────────────────────────────────────────────── */

interface Exhibitor  { id: string; company_name: string }
interface BoothRow   { id: string; code: string; exhibitor_id: string | null }
interface HallRow    { id: string; name: string; booths: BoothRow[] }
interface StaffRow   { id: string; name: string; role: string }
interface Employee   { id: string; name: string; role: string }

interface BadgeElement {
  id: "name" | "role" | "sub";
  x: number;       // % of badge width (0–100)
  y: number;       // % of badge height (0–100)
  fontSize: number; // pt (PDF) / px (preview — used 1:1 for visual proportion)
  bold: boolean;
}

interface BadgeConfig {
  accentColor: string;
  fontFamily: "helvetica" | "times" | "courier";
  elements: BadgeElement[];
}

interface Props {
  eventName: string;
  exhibitors: Exhibitor[];
  halls: HallRow[];
}

/* ─── Constants ──────────────────────────────────────────── */

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#dc2626", "#d97706", "#7c3aed"];
const FONTS: { value: BadgeConfig["fontFamily"]; label: string }[] = [
  { value: "helvetica", label: "Helvetica" },
  { value: "times",     label: "Times"     },
  { value: "courier",   label: "Courier"   },
];

const DEFAULT_CONFIG: BadgeConfig = {
  accentColor: "#4f46e5",
  fontFamily: "helvetica",
  elements: [
    { id: "name", x: 50, y: 40, fontSize: 15, bold: true  },
    { id: "role", x: 50, y: 57, fontSize: 10, bold: false },
    { id: "sub",  x: 50, y: 71, fontSize:  9, bold: true  },
  ],
};

/* ─── Helpers ────────────────────────────────────────────── */

function boothCode(exhibitorId: string, halls: HallRow[]): string {
  for (const h of halls) {
    const b = h.booths.find(b => b.exhibitor_id === exhibitorId);
    if (b) return b.code;
  }
  return "—";
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/* ─── PDF generation ─────────────────────────────────────── */

interface BadgeItem { name: string; role: string; sub: string }

async function generateBadgePDF(
  items: BadgeItem[],
  eventName: string,
  config: BadgeConfig,
  filename: string,
) {
  if (!items.length) return;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const cols = 2, rows = 4;
  const bW = 88, bH = 58;
  const gX = 7, gY = 6;
  const marginL = (pageW - cols * bW - (cols - 1) * gX) / 2;
  const marginT = 12;
  const [ar, ag, ab] = hexToRgb(config.accentColor);
  const barH = bH * 0.18;

  items.forEach((item, i) => {
    const pos = i % (cols * rows);
    const col = pos % cols;
    const row = Math.floor(pos / cols);
    if (pos === 0 && i > 0) doc.addPage();

    const bx = marginL + col * (bW + gX);
    const by = marginT + row * (bH + gY);

    // Badge border + fill
    doc.setDrawColor(220, 220, 230);
    doc.setFillColor(250, 250, 255);
    doc.roundedRect(bx, by, bW, bH, 4, 4, "FD");

    // Top color bar
    doc.setFillColor(ar, ag, ab);
    doc.roundedRect(bx, by, bW, barH, 4, 4, "F");
    doc.rect(bx, by + barH - 2, bW, 2, "F");

    // Event name in bar
    doc.setFont(config.fontFamily, "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(eventName.slice(0, 38), bx + bW / 2, by + barH / 2 + 1.5, { align: "center" });

    // Draggable elements
    const values: Record<BadgeElement["id"], string> = {
      name: item.name.length > 26 ? item.name.slice(0, 24) + "…" : item.name,
      role: item.role.length > 34 ? item.role.slice(0, 32) + "…" : item.role,
      sub:  item.sub,
    };

    config.elements.forEach(el => {
      const xMM = bx + (el.x / 100) * bW;
      const yMM = by + (el.y / 100) * bH;
      doc.setFont(config.fontFamily, el.bold ? "bold" : "normal");
      doc.setFontSize(Math.max(6, el.fontSize));
      if (el.id === "sub") doc.setTextColor(ar, ag, ab);
      else if (el.id === "name") doc.setTextColor(20, 20, 40);
      else doc.setTextColor(60, 60, 80);
      doc.text(values[el.id], xMM, yMM, { align: "center" });
    });

    // Bottom divider + branding
    doc.setDrawColor(220, 220, 235);
    doc.line(bx + 6, by + bH - 8, bx + bW - 6, by + bH - 8);
    doc.setFont(config.fontFamily, "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(160, 160, 180);
    doc.text("BasExpo — Akıllı Fuar Sistemi", bx + bW / 2, by + bH - 3, { align: "center" });
  });

  doc.save(filename);
}

/* ─── Badge Preview ──────────────────────────────────────── */

function BadgePreview({
  eventName, nameText, roleText, subText, config,
  dragging, onDragStart, previewRef,
}: {
  eventName: string;
  nameText: string; roleText: string; subText: string;
  config: BadgeConfig;
  dragging: string | null;
  onDragStart: (id: string) => void;
  previewRef: React.RefObject<HTMLDivElement>;
}) {
  const labels: Record<BadgeElement["id"], string> = { name: nameText, role: roleText, sub: subText };
  const nameEl = config.elements.find(e => e.id === "name")!;
  const roleEl = config.elements.find(e => e.id === "role")!;
  const subEl  = config.elements.find(e => e.id === "sub")!;

  return (
    <div
      ref={previewRef}
      style={{
        position: "relative", width: "100%", aspectRatio: "88/58",
        userSelect: dragging ? "none" : undefined,
        cursor: dragging ? "grabbing" : undefined,
      }}
      className="rounded-xl overflow-hidden border border-white/20 shadow-2xl"
    >
      {/* White badge background */}
      <div style={{ position: "absolute", inset: 0, background: "#fafaff" }}>

        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "18%",
          background: config.accentColor, borderRadius: "8px 8px 0 0",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "7px", fontWeight: 700, color: "white", fontFamily: "sans-serif", letterSpacing: "0.04em" }}>
            {eventName.slice(0, 38).toUpperCase()}
          </span>
        </div>

        {/* Draggable elements */}
        {[nameEl, roleEl, subEl].map(el => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: `${el.x}%`, top: `${el.y}%`,
              transform: "translate(-50%, -50%)",
              cursor: dragging === el.id ? "grabbing" : "grab",
              padding: "2px 4px",
              borderRadius: 3,
              outline: dragging === el.id ? `2px solid ${config.accentColor}` : "none",
              background: dragging === el.id ? `${config.accentColor}18` : "transparent",
              whiteSpace: "nowrap", maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis",
            }}
            onMouseDown={(e) => { e.preventDefault(); onDragStart(el.id); }}
          >
            <span style={{
              fontSize: `${el.fontSize}px`,
              fontWeight: el.bold ? 700 : 400,
              color: el.id === "sub" ? config.accentColor : el.id === "name" ? "#14142a" : "#3c3c50",
              fontFamily: config.fontFamily === "times" ? "Georgia, serif"
                        : config.fontFamily === "courier" ? "Courier New, monospace"
                        : "Arial, sans-serif",
            }}>
              {labels[el.id] || (el.id === "name" ? "Ad Soyad" : el.id === "role" ? "Görev / Unvan" : "PERSONEL")}
            </span>
          </div>
        ))}

        {/* Bottom divider + branding */}
        <div style={{
          position: "absolute", bottom: "6%", left: "6%", right: "6%",
          borderTop: "1px solid #dcdceb",
        }} />
        <div style={{
          position: "absolute", bottom: "1%", left: 0, right: 0,
          textAlign: "center", fontSize: "6px", color: "#a0a0b4",
          fontFamily: "Arial, sans-serif",
        }}>
          BasExpo — Akıllı Fuar Sistemi
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

export function BadgePrintSection({ eventName, exhibitors, halls }: Props) {
  /* -- Personel state -- */
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [config, setConfig] = useState<BadgeConfig>(DEFAULT_CONFIG);
  const [dragging, setDragging] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null!);

  /* -- Firma/çalışan state -- */
  const [companyEmployees, setCompanyEmployees] = useState<Record<string, Employee[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftInputs, setDraftInputs] = useState<Record<string, { name: string; role: string }>>({});

  /* -- Shared -- */
  const [genPending, setGenPending] = useState(false);

  /* ── Drag: global mouse tracking ───────────────────────── */
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const x = Math.max(2, Math.min(98, (e.clientX - rect.left) / rect.width * 100));
      const y = Math.max(20, Math.min(84, (e.clientY - rect.top) / rect.height * 100));
      setConfig(c => ({
        ...c,
        elements: c.elements.map(el => el.id === dragging ? { ...el, x, y } : el),
      }));
    };
    const handleUp = () => setDragging(null);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  /* ── Element config updater ─────────────────────────────── */
  function updateElement(id: BadgeElement["id"], patch: Partial<BadgeElement>) {
    setConfig(c => ({
      ...c,
      elements: c.elements.map(el => el.id === id ? { ...el, ...patch } : el),
    }));
  }

  /* ── Personel handlers ──────────────────────────────────── */
  function addStaff() {
    if (!draftName.trim()) return;
    setStaff(prev => [...prev, { id: crypto.randomUUID(), name: draftName.trim(), role: draftRole.trim() }]);
    setDraftName(""); setDraftRole("");
  }
  function removeStaff(id: string) { setStaff(prev => prev.filter(s => s.id !== id)); }

  /* ── Firma handlers ─────────────────────────────────────── */
  function addEmployee(exhibitorId: string) {
    const input = draftInputs[exhibitorId];
    if (!input?.name?.trim()) return;
    setCompanyEmployees(prev => ({
      ...prev,
      [exhibitorId]: [...(prev[exhibitorId] ?? []), { id: crypto.randomUUID(), name: input.name.trim(), role: input.role?.trim() || "" }],
    }));
    setDraftInputs(prev => ({ ...prev, [exhibitorId]: { name: "", role: "" } }));
  }
  function removeEmployee(exhibitorId: string, empId: string) {
    setCompanyEmployees(prev => ({
      ...prev,
      [exhibitorId]: (prev[exhibitorId] ?? []).filter(e => e.id !== empId),
    }));
  }

  /* ── PDF downloads ──────────────────────────────────────── */
  async function downloadStaffPDF() {
    if (!staff.length) return;
    setGenPending(true);
    await generateBadgePDF(
      staff.map(s => ({ name: s.name, role: s.role || "Organizasyon Ekibi", sub: "PERSONEL" })),
      eventName, config, `${eventName}_personel_yaka.pdf`
    );
    setGenPending(false);
  }

  async function downloadCompanyPDF(exhibitorId: string, companyName: string) {
    const employees = companyEmployees[exhibitorId] ?? [];
    if (!employees.length) return;
    setGenPending(true);
    await generateBadgePDF(
      employees.map(e => ({ name: companyName, role: e.name, sub: e.role || "Firma Temsilcisi" })),
      eventName, config, `${companyName}_yaka.pdf`
    );
    setGenPending(false);
  }

  async function downloadAll() {
    setGenPending(true);
    const items: BadgeItem[] = [];
    exhibitors.forEach(ex => {
      (companyEmployees[ex.id] ?? []).forEach(e => {
        items.push({ name: ex.company_name, role: e.name, sub: e.role || "Firma Temsilcisi" });
      });
    });
    staff.forEach(s => items.push({ name: s.name, role: s.role || "Organizasyon Ekibi", sub: "PERSONEL" }));
    if (items.length) await generateBadgePDF(items, eventName, config, `${eventName}_tum_yaka.pdf`);
    setGenPending(false);
  }

  /* ── Preview sample text ─────────────────────────────────── */
  const previewName = staff[0]?.name || draftName || "Ahmet Yılmaz";
  const previewRole = staff[0]?.role || draftRole || "Organizasyon Ekibi";

  const nameEl = config.elements.find(e => e.id === "name")!;
  const roleEl = config.elements.find(e => e.id === "role")!;
  const subEl  = config.elements.find(e => e.id === "sub")!;

  const totalBadges = staff.length + Object.values(companyEmployees).reduce((s, arr) => s + arr.length, 0);

  /* ──────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ─── Personel Yaka Kartı Tasarımcısı ─────────────── */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-5 h-5 text-brand-cyan" />
          <h3 className="font-semibold text-white">Personel Yaka Kartı Tasarımcısı</h3>
          {staff.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20">
              {staff.length} kişi
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Sol Panel: Kontroller ─────────────────────── */}
          <div className="space-y-5">

            {/* Kişi ekleme */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Personel Ekle</p>
              <div className="flex gap-2 mb-2">
                <input
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addStaff()}
                  placeholder="Ad Soyad"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50"
                />
                <input
                  value={draftRole}
                  onChange={e => setDraftRole(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addStaff()}
                  placeholder="Görev"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50"
                />
                <button
                  onClick={addStaff}
                  disabled={!draftName.trim()}
                  className="px-3 py-2 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/30 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {staff.map(s => (
                  <div key={s.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/3 border border-white/6 text-xs">
                    <span className="flex-1 text-white truncate">{s.name}</span>
                    <span className="text-muted-foreground truncate">{s.role || "Organizasyon Ekibi"}</span>
                    <button onClick={() => removeStaff(s.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {staff.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 text-center py-1">Ad ve görev gir, Enter veya + ile ekle</p>
                )}
              </div>
            </div>

            {/* Renk Paleti */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Tema Rengi
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setConfig(prev => ({ ...prev, accentColor: c }))}
                    style={{ background: c }}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${config.accentColor === c ? "border-white scale-110" : "border-transparent"}`}
                  />
                ))}
                <label className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/20 cursor-pointer" title="Özel renk seç">
                  <span className="text-[10px] text-white absolute inset-0 flex items-center justify-center font-bold">+</span>
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={e => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Font Seçimi */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Yazı Tipi</p>
              <div className="flex gap-2">
                {FONTS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setConfig(prev => ({ ...prev, fontFamily: f.value }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      config.fontFamily === f.value
                        ? "bg-brand-indigo/30 border-brand-indigo/50 text-white"
                        : "border-white/10 text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Boyutları */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Yazı Boyutları & Konumlar</p>
              {([
                { id: "name" as const, label: "Ad Soyad", el: nameEl },
                { id: "role" as const, label: "Görev",    el: roleEl },
                { id: "sub"  as const, label: "Etiket",   el: subEl  },
              ]).map(({ id, label, el }) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{label}</span>
                  <span className="text-xs text-muted-foreground/60 w-8 text-right flex-shrink-0">{el.fontSize}pt</span>
                  <input
                    type="range" min={6} max={24} value={el.fontSize}
                    onChange={e => updateElement(id, { fontSize: Number(e.target.value) })}
                    className="flex-1 accent-brand-indigo-light h-1"
                  />
                  <button
                    onClick={() => updateElement(id, { bold: !el.bold })}
                    className={`text-xs px-1.5 py-0.5 rounded font-bold border transition-colors ${
                      el.bold ? "bg-white/15 border-white/30 text-white" : "border-white/8 text-muted-foreground"
                    }`}
                  >B</button>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/50">Sağ taraftaki önizlemede elementleri sürükleyerek yeniden konumlandır</p>
            </div>

            {/* İndir butonu */}
            <button
              onClick={downloadStaffPDF}
              disabled={genPending || staff.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-cyan/15 border border-brand-cyan/30 text-brand-cyan font-medium text-sm hover:bg-brand-cyan/25 transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              {staff.length === 0 ? "Önce personel ekle" : `Personel PDF İndir (${staff.length} kişi)`}
            </button>
          </div>

          {/* ── Sağ Panel: Canlı Önizleme ──────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5" /> Canlı Önizleme — elementleri sürükle
            </p>
            <BadgePreview
              eventName={eventName}
              nameText={previewName}
              roleText={previewRole}
              subText="PERSONEL"
              config={config}
              dragging={dragging}
              onDragStart={setDragging}
              previewRef={previewRef}
            />
            <p className="text-[10px] text-muted-foreground/50 text-center">
              Mavi çerçeveli elementi sürükleyerek konumunu ayarla · Önizleme ilk kişiyi gösterir
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── Firma Çalışan Yönetimi ───────────────────────── */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-brand-indigo-light" />
          <h3 className="font-semibold text-white">Firma Yaka Kartları</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-indigo/20 text-brand-indigo-light border border-brand-indigo/30">
            {exhibitors.length} firma
          </span>
        </div>

        {exhibitors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Bu fuarda kayıtlı firma yok.</p>
        ) : (
          <div className="space-y-2">
            {exhibitors.map(ex => {
              const employees = companyEmployees[ex.id] ?? [];
              const input     = draftInputs[ex.id] ?? { name: "", role: "" };
              const isOpen    = expandedId === ex.id;

              return (
                <div key={ex.id} className="rounded-xl border border-white/8 overflow-hidden">
                  {/* Accordion Header */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : ex.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 bg-white/3 hover:bg-white/5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3 h-3 text-brand-indigo-light" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium text-white">{ex.company_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">Stant: {boothCode(ex.id, halls)}</span>
                    </div>
                    {employees.length > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 flex-shrink-0">
                        {employees.length} çalışan
                      </span>
                    )}
                    {employees.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadCompanyPDF(ex.id, ex.company_name); }}
                        disabled={genPending}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-brand-indigo/20 border border-brand-indigo/30 text-brand-indigo-light hover:bg-brand-indigo/30 transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>

                  {/* Accordion Body */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
                      >
                        <div className="px-3 py-3 space-y-2 border-t border-white/6">
                          {employees.map(emp => (
                            <div key={emp.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/3 border border-white/6 text-xs">
                              <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="flex-1 text-white truncate">{emp.name}</span>
                              <span className="text-muted-foreground truncate">{emp.role || "Firma Temsilcisi"}</span>
                              <button onClick={() => removeEmployee(ex.id, emp.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors flex-shrink-0">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {/* Add employee form */}
                          <div className="flex gap-2 pt-1">
                            <input
                              value={input.name}
                              onChange={e => setDraftInputs(prev => ({ ...prev, [ex.id]: { ...input, name: e.target.value } }))}
                              onKeyDown={e => e.key === "Enter" && addEmployee(ex.id)}
                              placeholder="Ad Soyad"
                              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-indigo/50"
                            />
                            <input
                              value={input.role}
                              onChange={e => setDraftInputs(prev => ({ ...prev, [ex.id]: { ...input, role: e.target.value } }))}
                              onKeyDown={e => e.key === "Enter" && addEmployee(ex.id)}
                              placeholder="Görev (ör. Satış Temsilcisi)"
                              className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-indigo/50"
                            />
                            <button
                              onClick={() => addEmployee(ex.id)}
                              disabled={!input.name?.trim()}
                              className="px-2.5 py-1.5 rounded-lg bg-brand-indigo/20 border border-brand-indigo/30 text-brand-indigo-light hover:bg-brand-indigo/30 transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ─── Tümünü İndir ─────────────────────────────────── */}
      {totalBadges > 0 && (
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            variant="gradient"
            className="w-full gap-2"
            onClick={downloadAll}
            disabled={genPending}
          >
            <Printer className="w-4 h-4" />
            {genPending ? "PDF Oluşturuluyor..." : `Tümünü İndir — ${totalBadges} yaka kartı`}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            A4 sayfaya 2×4 = 8 yaka kartı · Tasarım şablonu tüm kartlara uygulanır
          </p>
        </motion.div>
      )}
    </div>
  );
}
