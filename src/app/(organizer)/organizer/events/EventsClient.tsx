"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import { createEvent, updateEvent, deleteEvent } from "@/features/events/actions";
import type { ExpoEvent, EventStatus } from "@/types";
import { useRouter } from "next/navigation";

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

const STATUS_MAP: Record<EventStatus, { label: string; variant: "default" | "cyan" | "violet" | "gold" | "outline" }> = {
  draft: { label: "Taslak", variant: "outline" },
  published: { label: "Yayında", variant: "default" },
  active: { label: "Aktif", variant: "cyan" },
  ended: { label: "Bitti", variant: "gold" },
};

interface EventFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
}

const emptyForm: EventFormData = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  location: "",
};

export function EventsClient({ events: initialEvents }: { events: ExpoEvent[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState(initialEvents);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpoEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpoEvent | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

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
      const result = await updateEvent({ ...form, id: editTarget.id });
      if (result.error) { setError(result.error); return; }
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
    <DashboardShell role="organizer" userName="" navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Fuarlarım</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {events.length} fuar · {events.filter((e) => e.status === "active").length} aktif
            </p>
          </div>
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Yeni Fuar
          </Button>
        </motion.div>

        {/* Event list */}
        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-brand-indigo/20 p-12 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center mb-4">
              <CalendarDays className="w-7 h-7 text-brand-indigo-light" />
            </div>
            <h2 className="font-display text-lg font-semibold text-white mb-2">
              Henüz fuar yok
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              İlk fuarını oluştur. Salon ve stand ekle, firmaları davet et.
            </p>
            <Button variant="gradient" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Fuar Oluştur
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {events.map((event, i) => {
              const status = STATUS_MAP[event.status];
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group glass rounded-xl border border-white/8 hover:border-white/15 transition-all duration-200 overflow-hidden"
                >
                  <div className="p-5 flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-brand-indigo-light" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{event.name}</h3>
                        <Badge variant={status.variant} className="text-xs flex-shrink-0">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(event)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/8 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(event)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/8 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
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
  return (
    <div className="space-y-4">
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
          placeholder="İstanbul Tech Expo 2025"
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
    </div>
  );
}
