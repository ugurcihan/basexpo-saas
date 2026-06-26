"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { FileDown, FileSpreadsheet, FileText, Users, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEventRegistrantsWithCheckins, type RegistrantRow } from "@/features/events/checkinActions";
import type { EventStatus } from "@/types";

interface Props {
  eventId: string;
  eventTitle: string;
  eventStatus: EventStatus;
}

function fmtDate(str: string) {
  return new Date(str).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtTime(str: string) {
  return new Date(str).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(inAt: string, outAt: string | null) {
  if (!outAt) return "İçeride";
  const mins = Math.round((new Date(outAt).getTime() - new Date(inAt).getTime()) / 60000);
  return mins < 60 ? `${mins} dk` : `${Math.floor(mins / 60)} sa ${mins % 60} dk`;
}

function exportCSV(rows: RegistrantRow[], eventTitle: string) {
  const headers = ["Ad Soyad", "E-posta", "Bilet Kodu", "Kayıt Tarihi", "Durum", "Giriş Saati", "Çıkış Saati", "Süre"];
  const lines = rows.map(r => [
    r.full_name ?? "-",
    r.email,
    r.ticket_code ?? "-",
    fmtDate(r.registered_at),
    r.checked_in ? "Geldi" : "Gelmedi",
    r.checked_in_at ? fmtTime(r.checked_in_at) : "-",
    r.checked_out_at ? fmtTime(r.checked_out_at) : "-",
    r.checked_in_at ? fmtDuration(r.checked_in_at, r.checked_out_at) : "-",
  ]);
  const csv = [headers, ...lines]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventTitle.replace(/\s+/g, "_")}_kayitlar.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function exportExcel(rows: RegistrantRow[], eventTitle: string) {
  const XLSX = await import("xlsx");
  const wsData = [
    ["Ad Soyad", "E-posta", "Bilet Kodu", "Kayıt Tarihi", "Durum", "Giriş Saati", "Çıkış Saati", "Süre"],
    ...rows.map(r => [
      r.full_name ?? "-",
      r.email,
      r.ticket_code ?? "-",
      fmtDate(r.registered_at),
      r.checked_in ? "Geldi" : "Gelmedi",
      r.checked_in_at ? fmtTime(r.checked_in_at) : "-",
      r.checked_out_at ? fmtTime(r.checked_out_at) : "-",
      r.checked_in_at ? fmtDuration(r.checked_in_at, r.checked_out_at) : "-",
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Kayıtlar");
  XLSX.writeFile(wb, `${eventTitle.replace(/\s+/g, "_")}_kayitlar.xlsx`);
}

async function exportPDF(rows: RegistrantRow[], eventTitle: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(14);
  doc.text(`${eventTitle} — Giriş Kayıtları`, 14, 16);
  doc.setFontSize(9);
  doc.text(`Toplam: ${rows.length} kayıt · ${rows.filter(r => r.checked_in).length} katıldı`, 14, 23);

  const colWidths = [40, 50, 25, 22, 18, 20, 20, 18];
  const headers = ["Ad Soyad", "E-posta", "Bilet", "Kayıt Tarihi", "Durum", "Giriş", "Çıkış", "Süre"];
  let y = 32;

  // Header row
  doc.setFillColor(30, 30, 60);
  doc.setTextColor(200, 200, 255);
  doc.setFontSize(8);
  let x = 14;
  headers.forEach((h, i) => {
    doc.rect(x, y - 4, colWidths[i], 7, "F");
    doc.text(h, x + 1, y);
    x += colWidths[i];
  });

  doc.setTextColor(40, 40, 40);
  y += 6;

  rows.forEach((r, idx) => {
    if (y > 190) {
      doc.addPage();
      y = 16;
    }
    const bg = idx % 2 === 0 ? [248, 248, 255] : [255, 255, 255];
    doc.setFillColor(bg[0], bg[1], bg[2]);
    let rowX = 14;
    const cells = [
      (r.full_name ?? "-").slice(0, 22),
      r.email.slice(0, 28),
      (r.ticket_code ?? "-").slice(0, 12),
      fmtDate(r.registered_at),
      r.checked_in ? "Geldi ✓" : "Gelmedi",
      r.checked_in_at ? fmtTime(r.checked_in_at) : "-",
      r.checked_out_at ? fmtTime(r.checked_out_at) : "-",
      r.checked_in_at ? fmtDuration(r.checked_in_at, r.checked_out_at) : "-",
    ];
    cells.forEach((cell, i) => {
      doc.rect(rowX, y - 3.5, colWidths[i], 6, "F");
      doc.setTextColor(r.checked_in ? 30 : 120, 40, 40);
      if (i > 3) doc.setTextColor(60, 60, 60);
      doc.text(cell, rowX + 1, y);
      rowX += colWidths[i];
    });
    y += 6;
  });

  doc.save(`${eventTitle.replace(/\s+/g, "_")}_kayitlar.pdf`);
}

export function RegistrantsSection({ eventId, eventTitle, eventStatus }: Props) {
  const [rows, setRows] = useState<RegistrantRow[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const isFairEnded = eventStatus === "ended";

  function load() {
    startTransition(async () => {
      const data = await getEventRegistrantsWithCheckins(eventId);
      setRows(data);
    });
  }

  const attended  = (rows ?? []).filter(r => r.checked_in).length;
  const absent    = (rows ?? []).filter(r => !r.checked_in).length;
  const total     = (rows ?? []).length;

  return (
    <div className="space-y-4">
      {/* Üst bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? "animate-spin" : ""}`} />
            {rows === null ? "Kayıtları Yükle" : "Yenile"}
          </Button>
          {rows !== null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {total} kayıt
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {attended} geldi
              </span>
              {isFairEnded && (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle className="w-3.5 h-3.5" /> {absent} gelmedi
                </span>
              )}
            </div>
          )}
        </div>

        {rows !== null && rows.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => exportCSV(rows, eventTitle)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            >
              <FileText className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={() => exportExcel(rows, eventTitle)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-green-500/30 bg-green-500/10 hover:bg-green-500/15 text-green-400 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>
            <button
              onClick={() => exportPDF(rows, eventTitle)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-red-400 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        )}
      </div>

      {/* Tablo */}
      {rows === null ? (
        <div className="glass rounded-2xl border border-dashed border-white/15 p-10 flex flex-col items-center text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Kayıtları görmek için &quot;Kayıtları Yükle&quot; butonuna bas.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="glass rounded-2xl border border-white/8 p-8 text-center">
          <p className="text-muted-foreground text-sm">Bu fuara henüz kayıt yok.</p>
        </div>
      ) : (
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 overflow-hidden">
          {/* Mobil: kart listesi */}
          <div className="divide-y divide-white/5">
            {rows.map((r) => (
              <div key={r.registration_id} className="flex items-center gap-3 px-4 py-3">
                {/* Durum indikatörü */}
                <div className="flex-shrink-0">
                  {r.checked_in ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : isFairEnded ? (
                    <XCircle className="w-4 h-4 text-red-400/60" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </div>

                {/* Kişi bilgisi */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {r.full_name ?? r.email}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    {r.full_name && (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">{r.email}</span>
                    )}
                    {r.ticket_code && (
                      <span className="text-xs font-mono text-brand-cyan/70">{r.ticket_code}</span>
                    )}
                  </div>
                  {r.checked_in && r.checked_in_at && (
                    <p className="text-xs text-green-400/80 mt-0.5">
                      Giriş: {fmtTime(r.checked_in_at)}
                      {r.checked_out_at && ` · Çıkış: ${fmtTime(r.checked_out_at)} · ${fmtDuration(r.checked_in_at, r.checked_out_at)}`}
                    </p>
                  )}
                </div>

                {/* Sağ: tarih + durum badge */}
                <div className="flex-shrink-0 text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                    r.checked_in
                      ? "bg-green-500/15 border-green-500/30 text-green-400"
                      : isFairEnded
                      ? "bg-red-500/10 border-red-500/20 text-red-400/70"
                      : "bg-white/5 border-white/10 text-muted-foreground"
                  }`}>
                    {r.checked_in ? "Geldi" : isFairEnded ? "Gelmedi" : "Bekleniyor"}
                  </span>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">{fmtDate(r.registered_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
