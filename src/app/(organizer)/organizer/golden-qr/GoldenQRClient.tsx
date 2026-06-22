"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2,
  Settings, Plus, Trash2, Download, Copy, Check, Power, PowerOff,
  Crown, AlertCircle, Gift,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createGoldenQR, deleteGoldenQR, toggleGoldenQR } from "@/features/events/goldenQRActions";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",               href: "/organizer",                          icon: LayoutDashboard },
  { label: "Fuarlar",             href: "/organizer/events",                   icon: CalendarDays },
  { label: "Katılım Talepleri",   href: "/organizer/participation-requests",   icon: ClipboardList },
  { label: "Ziyaretçilerim",      href: "/organizer/visitors",                 icon: Users },
  { label: "Görevler",            href: "/organizer/tasks",                    icon: Trophy },
  { label: "Standlar",            href: "/organizer/booths",                   icon: Store },
  { label: "Stand Takip",         href: "/organizer/booth-tracking",           icon: Activity },
  { label: "Mesajlar",            href: "/organizer/messages",                 icon: MessageSquare },
  { label: "Altın QR",            href: "/organizer/golden-qr",                icon: QrCode },
  { label: "Analiz",              href: "/organizer/analytics",                icon: BarChart2 },
  { label: "Marka Profilim",      href: "/organizer/profile",                  icon: UserCircle2 },
  { label: "Ayarlar",             href: "/organizer/settings",                 icon: Settings },
];

interface BoothOption { id: string; code: string; hall: { name: string } | null }
interface HallOption  { id: string; name: string; booths: BoothOption[] }
interface EventOption { id: string; name: string; halls: HallOption[] }

interface GoldenQRRow {
  id: string;
  token: string;
  label: string;
  prize_description: string | null;
  is_active: boolean;
  scan_limit: number | null;
  created_at: string;
  event: { id: string; name: string } | null;
  booth: { id: string; code: string; hall: { name: string } | null } | null;
  golden_qr_scans: { count: number }[];
}

interface Props {
  profile: Profile;
  goldenQRs: GoldenQRRow[];
  events: EventOption[];
}

function QRDisplay({ token, size }: { token: string; size: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(`${window.location.origin}/golden-scan/${token}`);
  }, [token]);
  if (!url) return <div style={{ width: size, height: size }} className="bg-white/10 rounded animate-pulse" />;
  return <QRCodeSVG id={`qr-svg-${token}`} value={url} size={size} level="M" fgColor="#1a1a2e" />;
}

function QRDownloadButton({ token, label }: { token: string; label: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const download = useCallback(() => {
    const svg = document.getElementById(`qr-svg-${token}`);
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, 300, 300); canvas.toBlob((b) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `altinqr-${label.replace(/\s+/g, "-")}.png`; a.click(); }); };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [token, label]);

  return (
    <button onClick={download} className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-gold hover:bg-brand-gold/10 transition-colors" title="PNG İndir">
      <Download className="w-3.5 h-3.5" />
    </button>
  );
}

