"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Download, QrCode, Star, Building2, Loader2, FileDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getGoldenQRsForOrganizer } from "@/features/events/goldenQRActions";

interface BoothRow   { id: string; code: string; exhibitor_id: string | null; qr_token: string; is_golden: boolean }
interface HallRow    { id: string; name: string; floor: number; booths: BoothRow[] }
interface Exhibitor  { id: string; company_name: string }

interface Props {
  eventId: string;
  eventName: string;
  halls: HallRow[];
  exhibitors: Exhibitor[];
}

type GoldenQR = Awaited<ReturnType<typeof getGoldenQRsForOrganizer>>[number];

function exhibitorName(exhibitorId: string | null, exhibitors: Exhibitor[]): string {
  if (!exhibitorId) return "Boş Stant";
  return exhibitors.find(e => e.id === exhibitorId)?.company_name ?? "Bilinmeyen Firma";
}

function svgToPng(svgId: string, label: string): Promise<void> {
  return new Promise((resolve) => {
    const svgEl = document.getElementById(svgId) as SVGElement | null;
    if (!svgEl) { resolve(); return; }
    const size = 400;
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(blob => {
        if (!blob) { resolve(); return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${label.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, "").trim()}-qr.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        resolve();
      }, "image/png");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  });
}

async function downloadAllBoothQRsPDF(halls: HallRow[], exhibitors: Exhibitor[], eventName: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const cols = 4, rows = 5;
  const cellW = 45, cellH = 52;
  const marginL = (210 - cols * cellW) / 2;
  const marginT = 12;
  const qrSize = 36;

  const allBooths = halls.flatMap(h => h.booths.map(b => ({ ...b, hallName: h.name })));
  let page = 0;

  for (let i = 0; i < allBooths.length; i++) {
    const booth = allBooths[i];
    const pos   = i % (cols * rows);
    const col   = pos % cols;
    const row   = Math.floor(pos / cols);

    if (pos === 0 && i > 0) { doc.addPage(); page++; }

    const x = marginL + col * cellW;
    const y = marginT  + row * cellH;

    // Get QR canvas data
    const svgId = `qr-booth-${booth.id}`;
    const svgEl = document.getElementById(svgId) as SVGElement | null;
    if (svgEl) {
      await new Promise<void>((res) => {
        const canvas = document.createElement("canvas");
        canvas.width = 300; canvas.height = 300;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 300, 300);
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL("image/png");
          doc.addImage(dataUrl, "PNG", x + (cellW - qrSize) / 2, y, qrSize, qrSize);
          res();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      });
    }

    // Border
    doc.setDrawColor(220, 220, 230);
    doc.setFillColor(250, 250, 255);
    doc.roundedRect(x, y, cellW - 1, cellH - 1, 2, 2, "D");

    if (booth.is_golden) {
      doc.setFillColor(251, 191, 36);
      doc.circle(x + cellW - 6, y + 4, 2.5, "F");
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 40);
    const code = booth.code;
    doc.text(code, x + cellW / 2, y + qrSize + 5, { align: "center" });

    doc.setFontSize(5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 100);
    const name = exhibitorName(booth.exhibitor_id, exhibitors);
    const shortName = name.length > 14 ? name.slice(0, 12) + "…" : name;
    doc.text(shortName, x + cellW / 2, y + qrSize + 10, { align: "center" });

    doc.setFontSize(5);
    doc.setTextColor(160, 160, 180);
    doc.text(booth.hallName, x + cellW / 2, y + qrSize + 14, { align: "center" });
  }

  doc.save(`${eventName}_stant_qr_kodlari.pdf`);
}

