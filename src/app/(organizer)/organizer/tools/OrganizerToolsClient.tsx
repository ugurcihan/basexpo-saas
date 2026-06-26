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
  Wrench, Trophy, Store, QrCode, Crown, Gift, Plus, Trash2,
  Download, Copy, Check, Power, PowerOff, AlertCircle,
  CheckSquare, Square, Calendar, Building2, ChevronDown, Link as LinkIcon,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createGoldenQR, deleteGoldenQR, toggleGoldenQR } from "@/features/events/goldenQRActions";
import { createTask, createTasksBulk, toggleTask, deleteTask, getTasksByEvent, type FairTask } from "@/features/events/taskActions";
import type { Profile } from "@/types";
import { ORGANIZER_NAV } from "../_nav";
import Link from "next/link";

interface ExhibitorOption { id: string; company_name: string; logo_url: string | null }
interface BoothOption { id: string; code: string; exhibitor_id: string | null; exhibitor: ExhibitorOption | null; hall: { name: string } | null }
interface HallOption  { id: string; name: string; booths: BoothOption[] }
interface EventOption { id: string; name: string; status: string; halls: HallOption[] }

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
  useEffect(() => { setUrl(`${window.location.origin}/golden-scan/${token}`); }, [token]);
  if (!url) return <div style={{ width: size, height: size }} className="bg-white/10 rounded animate-pulse" />;
  return <QRCodeSVG id={`qr-svg-${token}`} value={url} size={size} level="M" fgColor="#1a1a2e" />;
}

function QRDownloadButton({ token, label }: { token: string; label: string }) {
  const download = useCallback(() => {
    const svg = document.getElementById(`qr-svg-${token}`);
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 300, 300);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `altinqr-${label.replace(/\s+/g, "-")}.png`;
        a.click();
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [token, label]);

  return (
    <button onClick={download} title="PNG İndir" className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-gold hover:bg-brand-gold/10 transition-colors">
      <Download className="w-3.5 h-3.5" />
    </button>
  );
}

