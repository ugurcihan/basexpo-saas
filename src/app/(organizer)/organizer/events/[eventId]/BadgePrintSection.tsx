"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, User, Plus, Trash2, Download, Printer,
  ChevronDown, ChevronRight, Palette, ImagePlus, X as XIcon, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";

/* ─── Types ────────────────────────────────────────────────── */
interface Exhibitor  { id: string; company_name: string }
interface BoothRow   { id: string; code: string; exhibitor_id: string | null }
interface HallRow    { id: string; name: string; booths: BoothRow[] }
interface StaffRow   { id: string; name: string; role: string }
interface Employee   { id: string; name: string; role: string }

interface BadgeElement {
  id: "name" | "role" | "sub";
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
}

interface BadgeConfig {
  templateId: string;
  accentColor: string;
  fontFamily: string;
  elements: BadgeElement[];
}

interface Props { eventName: string; exhibitors: Exhibitor[]; halls: HallRow[] }

/* ─── Templates ─────────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: "modern",
    label: "Modern",
    preview: "linear-gradient(135deg,#4f46e5,#7c3aed)",
    headerBg: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)",
    headerText: "#fff",
    bodyBg: "#ffffff",
    bodyText: "#1a1a2e",
    subText: "#4f46e5",
    border: "2px solid #e5e7eb",
    borderRadius: "12px",
    fontFamily: "'Inter',Arial,sans-serif",
    accentColor: "#4f46e5",
  },
  {
    id: "kurumsal",
    label: "Kurumsal",
    preview: "linear-gradient(135deg,#1e3a5f,#2563eb)",
    headerBg: "linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)",
    headerText: "#fff",
    bodyBg: "#f8fafc",
    bodyText: "#1e293b",
    subText: "#1e3a5f",
    border: "2px solid #cbd5e1",
    borderRadius: "6px",
    fontFamily: "Georgia,'Times New Roman',serif",
    accentColor: "#1e3a5f",
  },
  {
    id: "minimal",
    label: "Minimalist",
    preview: "#f1f5f9",
    headerBg: "#f1f5f9",
    headerText: "#334155",
    bodyBg: "#ffffff",
    bodyText: "#334155",
    subText: "#64748b",
    border: "1.5px solid #e2e8f0",
    borderRadius: "8px",
    fontFamily: "'Helvetica Neue',Arial,sans-serif",
    accentColor: "#64748b",
  },
  {
    id: "canlı",
    label: "Canlı",
    preview: "linear-gradient(135deg,#059669,#0891b2)",
    headerBg: "linear-gradient(135deg,#059669 0%,#0891b2 100%)",
    headerText: "#fff",
    bodyBg: "#f0fdf4",
    bodyText: "#065f46",
    subText: "#059669",
    border: "2px solid #a7f3d0",
    borderRadius: "16px",
    fontFamily: "'Inter',Arial,sans-serif",
    accentColor: "#059669",
  },
  {
    id: "koyu",
    label: "Koyu",
    preview: "linear-gradient(135deg,#0f172a,#1e293b)",
    headerBg: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)",
    headerText: "#e2e8f0",
    bodyBg: "#0f172a",
    bodyText: "#e2e8f0",
    subText: "#f59e0b",
    border: "1px solid #334155",
    borderRadius: "10px",
    fontFamily: "'Inter',Arial,sans-serif",
    accentColor: "#f59e0b",
  },
] as const;

type TemplateId = typeof TEMPLATES[number]["id"];

const DEFAULT_ELEMENTS: BadgeElement[] = [
  { id: "name", x: 50, y: 40, fontSize: 15, bold: true  },
  { id: "role", x: 50, y: 57, fontSize: 10, bold: false },
  { id: "sub",  x: 50, y: 71, fontSize:  9, bold: true  },
];

/* ─── Helpers ─────────────────────────────────────────────── */
function boothCode(exhibitorId: string | null, halls: HallRow[]): string {
  if (!exhibitorId) return "—";
  for (const h of halls) {
    const b = h.booths.find(b => b.exhibitor_id === exhibitorId);
    if (b) return b.code;
  }
  return "—";
}

