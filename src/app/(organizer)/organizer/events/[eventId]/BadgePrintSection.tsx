"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, User, Plus, Trash2, Download, Printer, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Exhibitor { id: string; company_name: string }
interface BoothRow   { id: string; code: string; exhibitor_id: string | null }
interface HallRow    { id: string; name: string; booths: BoothRow[] }
interface StaffRow   { id: string; name: string; role: string }

interface Props {
  eventName: string;
  exhibitors: Exhibitor[];
  halls: HallRow[];
}

function boothCode(exhibitorId: string, halls: HallRow[]): string {
  for (const h of halls) {
    const b = h.booths.find(b => b.exhibitor_id === exhibitorId);
    if (b) return b.code;
  }
  return "—";
}

async function generateBadgePDF(
  items: { line1: string; line2: string; sub: string }[],
  eventName: string,
  filename: string,
  accentHex: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const cols = 2;
  const rows = 4;
  const bW = 88;    // badge width mm
  const bH = 58;    // badge height mm
  const gX = 7;     // gap x
  const gY = 6;     // gap y
  const marginL = (pageW - cols * bW - (cols - 1) * gX) / 2;
  const marginT = 12;

  const r = parseInt(accentHex.slice(1, 3), 16);
  const g = parseInt(accentHex.slice(3, 5), 16);
  const b = parseInt(accentHex.slice(5, 7), 16);

  items.forEach((item, i) => {
    const page = Math.floor(i / (cols * rows));
    const pos  = i % (cols * rows);
    const col  = pos % cols;
    const row  = Math.floor(pos / cols);

    if (pos === 0 && i > 0) doc.addPage();

    const x = marginL + col * (bW + gX);
    const y = marginT + row * (bH + gY);

    // Badge border
    doc.setDrawColor(220, 220, 230);
    doc.setFillColor(250, 250, 255);
    doc.roundedRect(x, y, bW, bH, 4, 4, "FD");

    // Color top bar
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, y, bW, 10, 4, 4, "F");
    doc.setFillColor(r, g, b);
    doc.rect(x, y + 6, bW, 4, "F");

    // Event name in bar
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(eventName.slice(0, 40), x + bW / 2, y + 6.5, { align: "center" });

    // Main name
    doc.setFontSize(13);
    doc.setTextColor(20, 20, 40);
    doc.setFont("helvetica", "bold");
    const nameLine = item.line1.length > 24 ? item.line1.slice(0, 22) + "…" : item.line1;
    doc.text(nameLine, x + bW / 2, y + 22, { align: "center" });

    // Line 2
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    doc.setFont("helvetica", "normal");
    const l2 = item.line2.length > 32 ? item.line2.slice(0, 30) + "…" : item.line2;
    doc.text(l2, x + bW / 2, y + 30, { align: "center" });

    // Sub (booth code or role)
    if (item.sub) {
      doc.setFontSize(8);
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.text(item.sub, x + bW / 2, y + 38, { align: "center" });
    }

    // Bottom divider + branding
    doc.setDrawColor(220, 220, 235);
    doc.line(x + 6, y + bH - 9, x + bW - 6, y + bH - 9);
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 180);
    doc.setFont("helvetica", "normal");
    doc.text("BasExpo — Akıllı Fuar Sistemi", x + bW / 2, y + bH - 4, { align: "center" });
  });

  doc.save(filename);
}