function GoldenQRTab({ goldenQRs: initialQRs, events }: { goldenQRs: GoldenQRRow[]; events: EventOption[] }) {
  const [qrs, setQRs] = useState(initialQRs);
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const defaultEventId = events.find((e) => e.status === "active" || e.status === "published")?.id ?? events[0]?.id ?? "";
  const [selectedEventId, setSelectedEventId] = useState(defaultEventId);
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
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-brand-gold" />
          <span className="font-semibold text-white">{qrs.length} QR kodu</span>
        </div>
        <Button variant="gradient" size="sm" onClick={() => { setError(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Yeni Altın QR
        </Button>
      </div>

      <div className="glass rounded-2xl border border-brand-gold/20 p-4 flex items-start gap-3 mb-6">
        <Gift className="w-5 h-5 text-brand-gold flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <span className="text-brand-gold font-medium">Altın QR nedir? </span>
          Stantlara özel çekiliş/ödül QR'ları yerleştirin. Ziyaretçiler taradığında çekilişe girer. Her ziyaretçi bir QR kodunu yalnızca 1 kez tarayabilir.
        </p>
      </div>

      {qrs.length === 0 ? (
        <div className="glass rounded-2xl border border-dashed border-brand-gold/20 p-14 flex flex-col items-center text-center">
          <QrCode className="w-14 h-14 text-brand-gold/30 mb-4" />
          <h2 className="font-semibold text-white mb-2">Henüz Altın QR yok</h2>
          <p className="text-sm text-muted-foreground max-w-xs">Yeni Altın QR oluşturun, standa atayın ve ziyaretçilerin taramasını bekleyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {qrs.map((qr) => {
            const scanCount = qr.golden_qr_scans?.[0]?.count ?? 0;
            return (
              <div
                key={qr.id}
                className={`glass rounded-2xl border p-5 ${qr.is_active ? "border-brand-gold/25" : "border-white/8 opacity-60"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-24 h-24 rounded-xl bg-white p-1.5 flex items-center justify-center">
                    <QRDisplay token={qr.token} size={84} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-white text-sm truncate">{qr.label}</span>
                      <Badge variant={qr.is_active ? "gold" : "outline"} className="text-xs flex-shrink-0">
                        {qr.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </div>
                    {qr.prize_description && <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{qr.prize_description}</p>}
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
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-white/8">
                  <button onClick={() => copyUrl(qr.token)} title="URL Kopyala" className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/8 transition-colors">
                    {copied === qr.token ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <QRDownloadButton token={qr.token} label={qr.label} />
                  <button onClick={() => handleToggle(qr.id, qr.is_active)} disabled={isPending} title={qr.is_active ? "Pasifleştir" : "Aktifleştir"} className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-cyan hover:bg-brand-cyan/10 transition-colors">
                    {qr.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(qr.id)} disabled={isPending} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  {allBooths.map((b) => <SelectItem key={b.id} value={b.id}>{b.hallName} / {b.code}</SelectItem>)}
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
    </>
  );
}

const TEMPLATE_TASKS = [
  "Stand düzenini tamamla",
  "Sponsor logolarını topla",
  "Kapı tarayıcı test et",
  "Ziyaretçi bilet bildirimini gönder",
];

function TasksTab({ events }: { events: EventOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [tasks, setTasks] = useState<FairTask[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedEventId || loaded[selectedEventId]) return;
    startTransition(async () => {
      const data = await getTasksByEvent(selectedEventId);
      setTasks(data);
      setLoaded((prev) => ({ ...prev, [selectedEventId]: true }));
    });
  }, [selectedEventId]);

  const eventTasks = tasks.filter((t) => t.event_id === selectedEventId);

  async function handleAdd() {
    if (!taskTitle.trim() || !selectedEventId) return;
    setError(null);
    startTransition(async () => {
      const result = await createTask(selectedEventId, taskTitle.trim(), taskDue || undefined);
      if (result?.error) { setError(result.error); return; }
      const data = await getTasksByEvent(selectedEventId);
      setTasks(data);
      setTaskTitle("");
      setTaskDue("");
    });
  }

  async function handleToggle(taskId: string, isDone: boolean) {
    startTransition(async () => {
      await toggleTask(taskId, !isDone);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, is_done: !isDone } : t));
    });
  }

  async function handleDelete(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });
  }

  async function handleTemplate() {
    if (!selectedEventId) return;
    startTransition(async () => {
      await createTasksBulk(selectedEventId, TEMPLATE_TASKS);
      const data = await getTasksByEvent(selectedEventId);
      setTasks(data);
    });
  }

  const done = eventTasks.filter((t) => t.is_done).length;

  return (
    <div className="space-y-4">
      {/* Event selector */}
      {events.length > 1 && (
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Fuar seçin..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* Add task */}
      <div className="glass rounded-2xl border border-white/8 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-sm">Yeni Görev Ekle</h3>
          <button
            onClick={handleTemplate}
            disabled={isPending || !selectedEventId}
            className="text-xs text-muted-foreground hover:text-brand-violet-light transition-colors flex items-center gap-1"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Hazır Şablon
          </button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Görev başlığı..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Input
            type="date"
            value={taskDue}
            onChange={(e) => setTaskDue(e.target.value)}
            className="w-36"
          />
          <Button variant="gradient" size="sm" onClick={handleAdd} disabled={isPending || !taskTitle.trim() || !selectedEventId}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Task list */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
          <span className="text-sm text-muted-foreground">
            {eventTasks.length > 0 ? `${done}/${eventTasks.length} tamamlandı` : "Henüz görev yok"}
          </span>
          {eventTasks.length > 0 && (
            <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand-violet rounded-full transition-all" style={{ width: `${(done / eventTasks.length) * 100}%` }} />
            </div>
          )}
        </div>
        {eventTasks.length === 0 ? (
          <div className="p-10 flex flex-col items-center text-center">
            <Trophy className="w-10 h-10 text-muted-foreground/25 mb-3" />
            <p className="text-sm text-muted-foreground">Görev ekleyin veya "Hazır Şablon" ile başlayın.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {eventTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 px-5 py-3 group">
                <button
                  onClick={() => handleToggle(task.id, task.is_done)}
                  disabled={isPending}
                  className="flex-shrink-0 text-muted-foreground hover:text-brand-violet-light transition-colors"
                >
                  {task.is_done
                    ? <CheckSquare className="w-4.5 h-4.5 text-brand-violet-light" />
                    : <Square className="w-4.5 h-4.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.is_done ? "line-through text-muted-foreground" : "text-white"}`}>{task.title}</p>
                  {task.due_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(task.due_date).toLocaleDateString("tr-TR")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoothsTab({ events }: { events: EventOption[] }) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const totalBooths = selectedEvent?.halls.reduce((s, h) => s + h.booths.length, 0) ?? 0;
  const filledBooths = selectedEvent?.halls.reduce((s, h) => s + h.booths.filter((b) => b.exhibitor_id).length, 0) ?? 0;

  return (
    <div className="space-y-4">
      {events.length > 1 && (
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Fuar seçin..." />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {!selectedEvent ? (
        <div className="glass rounded-2xl border border-dashed border-white/10 p-14 flex flex-col items-center text-center">
          <Store className="w-12 h-12 text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground">Fuar seçin</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 glass rounded-xl border border-white/8 p-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Doluluk</p>
              <p className="text-xl font-display font-bold text-white">{filledBooths}/{totalBooths}</p>
            </div>
            <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-indigo to-brand-cyan rounded-full transition-all"
                style={{ width: totalBooths > 0 ? `${(filledBooths / totalBooths) * 100}%` : "0%" }}
              />
            </div>
            <Link href={`/organizer/events/${selectedEventId}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <LinkIcon className="w-3.5 h-3.5" /> Yönet
              </Button>
            </Link>
          </div>

          {selectedEvent.halls.length === 0 ? (
            <div className="glass rounded-2xl border border-dashed border-white/10 p-10 flex flex-col items-center text-center">
              <Store className="w-10 h-10 text-muted-foreground/25 mb-3" />
              <p className="text-sm font-medium text-white mb-1">Henüz salon/stand oluşturulmadı</p>
              <p className="text-xs text-muted-foreground mb-4">Bu fuara salon ve stand eklemek için fuar detay sayfasına gidin.</p>
              <Link href={`/organizer/events/${selectedEventId}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <LinkIcon className="w-3.5 h-3.5" /> Fuar Detayına Git
                </Button>
              </Link>
            </div>
          ) : selectedEvent.halls.map((hall) => (
            <div key={hall.id} className="glass rounded-2xl border border-white/8 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
                <span className="font-medium text-white text-sm">{hall.name}</span>
                <span className="text-xs text-muted-foreground">{hall.booths.filter((b) => b.exhibitor_id).length}/{hall.booths.length} dolu</span>
              </div>
              {hall.booths.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Bu salonda stand yok.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {hall.booths.map((booth) => (
                    <div key={booth.id} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="font-mono text-xs text-muted-foreground w-10 flex-shrink-0">{booth.code}</span>
                      {booth.exhibitor ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3 h-3 text-brand-cyan" />
                          </div>
                          <span className="text-sm text-white truncate">{booth.exhibitor.company_name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-green-500/15 border border-green-500/20 text-green-400 flex-shrink-0">Atandı</span>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <span className="text-xs text-muted-foreground/60 italic">Atanmamış</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function OrganizerToolsClient({ profile, goldenQRs, events }: Props) {
  const [tab, setTab] = useState<"tasks" | "booths" | "golden-qr">("golden-qr");

  const tabs = [
    { id: "tasks" as const,     label: "Görevler",  icon: Trophy },
    { id: "booths" as const,    label: "Standlar",  icon: Store },
    { id: "golden-qr" as const, label: "Altın QR",  icon: Crown },
  ];

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Araçlar</h1>
          </div>
          <p className="text-muted-foreground pl-12">Görev yönetimi, stand atamaları ve altın QR</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/8 pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                tab === t.id
                  ? "border-brand-violet text-brand-violet-light"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "tasks" && (
          <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
            <TasksTab events={events} />
          </motion.div>
        )}

        {tab === "booths" && (
          <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
            <BoothsTab events={events} />
          </motion.div>
        )}

        {tab === "golden-qr" && (
          <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
            <GoldenQRTab goldenQRs={goldenQRs} events={events} />
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