/* ─── BadgeHTML component — rendered inside hidden capture div ─ */
function BadgeHTML({
  template, eventName, mainLine, subLine, subLabel, logoUrl, elements,
}: {
  template: typeof TEMPLATES[number];
  eventName: string;
  mainLine: string;
  subLine: string;
  subLabel: string;
  logoUrl: string | null;
  elements: BadgeElement[];
}) {
  const nameEl = elements.find(e => e.id === "name")!;
  const roleEl = elements.find(e => e.id === "role")!;
  const subEl  = elements.find(e => e.id === "sub")!;

  return (
    <div style={{
      width: 352, height: 232,
      background: template.bodyBg,
      border: template.border,
      borderRadius: template.borderRadius,
      fontFamily: template.fontFamily,
      overflow: "hidden",
      position: "relative",
      boxSizing: "border-box",
    }}>
      {/* Header bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "20%",
        background: template.headerBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "0 12px",
      }}>
        {logoUrl && (
          <img src={logoUrl} alt="logo" style={{ height: 22, objectFit: "contain", maxWidth: 40 }} crossOrigin="anonymous" />
        )}
        <span style={{
          fontSize: 9, fontWeight: 700, color: template.headerText,
          letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%",
        }}>
          {eventName}
        </span>
      </div>

      {/* Draggable text elements */}
      {[
        { el: nameEl, text: mainLine || "Ad Soyad", color: template.bodyText },
        { el: roleEl, text: subLine  || "Görev / Unvan", color: template.bodyText },
        { el: subEl,  text: subLabel || "PERSONEL", color: template.subText },
      ].map(({ el, text, color }) => (
        <div key={el.id} style={{
          position: "absolute",
          left: `${el.x}%`, top: `${el.y}%`,
          transform: "translate(-50%,-50%)",
          fontSize: el.fontSize,
          fontWeight: el.bold ? 700 : 400,
          color,
          whiteSpace: "nowrap",
          maxWidth: "90%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center",
        }}>
          {text}
        </div>
      ))}

      {/* Bottom divider + branding */}
      <div style={{
        position: "absolute", bottom: "12%", left: "5%", right: "5%",
        borderTop: `1px solid ${template.id === "koyu" ? "#334155" : "#e2e8f0"}`,
      }} />
      <div style={{
        position: "absolute", bottom: "3%", left: 0, right: 0,
        textAlign: "center", fontSize: 7, color: template.id === "koyu" ? "#475569" : "#94a3b8",
      }}>
        BasExpo — Akıllı Fuar Sistemi
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export function BadgePrintSection({ eventName, exhibitors, halls }: Props) {
  /* -- Template & design state -- */
  const [templateId, setTemplateId] = useState<TemplateId>("modern");
  const [elements, setElements]     = useState<BadgeElement[]>(DEFAULT_ELEMENTS);
  const [logoUrl, setLogoUrl]       = useState<string | null>(null);

  /* -- Personel state -- */
  const [staff, setStaff]       = useState<StaffRow[]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState("");

  /* -- Firma çalışan state -- */
  const [companyEmployees, setCompanyEmployees] = useState<Record<string, Employee[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftInputs, setDraftInputs] = useState<Record<string, { name: string; role: string }>>({});

  /* -- Drag state -- */
  const [dragging, setDragging] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null!);

  /* -- PDF gen -- */
  const [genPending, setGenPending] = useState(false);
  const [captureData, setCaptureData] = useState({ name: "", role: "", sub: "" });
  const captureRef = useRef<HTMLDivElement>(null!);

  const template = TEMPLATES.find(t => t.id === templateId) ?? TEMPLATES[0];

  /* ── Drag: window listeners ─────────────────────────────── */
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const x = Math.max(5, Math.min(95, (e.clientX - rect.left) / rect.width * 100));
      const y = Math.max(22, Math.min(82, (e.clientY - rect.top) / rect.height * 100));
      setElements(prev => prev.map(el => el.id === dragging ? { ...el, x, y } : el));
    };
    const up = () => setDragging(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  function updateEl(id: BadgeElement["id"], patch: Partial<BadgeElement>) {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...patch } : el));
  }

  /* ── Logo upload ────────────────────────────────────────── */
  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoUrl(ev.target?.result as string);
    reader.readAsDataURL(f);
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

  /* ── HTML2Canvas PDF generation ─────────────────────────── */
  async function generatePDF(
    items: { name: string; role: string; sub: string }[],
    filename: string
  ) {
    if (!items.length || !captureRef.current) return;
    setGenPending(true);

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const bW = 88, bH = 58;
    const cols = 2, rows = 4;
    const gX = 7, gY = 6;
    const marginL = (pageW - cols * bW - (cols - 1) * gX) / 2;
    const marginT = 12;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setCaptureData({ name: item.name, role: item.role, sub: item.sub });
      await new Promise(r => setTimeout(r, 120)); // React re-render

      const canvas = await html2canvas(captureRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");

      const pos = i % (cols * rows);
      const col = pos % cols;
      const row = Math.floor(pos / cols);
      if (pos === 0 && i > 0) doc.addPage();

      const x = marginL + col * (bW + gX);
      const y = marginT  + row * (bH + gY);
      doc.addImage(imgData, "PNG", x, y, bW, bH);
    }

    doc.save(filename);
    setGenPending(false);
  }

  async function downloadStaffPDF() {
    await generatePDF(
      staff.map(s => ({ name: s.name, role: s.role || "Organizasyon Ekibi", sub: "PERSONEL" })),
      `${eventName}_personel_yaka.pdf`
    );
  }

  async function downloadCompanyPDF(exhibitorId: string, companyName: string) {
    const employees = companyEmployees[exhibitorId] ?? [];
    if (!employees.length) return;
    await generatePDF(
      employees.map(e => ({ name: companyName, role: e.name, sub: e.role || "Firma Temsilcisi" })),
      `${companyName}_yaka.pdf`
    );
  }

  async function downloadAll() {
    const items: { name: string; role: string; sub: string }[] = [];
    exhibitors.forEach(ex => {
      (companyEmployees[ex.id] ?? []).forEach(e =>
        items.push({ name: ex.company_name, role: e.name, sub: e.role || "Firma Temsilcisi" })
      );
    });
    staff.forEach(s => items.push({ name: s.name, role: s.role || "Organizasyon Ekibi", sub: "PERSONEL" }));
    if (items.length) await generatePDF(items, `${eventName}_tum_yaka.pdf`);
  }

  /* ── Preview sample ─────────────────────────────────────── */
  const previewName = staff[0]?.name || draftName || "Ahmet Yılmaz";
  const previewRole = staff[0]?.role || draftRole || "Organizasyon Ekibi";
  const nameEl = elements.find(e => e.id === "name")!;
  const roleEl = elements.find(e => e.id === "role")!;
  const subEl  = elements.find(e => e.id === "sub")!;

  const totalBadges = staff.length + Object.values(companyEmployees).reduce((s, arr) => s + arr.length, 0);

  /* ───────────────────────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Gizli capture div (html2canvas için) ───────────── */}
      <div style={{ position: "fixed", left: -9999, top: 0, zIndex: -1, pointerEvents: "none" }}>
        <div ref={captureRef}>
          <BadgeHTML
            template={template}
            eventName={eventName}
            mainLine={captureData.name}
            subLine={captureData.role}
            subLabel={captureData.sub}
            logoUrl={logoUrl}
            elements={elements}
          />
        </div>
      </div>

      {/* ── Tasarım Editörü ──────────────────────────────── */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-5 h-5 text-brand-violet" />
          <h3 className="font-semibold text-white">Yaka Kartı Tasarımcısı</h3>
          {genPending && (
            <span className="flex items-center gap-1.5 text-xs text-brand-cyan">
              <Loader2 className="w-3 h-3 animate-spin" /> PDF oluşturuluyor...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Sol Panel ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Şablon Seçici */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Şablon Seç</p>
              <div className="flex gap-2 flex-wrap">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTemplateId(t.id);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                      templateId === t.id ? "border-white/40 bg-white/10 scale-105" : "border-white/8 hover:border-white/20"
                    }`}
                  >
                    <div
                      className="w-12 h-8 rounded-lg"
                      style={{ background: t.preview }}
                    />
                    <span className="text-[10px] text-muted-foreground">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Logo (İsteğe Bağlı)</p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/8 transition-colors text-xs text-muted-foreground">
                  <ImagePlus className="w-3.5 h-3.5" />
                  {logoUrl ? "Değiştir" : "Logo Yükle"}
                  <input type="file" accept="image/*" onChange={handleLogo} className="sr-only" />
                </label>
                {logoUrl && (
                  <div className="flex items-center gap-2">
                    <img src={logoUrl} alt="logo" className="h-8 object-contain rounded" />
                    <button onClick={() => setLogoUrl(null)} className="text-muted-foreground/60 hover:text-red-400 transition-colors">
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Font Boyutları + Drag */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Yazı Boyutları</p>
              {([
                { id: "name" as const, label: "Ad Soyad", el: nameEl },
                { id: "role" as const, label: "Görev",    el: roleEl },
                { id: "sub"  as const, label: "Etiket",   el: subEl  },
              ]).map(({ id, label, el }) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{label}</span>
                  <span className="text-xs text-muted-foreground/60 w-8 text-right flex-shrink-0">{el.fontSize}pt</span>
                  <input
                    type="range" min={6} max={22} value={el.fontSize}
                    onChange={e => updateEl(id, { fontSize: Number(e.target.value) })}
                    className="flex-1 accent-brand-indigo-light h-1"
                  />
                  <button
                    onClick={() => updateEl(id, { bold: !el.bold })}
                    className={`text-xs px-1.5 py-0.5 rounded font-bold border transition-colors flex-shrink-0 ${
                      el.bold ? "bg-white/15 border-white/30 text-white" : "border-white/8 text-muted-foreground"
                    }`}
                  >B</button>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/50">Sağdaki önizlemede metinleri sürükleyerek yerini değiştir</p>
            </div>
          </div>

          {/* ── Sağ Panel: Canlı Önizleme ────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Canlı Önizleme — sürükle &amp; bırak</p>

            {/* Preview badge */}
            <div
              ref={previewRef}
              style={{
                position: "relative", width: "100%", aspectRatio: "88/58",
                background: template.bodyBg,
                border: template.border,
                borderRadius: template.borderRadius,
                overflow: "hidden",
                userSelect: dragging ? "none" : undefined,
                cursor: dragging ? "grabbing" : undefined,
                fontFamily: template.fontFamily,
              }}
              className="shadow-xl"
            >
              {/* Header */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "20%",
                background: template.headerBg,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "0 10px",
              }}>
                {logoUrl && <img src={logoUrl} alt="logo" style={{ height: 18, objectFit: "contain", maxWidth: 36 }} />}
                <span style={{
                  fontSize: "8px", fontWeight: 700, color: template.headerText,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {eventName}
                </span>
              </div>

              {/* Draggable elements */}
              {([
                { el: nameEl, text: previewName, color: template.bodyText },
                { el: roleEl, text: previewRole, color: template.bodyText },
                { el: subEl,  text: "PERSONEL",  color: template.subText  },
              ]).map(({ el, text, color }) => (
                <div
                  key={el.id}
                  style={{
                    position: "absolute",
                    left: `${el.x}%`, top: `${el.y}%`,
                    transform: "translate(-50%,-50%)",
                    fontSize: el.fontSize,
                    fontWeight: el.bold ? 700 : 400,
                    color,
                    cursor: dragging === el.id ? "grabbing" : "grab",
                    padding: "2px 4px",
                    borderRadius: 3,
                    background: dragging === el.id ? "rgba(99,102,241,0.12)" : "transparent",
                    outline: dragging === el.id ? "1.5px solid #6366f1" : "none",
                    whiteSpace: "nowrap", maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis",
                  }}
                  onMouseDown={e => { e.preventDefault(); setDragging(el.id); }}
                >
                  {text}
                </div>
              ))}

              {/* Bottom */}
              <div style={{ position: "absolute", bottom: "12%", left: "5%", right: "5%", borderTop: "1px solid #e2e8f0" }} />
              <div style={{ position: "absolute", bottom: "3%", left: 0, right: 0, textAlign: "center", fontSize: 7, color: "#94a3b8" }}>
                BasExpo — Akıllı Fuar Sistemi
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              Bu şablon tüm yaka kartlarına uygulanır · Önizleme = PDF çıktısı (WYSIWYG)
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Personel Listesi ─────────────────────────────── */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.04 }} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-semibold text-white">Personel Yaka Kartları</h3>
            {staff.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20">
                {staff.length} kişi
              </span>
            )}
          </div>
          {staff.length > 0 && (
            <button
              onClick={downloadStaffPDF}
              disabled={genPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-cyan/15 border border-brand-cyan/25 text-brand-cyan hover:bg-brand-cyan/25 transition-colors disabled:opacity-50"
            >
              {genPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              PDF İndir
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-3">
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

        {staff.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 text-center py-2">Ad ve görev girerek personel ekle</p>
        ) : (
          <div className="space-y-1.5">
            {staff.map(s => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/6 text-xs">
                <span className="flex-1 text-white font-medium truncate">{s.name}</span>
                <span className="text-muted-foreground truncate">{s.role || "Organizasyon Ekibi"}</span>
                <button onClick={() => removeStaff(s.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Firma Çalışan Yönetimi ───────────────────────── */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.07 }} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-brand-indigo-light" />
          <h3 className="font-semibold text-white">Firma Yaka Kartları</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-indigo/20 text-brand-indigo-light border border-brand-indigo/30">
            {exhibitors.length} firma
          </span>
        </div>

        {exhibitors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Kayıtlı firma yok.</p>
        ) : (
          <div className="space-y-2">
            {exhibitors.map(ex => {
              const employees = companyEmployees[ex.id] ?? [];
              const input     = draftInputs[ex.id] ?? { name: "", role: "" };
              const isOpen    = expandedId === ex.id;

              return (
                <div key={ex.id} className="rounded-xl border border-white/8 overflow-hidden">
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
                        {employees.length}
                      </span>
                    )}
                    {employees.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadCompanyPDF(ex.id, ex.company_name); }}
                        disabled={genPending}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-brand-indigo/20 border border-brand-indigo/30 text-brand-indigo-light hover:bg-brand-indigo/30 transition-colors disabled:opacity-50 flex-shrink-0"
                      >
                        {genPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} PDF
                      </button>
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                        transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}
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
                              placeholder="Görev"
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

      {/* ── Tümünü İndir ─────────────────────────────────── */}
      {totalBadges > 0 && (
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}>
          <Button variant="gradient" className="w-full gap-2" onClick={downloadAll} disabled={genPending}>
            {genPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {genPending ? "PDF Oluşturuluyor..." : `Tümünü İndir — ${totalBadges} yaka kartı`}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Seçili şablon tüm kartlara uygulanır · A4 sayfaya 2×4 = 8 kart · Türkçe karakterler desteklenir
          </p>
        </motion.div>
      )}
    </div>
  );
}
