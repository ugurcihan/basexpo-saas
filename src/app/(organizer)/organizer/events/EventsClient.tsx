"use client";

import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  BarChart2,
  Settings,
  Plus,
  MapPin,
  Calendar,
  ChevronRight,
  Pencil,
  Trash2,
  AlertCircle,
  ClipboardList,
  Users,
  Trophy,
  Store,
  Activity,
  MessageSquare,
  QrCode,
  UserCircle2,
  FileBarChart,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Tag,
  Youtube,
  ChevronDown,
  Check,
  Copy,
  Download,
} from "lucide-react";
import { createEvent, updateEvent, deleteEvent, updateEventDetails } from "@/features/events/actions";
import type { ExpoEvent, EventStatus } from "@/types";
import { useRouter } from "next/navigation";
import { ORGANIZER_NAV } from "../_nav";
import { QRCodeSVG } from "qrcode.react";

const STATUS_MAP: Record<EventStatus, { label: string; variant: "default" | "cyan" | "violet" | "gold" | "outline" }> = {
  draft:     { label: "Taslak",  variant: "outline" },
  published: { label: "Yayında", variant: "gold" },
  active:    { label: "Aktif",   variant: "cyan" },
  ended:     { label: "Bitti",   variant: "outline" },
};

const STATUS_PALETTE: Record<EventStatus, { border: string; hover: string; accent: string; iconColor: string; groupColor: string; dotColor: string }> = {
  active:    { border: "border-green-500/40",   hover: "hover:border-green-400/60 hover:bg-green-500/8",   accent: "bg-green-500",  iconColor: "text-green-400",  groupColor: "text-green-400",  dotColor: "bg-green-400" },
  published: { border: "border-brand-gold/25",  hover: "hover:border-brand-gold/40 hover:bg-brand-gold/6", accent: "bg-brand-gold", iconColor: "text-brand-gold", groupColor: "text-brand-gold", dotColor: "bg-brand-gold" },
  draft:     { border: "border-slate-500/25",   hover: "hover:border-slate-400/40 hover:bg-slate-500/6",   accent: "bg-slate-500",  iconColor: "text-slate-400",  groupColor: "text-slate-400",  dotColor: "bg-slate-500" },
  ended:     { border: "border-slate-500/20",   hover: "hover:border-slate-400/35 hover:bg-slate-500/5",   accent: "bg-slate-600",  iconColor: "text-slate-500",  groupColor: "text-slate-500",  dotColor: "bg-slate-600" },
};

const STATUS_ORDER: EventStatus[] = ["active", "published", "draft", "ended"];

interface EventFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  maps_url: string;
  category: string;
  tags_input: string;
  youtube_url: string;
  social_website: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
}

const emptyForm: EventFormData = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
  maps_url: "",
  category: "",
  tags_input: "",
  youtube_url: "",
  social_website: "",
  social_instagram: "",
  social_twitter: "",
  social_linkedin: "",
};

function QRDisplay({ url, size }: { url: string; size: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: size, height: size }} className="bg-white/10 rounded animate-pulse" />;
  return <QRCodeSVG id="event-qr-code" value={url} size={size} level="M" />;
}