export function BadgePrintSection({ eventName, exhibitors, halls }: Props) {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [name, setName]   = useState("");
  const [role, setRole]   = useState("");
  const [genPending, setGenPending] = useState(false);

  function addStaff() {
    if (!name.trim()) return;
    setStaff(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), role: role.trim() }]);
    setName(""); setRole("");
  }
  function removeStaff(id: string) { setStaff(prev => prev.filter(s => s.id !== id)); }

  async function downloadFirmaBadges() {
    setGenPending(true);
    const items = exhibitors.map(ex => ({
      line1: ex.company_name,
      line2: "Katılımcı Firma",
      sub: `Stant: ${boothCode(ex.id, halls)}`,
    }));
    await generateBadgePDF(items, eventName, `${eventName}_firma_yaka.pdf`, "#4f46e5");
    setGenPending(false);
  }

  async function downloadPersonelBadges() {
    if (!staff.length) return;
    setGenPending(true);
    const items = staff.map(s => ({
      line1: s.name,
      line2: s.role || "Organizasyon Ekibi",
      sub: "PERSONEL",
    }));
    await generateBadgePDF(items, eventName, `${eventName}_personel_yaka.pdf`, "#0891b2");
    setGenPending(false);
  }

  async function downloadAllBadges() {
    setGenPending(true);
    const firmaItems = exhibitors.map(ex => ({
      line1: ex.company_name,
      line2: "Katılımcı Firma",
      sub: `Stant: ${boothCode(ex.id, halls)}`,
    }));
    const staffItems = staff.map(s => ({
      line1: s.name,
      line2: s.role || "Organizasyon Ekibi",
      sub: "PERSONEL",
    }));
    const all = [...firmaItems, ...staffItems];
    if (all.length) await generateBadgePDF(all, eventName, `${eventName}_tum_yaka.pdf`, "#4f46e5");
    setGenPending(false);
  }

  return (
    <div className="space-y-6">

      {/* Firma Yaka Kartları */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-indigo-light" />
            <h3 className="font-semibold text-white">Firma Yaka Kartları</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-indigo/20 text-brand-indigo-light border border-brand-indigo/30">
              {exhibitors.length} firma
            </span>
          </div>
          <button
            onClick={downloadFirmaBadges}
            disabled={genPending || exhibitors.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-indigo/20 border border-brand-indigo/30 text-brand-indigo-light hover:bg-brand-indigo/30 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> PDF İndir
          </button>
        </div>

        {exhibitors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Bu fuarda kayıtlı firma yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {exhibitors.map(ex => (
              <div key={ex.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8">
                <div className="w-8 h-8 rounded-lg bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-brand-indigo-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ex.company_name}</p>
                  <p className="text-xs text-muted-foreground">Stant: {boothCode(ex.id, halls)}</p>
                </div>
                <BadgeCheck className="w-4 h-4 text-green-400/60 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Personel Yaka Kartları */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl border border-white/8 p-5">
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
              onClick={downloadPersonelBadges}
              disabled={genPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-cyan/15 border border-brand-cyan/25 text-brand-cyan hover:bg-brand-cyan/25 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> PDF İndir
            </button>
          )}
        </div>

        {/* Form */}
        <div className="flex gap-2 mb-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addStaff()}
            placeholder="Ad Soyad"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50"
          />
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addStaff()}
            placeholder="Görev (ör. Kapı Görevlisi)"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan/50"
          />
          <button
            onClick={addStaff}
            disabled={!name.trim()}
            className="px-3 py-2 rounded-xl bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/30 transition-colors disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {staff.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">Ad ve görev girerek personel ekle.</p>
        ) : (
          <div className="space-y-2">
            {staff.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8">
                <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-brand-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.role || "Organizasyon Ekibi"}</p>
                </div>
                <button onClick={() => removeStaff(s.id)} className="text-muted-foreground/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tümünü İndir */}
      {(exhibitors.length > 0 || staff.length > 0) && (
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}>
          <Button
            variant="gradient"
            className="w-full gap-2"
            onClick={downloadAllBadges}
            disabled={genPending}
          >
            <Printer className="w-4 h-4" />
            {genPending ? "PDF Oluşturuluyor..." : `Tümünü İndir (${exhibitors.length + staff.length} yaka kartı)`}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            A4 sayfaya 8 yaka kartı / sayfa · PDF indirilir, yazıcıdan basılır
          </p>
        </motion.div>
      )}
    </div>
  );
}