export function QRCodesSection({ eventId, eventName, halls, exhibitors }: Props) {
  const [goldenQRs, setGoldenQRs] = useState<GoldenQR[]>([]);
  const [goldenLoading, setGoldenLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [dlId, setDlId] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    getGoldenQRsForOrganizer(eventId).then(data => {
      setGoldenQRs(data);
      setGoldenLoading(false);
    });
  }, [eventId]);

  const allBooths = halls.flatMap(h => h.booths);
  const boothCount = allBooths.length;

  async function handleDownloadSingle(boothId: string, boothCode: string, companyName: string) {
    setDlId(boothId);
    await svgToPng(`qr-booth-${boothId}`, `${boothCode}-${companyName}`);
    setDlId(null);
  }

  async function handleDownloadGolden(token: string, label: string) {
    setDlId(`g-${token}`);
    await svgToPng(`qr-golden-${token}`, label);
    setDlId(null);
  }

  async function handleBulkPDF() {
    setDownloading(true);
    await downloadAllBoothQRsPDF(halls, exhibitors, eventName);
    setDownloading(false);
  }

  return (
    <div className="space-y-6">
      {/* ── Stant QR Kodları ─────────────────────────────── */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-brand-indigo-light" />
            <h3 className="font-semibold text-white">Stant QR Kodları</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-indigo/20 text-brand-indigo-light border border-brand-indigo/30">
              {boothCount} stant
            </span>
          </div>
          <button
            onClick={handleBulkPDF}
            disabled={downloading || boothCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-indigo/20 border border-brand-indigo/30 text-brand-indigo-light hover:bg-brand-indigo/30 transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            Tümünü PDF İndir
          </button>
        </div>

        {halls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Henüz salon/stant yok.</p>
        ) : (
          <div className="space-y-4">
            {halls.map(hall => (
              <div key={hall.id}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {hall.name}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {hall.booths.map(booth => {
                    const scanUrl = `${origin}/scan/booth/${booth.qr_token}`;
                    const company = exhibitorName(booth.exhibitor_id, exhibitors);
                    const isLoading = dlId === booth.id;
                    return (
                      <div key={booth.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8">
                        {/* Hidden QR for download */}
                        <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1, overflow: "hidden" }}>
                          <QRCodeSVG id={`qr-booth-${booth.id}`} value={scanUrl} size={300} level="M" />
                        </div>

                        {/* Mini QR preview */}
                        <div className="w-10 h-10 rounded-lg bg-white p-0.5 flex-shrink-0">
                          <QRCodeSVG value={scanUrl} size={36} level="M" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {booth.is_golden && <Star className="w-3 h-3 text-brand-gold fill-brand-gold flex-shrink-0" />}
                            <span className="text-sm font-medium text-white">{booth.code}</span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{company}</p>
                        </div>

                        <button
                          onClick={() => handleDownloadSingle(booth.id, booth.code, company)}
                          disabled={!!dlId}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-white/8 border border-white/12 text-muted-foreground hover:text-white hover:bg-white/15 transition-colors disabled:opacity-40 flex-shrink-0"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                          PNG
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Altın QR Kodları ─────────────────────────────── */}
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl border border-brand-gold/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-brand-gold fill-brand-gold" />
          <h3 className="font-semibold text-white">Altın QR Kodları</h3>
          {!goldenLoading && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/25">
              {goldenQRs.length} adet
            </span>
          )}
        </div>

        {goldenLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Yükleniyor...</span>
          </div>
        ) : goldenQRs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Bu fuara ait altın QR kodu yok. Salonlar &amp; Standlar sekmesinden stantlara ⭐ ekle.
          </p>
        ) : (
          <div className="space-y-2">
            {goldenQRs.map(qr => {
              const scanUrl = `${origin}/golden-scan/${qr.token}`;
              const scanCount = (qr.golden_qr_scans as unknown as { count: number }[])?.[0]?.count ?? 0;
              const isLoading = dlId === `g-${qr.token}`;
              const booth = qr.booth as unknown as { code: string; hall: { name: string } } | null;
              return (
                <div key={qr.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-gold/5 border border-brand-gold/15">
                  <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1, overflow: "hidden" }}>
                    <QRCodeSVG id={`qr-golden-${qr.token}`} value={scanUrl} size={300} level="M" fgColor="#92400e" />
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-white p-0.5 flex-shrink-0">
                    <QRCodeSVG value={scanUrl} size={36} level="M" fgColor="#92400e" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{qr.label as string}</p>
                    <p className="text-xs text-muted-foreground">
                      {booth ? `${booth.hall.name} / ${booth.code} · ` : ""}
                      {scanCount} tarama
                      {(qr.scan_limit as number | null) ? ` / ${qr.scan_limit} limit` : " (limitsiz)"}
                      {!(qr.is_active as boolean) && " · Pasif"}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownloadGolden(qr.token as string, qr.label as string)}
                    disabled={!!dlId}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-brand-gold/15 border border-brand-gold/25 text-brand-gold hover:bg-brand-gold/25 transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    PNG
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