export function EventsClient({ events: initialEvents, profileId }: { events: ExpoEvent[]; profileId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState(initialEvents);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpoEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpoEvent | null>(null);
  const [qrEvent, setQrEvent] = useState<ExpoEvent | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function openQr(event: ExpoEvent) {
    const url = `${window.location.origin}/e/${event.id}`;
    setQrUrl(url);
    setQrEvent(event);
    setCopied(false);
  }

  function copyUrl() {
    navigator.clipboard.writeText(qrUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function downloadQr() {
    const svg = document.getElementById("event-qr-code") as SVGElement | null;
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `qr-${qrEvent?.name?.replace(/\s+/g, "-") ?? "event"}.png`;
        a.click();
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setCreateOpen(true);
  }

  function openEdit(event: ExpoEvent) {
    setForm({
      name: event.name,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      maps_url: event.maps_url ?? "",
      category: event.category ?? "",
      tags_input: (event.tags ?? []).join(", "),
      youtube_url: event.youtube_url ?? "",
      social_website: event.social_links?.website ?? "",
      social_instagram: event.social_links?.instagram ?? "",
      social_twitter: event.social_links?.twitter ?? "",
      social_linkedin: event.social_links?.linkedin ?? "",
    });
    setError(null);
    setEditTarget(event);
  }

  async function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createEvent(form);
      if (result.error) { setError(result.error); return; }
      setCreateOpen(false);
      router.refresh();
    });
  }

  async function handleUpdate() {
    if (!editTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await updateEvent({
        name: form.name, description: form.description,
        start_date: form.start_date, end_date: form.end_date, location: form.location,
        id: editTarget.id,
      });
      if (result.error) { setError(result.error); return; }

      const tags = form.tags_input.split(",").map((t) => t.trim()).filter(Boolean);
      const hasSocialLinks = form.social_website || form.social_instagram || form.social_twitter || form.social_linkedin;
      await updateEventDetails({
        id: editTarget.id,
        maps_url: form.maps_url || undefined,
        category: form.category || undefined,
        tags: tags.length ? tags : undefined,
        youtube_url: form.youtube_url || undefined,
        social_links: hasSocialLinks ? {
          website: form.social_website || undefined,
          instagram: form.social_instagram || undefined,
          twitter: form.social_twitter || undefined,
          linkedin: form.social_linkedin || undefined,
        } : undefined,
      });

      setEditTarget(null);
      router.refresh();
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteEvent(deleteTarget.id);
      setDeleteTarget(null);
      setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    });
  }

  const isFormValid = form.name && form.start_date && form.end_date && form.location;

  return (
    <DashboardShell role="organizer" userName="" navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Fuarlarım</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-muted-foreground text-sm">
                {events.length} fuar · {events.filter((e) => e.status === "active").length} aktif
              </p>
              <Link href={`/o/${profileId}`} target="_blank" className="text-xs text-brand-indigo-light hover:underline flex items-center gap-1">
                <Globe className="w-3 h-3" /> Portfolyomu Gör
              </Link>
            </div>
          </div>
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Yeni Fuar
          </Button>
        </motion.div>

        {/* Event list */}
        {events.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-brand-indigo/20 p-12 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
              <CalendarDays className="w-7 h-7 text-brand-indigo-light" />
            </div>
            <h2 className="font-display text-lg font-semibold text-white mb-2">Henüz fuar yok</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              İlk fuarını oluştur. Salon ve stand ekle, firmaları davet et.
            </p>
            <Button variant="gradient" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Fuar Oluştur
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {STATUS_ORDER.map((status) => {
              const group = events.filter((e) => e.status === status);
              if (group.length === 0) return null;
              const pal = STATUS_PALETTE[status];
              const smap = STATUS_MAP[status];
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${pal.dotColor}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${pal.groupColor}`}>
                      {smap.label} ({group.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`group flex rounded-xl border glass transition-all duration-200 overflow-hidden ${pal.border} ${pal.hover}`}
                      >
                        {/* Left accent strip */}
                        <div className={`w-1 flex-shrink-0 ${pal.accent}`} />

                        <div className="flex-1 p-4 flex items-center gap-4">
                          {/* Icon */}
                          <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <CalendarDays className={`w-4.5 h-4.5 ${pal.iconColor}`} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <h3 className="font-semibold text-white truncate">{event.name}</h3>
                              {event.category && (
                                <span className="text-xs px-1.5 py-0.5 rounded-md bg-white/8 text-muted-foreground flex-shrink-0">
                                  {event.category}
                                </span>
                              )}
                              <Badge variant={smap.variant} className="text-xs flex-shrink-0">
                                {smap.label}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(event.start_date).toLocaleDateString("tr-TR")} →{" "}
                                {new Date(event.end_date).toLocaleDateString("tr-TR")}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => (event.status === "published" || event.status === "active") ? openQr(event) : undefined}
                              title={event.status === "published" || event.status === "active" ? "Kapı QR Kodu" : "QR yalnızca yayında/aktif fuarlar için kullanılabilir"}
                              disabled={event.status !== "published" && event.status !== "active"}
                              className="gap-1.5 h-8 text-xs px-2.5"
                            >
                              <QrCode className="w-3.5 h-3.5" /> QR
                            </Button>
                            <button
                              onClick={() => openEdit(event)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/8 transition-colors"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(event)}
                              className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                            <Link href={`/organizer/events/${event.id}`}>
                              <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                                Detaylar <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Fuar Oluştur</DialogTitle>
            <DialogDescription>
              Fuarın temel bilgilerini gir. Salon ve standları sonraki adımda ekleyebilirsin.
            </DialogDescription>
          </DialogHeader>

          <EventForm form={form} setForm={setForm} error={error} />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isPending}>
              İptal
            </Button>
            <Button variant="gradient" onClick={handleCreate} disabled={isPending || !isFormValid}>
              {isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fuarı Düzenle</DialogTitle>
            <DialogDescription>{editTarget?.name}</DialogDescription>
          </DialogHeader>

          <EventForm form={form} setForm={setForm} error={error} />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>
              İptal
            </Button>
            <Button variant="gradient" onClick={handleUpdate} disabled={isPending || !isFormValid}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR MODAL */}
      <Dialog open={!!qrEvent} onOpenChange={(o) => !o && setQrEvent(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-brand-indigo-light" />
              Kapı QR Kodu
            </DialogTitle>
            <DialogDescription>{qrEvent?.name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            {qrUrl && (
              <div className="bg-white p-4 rounded-2xl">
                <QRDisplay url={qrUrl} size={200} />
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center px-2">
              Bu QR'ı kapıya asın. Ziyaretçiler okutarak kayıt olabilir veya biletini gösterebilir.
            </p>
            <p className="text-xs font-mono text-muted-foreground/60 text-center break-all px-2">{qrUrl}</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={copyUrl} className="gap-1.5">
              {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Kopyalandı</> : <><Copy className="w-3.5 h-3.5" /> URL Kopyala</>}
            </Button>
            <Button variant="gradient" size="sm" onClick={downloadQr} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> PNG İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-400">Fuarı Sil</DialogTitle>
            <DialogDescription>
              <strong className="text-foreground">{deleteTarget?.name}</strong> fuarını silmek
              üzeresin. Bu işlem geri alınamaz; tüm salonlar ve standlar da silinir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>
              İptal
            </Button>
            <Button
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-red-300"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Siliniyor..." : "Evet, Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function EventForm({
  form,
  setForm,
  error,
}: {
  form: EventFormData;
  setForm: React.Dispatch<React.SetStateAction<EventFormData>>;
  error: string | null;
}) {
  const [showExtra, setShowExtra] = useState(false);
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="ev-name">Fuar Adı *</Label>
        <Input
          id="ev-name"
          placeholder="İstanbul Tech Expo 2026"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-desc">Açıklama</Label>
        <Input
          id="ev-desc"
          placeholder="Kısa açıklama..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-location">Konum *</Label>
        <Input
          id="ev-location"
          placeholder="İstanbul Kongre Merkezi"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ev-start">Başlangıç *</Label>
          <Input
            id="ev-start"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-end">Bitiş *</Label>
          <Input
            id="ev-end"
            type="date"
            value={form.end_date}
            min={form.start_date}
            onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          />
        </div>
      </div>

      {/* Ek Detaylar toggle */}
      <button
        type="button"
        onClick={() => setShowExtra((v) => !v)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors w-full pt-1"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showExtra ? "rotate-180" : ""}`} />
        {showExtra ? "Ek detayları gizle" : "Ek detayları göster (harita, video, sosyal medya...)"}
      </button>

      {showExtra && (
        <div className="space-y-4 pt-1 border-t border-white/8">
          <div className="space-y-2">
            <Label htmlFor="ev-maps" className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Google Maps Linki</Label>
            <Input
              id="ev-maps"
              placeholder="https://maps.google.com/..."
              value={form.maps_url}
              onChange={(e) => setForm((f) => ({ ...f, maps_url: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ev-cat" className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Kategori</Label>
              <Input
                id="ev-cat"
                placeholder="Teknoloji, Sağlık..."
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ev-tags">Etiketler (virgülle)</Label>
              <Input
                id="ev-tags"
                placeholder="B2B, startups, AI..."
                value={form.tags_input}
                onChange={(e) => setForm((f) => ({ ...f, tags_input: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-yt" className="flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-red-400" /> YouTube Tanıtım Linki</Label>
            <Input
              id="ev-yt"
              placeholder="https://youtube.com/watch?v=..."
              value={form.youtube_url}
              onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Sosyal Medya</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Globe className="w-3 h-3" /> Web sitesi</Label>
                <Input placeholder="https://..." value={form.social_website} onChange={(e) => setForm((f) => ({ ...f, social_website: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Instagram className="w-3 h-3" /> Instagram</Label>
                <Input placeholder="https://instagram.com/..." value={form.social_instagram} onChange={(e) => setForm((f) => ({ ...f, social_instagram: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Twitter className="w-3 h-3" /> Twitter/X</Label>
                <Input placeholder="https://x.com/..." value={form.social_twitter} onChange={(e) => setForm((f) => ({ ...f, social_twitter: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs"><Linkedin className="w-3 h-3" /> LinkedIn</Label>
                <Input placeholder="https://linkedin.com/..." value={form.social_linkedin} onChange={(e) => setForm((f) => ({ ...f, social_linkedin: e.target.value }))} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