export function GoldenQRClient({ profile, goldenQRs: initialQRs, events }: Props) {
  const [qrs, setQRs] = useState(initialQRs);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedBoothId, setSelectedBoothId] = useState("none");
  const [qrLabel, setQRLabel] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [scanLimit, setScanLimit] = useState("");

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const allBooths = selectedEvent?.halls.flatMap((h) => h.booths.map((b) => ({ ...b, hallName: h.name }))) ?? [];

  function copyUrl(token: string) {
    const url = `${window.location.origin}/golden-scan/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCreate() {
    if (!selectedEventId || !qrLabel.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createGoldenQR({
        eventId: selectedEventId,
        boothId: selectedBoothId === "none" ? null : selectedBoothId,
        label: qrLabel.trim(),
        prizeDescription: prizeDesc.trim() || undefined,
        scanLimit: scanLimit ? parseInt(scanLimit, 10) : null,
      });
      if ("error" in result && result.error) { setError(result.error); return; }
      setModalOpen(false);
      setSelectedEventId(""); setSelectedBoothId("none"); setQRLabel(""); setPrizeDesc(""); setScanLimit("");
      // Yenile — sayfayı refresh etmek yerine mevcut state'i API'den yeniliyoruz basitçe
      window.location.reload();
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteGoldenQR(id);
      setQRs((prev) => prev.filter((q) => q.id !== id));
    });
  }

  async function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleGoldenQR(id, !current);
      setQRs((prev) => prev.map((q) => q.id === id ? { ...q, is_active: !current } : q));
    });
  }

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Altın QR</h1>
                <p className="text-xs text-muted-foreground">{qrs.length} QR kodu</p>
              </div>
            </div>
            <Button variant="gradient" size="sm" onClick={() => { setError(null); setModalOpen(true); }}>
              <Plus className="w-4 h-4" /> Yeni Altın QR
            </Button>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="glass rounded-2xl border border-brand-gold/20 p-4 flex items-start gap-3"
        >
          <Gift className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <span className="text-brand-gold font-medium">Altın QR nedir? </span>
            Standalara özel çekiliş/ödül QR'ları yerleştirin. Ziyaretçiler taradığında çekilişe girer.
            Her ziyaretçi bir QR kodunu yalnızca 1 kez tarayabilir. Tarayıcı sayısını izleyin ve kazananı seçin.
          </div>
        </motion.div>

        {/* QR List */}
        {qrs.length === 0 ? (
          <motion.div
            initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="glass rounded-2xl border border-dashed border-brand-gold/20 p-14 flex flex-col items-center text-center"
          >
            <QrCode className="w-14 h-14 text-brand-gold/30 mb-4" />
            <h2 className="font-semibold text-white mb-2">Henüz Altın QR yok</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Yeni Altın QR oluşturun, standa atayın ve ziyaretçilerin taramasını bekleyin.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qrs.map((qr, i) => {
              const scanCount = qr.golden_qr_scans?.[0]?.count ?? 0;
              return (
                <motion.div
                  key={qr.id}
                  initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                  className={`glass rounded-2xl border p-5 ${qr.is_active ? "border-brand-gold/25" : "border-white/8 opacity-60"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* QR Code */}
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-white p-1.5 flex items-center justify-center">
                      <QRDisplay token={qr.token} size={84} />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-white text-sm truncate">{qr.label}</span>
                        <Badge variant={qr.is_active ? "gold" : "outline"} className="text-xs flex-shrink-0">
                          {qr.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      {qr.prize_description && (
                        <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{qr.prize_description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                        <span>{qr.event?.name ?? "—"}</span>
                        {qr.booth && <span>· {qr.booth.hall?.name} / {qr.booth.code}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-brand-gold font-semibold text-sm">
                        <QrCode className="w-3.5 h-3.5" />
                        {scanCount}{qr.scan_limit ? `/${qr.scan_limit}` : ""} tarama
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-white/8">
                    <button onClick={() => copyUrl(qr.token)} title="URL Kopyala" className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/8 transition-colors">
                      {copied === qr.token ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <QRDownloadButton token={qr.token} label={qr.label} />
                    <button
                      onClick={() => handleToggle(qr.id, qr.is_active)}
                      disabled={isPending}
                      title={qr.is_active ? "Pasifleştir" : "Aktifleştir"}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors"
                    >
                      {qr.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(qr.id)}
                      disabled={isPending}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Altın QR Oluştur</DialogTitle>
            <DialogDescription>Standa özel çekiliş veya ödül QR kodu oluşturun.</DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fuar</Label>
              <Select value={selectedEventId} onValueChange={(v) => { setSelectedEventId(v); setSelectedBoothId("none"); }}>
                <SelectTrigger><SelectValue placeholder="Fuar seçin..." /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stand (opsiyonel)</Label>
              <Select value={selectedBoothId} onValueChange={setSelectedBoothId} disabled={!selectedEventId}>
                <SelectTrigger><SelectValue placeholder="Stand seçin..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Stand seçmeyin</SelectItem>
                  {allBooths.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.hallName} / {b.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Etiket *</Label>
              <Input placeholder='Örn: "A01 Standı iPhone Çekilişi"' value={qrLabel} onChange={(e) => setQRLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ödül Açıklaması</Label>
              <Input placeholder='Örn: "iPhone 16 kazanma şansı!"' value={prizeDesc} onChange={(e) => setPrizeDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Maksimum Tarama Sayısı</Label>
              <Input type="number" placeholder="Boş bırakırsanız sınırsız" value={scanLimit} onChange={(e) => setScanLimit(e.target.value)} min={1} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>İptal</Button>
            <Button variant="gradient" onClick={handleCreate} disabled={isPending || !selectedEventId || !qrLabel.trim()}>
              {isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
