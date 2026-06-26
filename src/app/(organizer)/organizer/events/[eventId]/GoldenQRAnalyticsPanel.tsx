"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Star, QrCode, Trophy, Download, Loader2, Check, X, FileSpreadsheet } from "lucide-react";
import { getEventQRStats, updateGoldenQRLimit } from "@/features/events/goldenQRActions";

type Stats = NonNullable<Awaited<ReturnType<typeof getEventQRStats>>>;

interface Props { eventId: string }

function LimitEditor({ id, current, onSaved }: { id: string; current: number | null; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current?.toString() ?? "");
  const [isPending, startTransition] = useTransition();

  function save() {
    const num = value === "" ? null : parseInt(value);
    if (value !== "" && (isNaN(num!) || num! < 1)) return;
    startTransition(async () => {
      await updateGoldenQRLimit(id, num);
      setEditing(false);
      onSaved();
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-xs px-2 py-0.5 rounded-lg border border-white/10 text-muted-foreground hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
      >
        {current ? `Limit: ${current}` : "Limit Yok"} ✎
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type="number"
        min={1}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        placeholder="∞"
        className="w-16 px-2 py-0.5 rounded-lg bg-white/8 border border-brand-gold/40 text-xs text-white focus:outline-none"
      />
      <button onClick={save} disabled={isPending} className="text-green-400 hover:text-green-300 disabled:opacity-50">
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>
      <button onClick={() => setEditing(false)} className="text-muted-foreground/60 hover:text-red-400">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function GoldenQRAnalyticsPanel({ eventId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"scans" | "golden">("scans");

  async function load() {
    setLoading(true);
    const data = await getEventQRStats(eventId);
    setStats(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [eventId]);

  async function downloadExcel() {
    if (!stats?.leaderboard.length) return;
    const { utils, writeFile } = await import("xlsx");
    const ws = utils.json_to_sheet(stats.leaderboard.map(r => ({
      "Sıra": r.rank,
      "Ad Soyad": r.visitorName,
      "E-posta": r.email,
      "Ziyaret Edilen Stant": r.totalScans,
    })));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sıralama");
    writeFile(wb, `${eventId}_qr_siralama.xlsx`);
  }

  async function downloadPDF() {
    if (!stats?.leaderboard.length) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("QR Tarama Siralamasi", 15, 20);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 140);
    doc.text(`Normal QR: ${stats.normalQRTotal} | Altin QR: ${stats.goldenTotal}`, 15, 28);

    let y = 38;
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 40);
    doc.setFont("helvetica", "bold");
    doc.text("#", 15, y); doc.text("Ad Soyad", 25, y); doc.text("Stant", 140, y); doc.text("Tarama", 165, y);
    y += 2;
    doc.setDrawColor(200, 200, 220);
    doc.line(15, y, 195, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    for (const r of stats.leaderboard) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(String(r.rank), 15, y);
      doc.text(r.visitorName.slice(0, 40), 25, y);
      doc.text(String(r.totalScans), 165, y);
      y += 6;
    }
    doc.save(`${eventId}_qr_siralama.pdf`);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">QR istatistikleri yükleniyor...</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-4">

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl border border-brand-gold/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-brand-gold fill-brand-gold" />
            <span className="text-xs font-medium text-brand-gold">Altın QR Taraması</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.goldenTotal}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stats.goldenQRs.length} aktif altın QR</p>
        </div>
        <div className="glass rounded-xl border border-brand-indigo/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <QrCode className="w-4 h-4 text-brand-indigo-light" />
            <span className="text-xs font-medium text-brand-indigo-light">Normal QR Taraması</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.normalQRTotal}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tüm stant ziyaretleri</p>
        </div>
      </div>

      {/* Altın QR listesi */}
      {stats.goldenQRs.length > 0 && (
        <div className="glass rounded-xl border border-brand-gold/15 p-4">
          <p className="text-xs font-semibold text-brand-gold mb-3 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-brand-gold" /> Altın QR Kodları — Limit Yönetimi
          </p>
          <div className="space-y-2">
            {stats.goldenQRs.map(qr => (
              <div key={qr.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-gold/5 border border-brand-gold/10">
                <Star className="w-3.5 h-3.5 text-brand-gold fill-brand-gold flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{qr.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {qr.scanCount} tarama
                    {qr.scan_limit ? ` / ${qr.scan_limit} (${Math.round(qr.scanCount / qr.scan_limit * 100)}%)` : ""}
                    {!qr.is_active && " · Pasif"}
                  </p>
                  {qr.scan_limit && (
                    <div className="w-full bg-white/8 rounded-full h-1 mt-1.5">
                      <div
                        className="bg-brand-gold rounded-full h-1"
                        style={{ width: `${Math.min(100, qr.scanCount / qr.scan_limit * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <LimitEditor id={qr.id} current={qr.scan_limit} onSaved={load} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {stats.leaderboard.length > 0 && (
        <div className="glass rounded-xl border border-white/8 p-4">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-brand-gold" /> En Çok QR Tayan Ziyaretçiler
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadExcel}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors"
              >
                <FileSpreadsheet className="w-3 h-3" /> Excel
              </button>
              <button
                onClick={downloadPDF}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-brand-indigo/30 text-brand-indigo-light bg-brand-indigo/10 hover:bg-brand-indigo/20 transition-colors"
              >
                <Download className="w-3 h-3" /> PDF
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {stats.leaderboard.map(r => (
              <div key={r.rank} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-white/6 text-xs">
                <span className={`w-6 text-center font-bold flex-shrink-0 ${r.rank <= 3 ? "text-brand-gold" : "text-muted-foreground"}`}>
                  #{r.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{r.visitorName}</p>
                  <p className="text-muted-foreground text-[10px] truncate">{r.email}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <QrCode className="w-3 h-3 text-muted-foreground" />
                  <span className="text-white font-semibold">{r.totalScans}</span>
                  <span className="text-muted-foreground">stant</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.leaderboard.length === 0 && stats.goldenQRs.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Bu fuar için henüz QR taraması kaydedilmemiş.</p>
        </div>
      )}
    </motion.div>
  );
}
