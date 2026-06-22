"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard, CalendarDays, ClipboardList, Users, Trophy,
  Store, Activity, MessageSquare, QrCode, BarChart2, UserCircle2,
  Settings, Send, Bell, Building2, Megaphone, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { sendNotification } from "@/features/notifications/notificationActions";
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

interface SentRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  event: { name: string } | null;
}

interface Props {
  profile: Profile;
  events: { id: string; name: string }[];
  sentNotifications: SentRow[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  announcement: Megaphone,
  reminder:     Clock,
  alert:        AlertCircle,
};

const TYPE_COLORS: Record<string, string> = {
  announcement: "text-brand-cyan bg-brand-cyan/10",
  reminder:     "text-brand-gold bg-brand-gold/10",
  alert:        "text-red-400 bg-red-500/10",
};

function formatAgo(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export function OrganizerMessagesClient({ profile, events, sentNotifications }: Props) {
  const [isPending, startTransition] = useTransition();
  const [eventId, setEventId]       = useState("");
  const [target, setTarget]         = useState<"exhibitors" | "visitors" | "both">("both");
  const [type, setType]             = useState<"announcement" | "reminder" | "alert">("announcement");
  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [result, setResult]         = useState<{ success?: boolean; count?: number; error?: string } | null>(null);

  async function handleSend() {
    if (!eventId || !title.trim()) return;
    setResult(null);
    startTransition(async () => {
      const res = await sendNotification({ eventId, targetType: target, type, title: title.trim(), body: body.trim() });
      setResult(res as typeof result);
      if ("success" in (res ?? {}) && res?.success) {
        setTitle(""); setBody("");
      }
    });
  }

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Bildirim Gönder</h1>
          </div>
          <p className="text-muted-foreground">Fuar katılımcılarına ve ziyaretçilere duyuru, hatırlatma veya uyarı gönderin.</p>
        </motion.div>

        {/* Compose form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="glass rounded-2xl border border-white/8 p-6 space-y-5"
        >
          <h2 className="font-semibold text-white flex items-center gap-2"><Send className="w-4 h-4 text-brand-indigo-light" /> Yeni Bildirim</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fuar</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger><SelectValue placeholder="Fuar seçin..." /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hedef Kitle</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as typeof target)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both"><Users className="w-3.5 h-3.5 inline mr-2" />Hepsi</SelectItem>
                  <SelectItem value="exhibitors"><Building2 className="w-3.5 h-3.5 inline mr-2" />Firmalar</SelectItem>
                  <SelectItem value="visitors"><Users className="w-3.5 h-3.5 inline mr-2" />Ziyaretçiler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tür</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement"><Megaphone className="w-3.5 h-3.5 inline mr-2" />Duyuru</SelectItem>
                  <SelectItem value="reminder"><Clock className="w-3.5 h-3.5 inline mr-2" />Hatırlatma</SelectItem>
                  <SelectItem value="alert"><AlertCircle className="w-3.5 h-3.5 inline mr-2" />Uyarı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Başlık *</Label>
            <Input
              placeholder='Örn: "A Salonunda Turkcel CEO Konuşması — Saat 15:00"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Mesaj</Label>
            <Input
              placeholder="Ek açıklama (opsiyonel)..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {result && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm ${
              result.success
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {result.success
                ? <><CheckCircle2 className="w-4 h-4" /> {result.count} kişiye bildirim gönderildi!</>
                : <><AlertCircle className="w-4 h-4" /> {result.error}</>
              }
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="gradient"
              onClick={handleSend}
              disabled={isPending || !eventId || !title.trim()}
            >
              <Send className="w-4 h-4" /> {isPending ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </div>
        </motion.div>

        {/* Sent history */}
        {sentNotifications.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <h2 className="font-semibold text-white mb-3">Gönderilen Bildirimler</h2>
            <div className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden">
              {sentNotifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                const colorClass = TYPE_COLORS[n.type] ?? "text-muted-foreground bg-white/5";
                return (
                  <div key={n.id} className="px-5 py-4 flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{n.title}</p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>}
                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        <span>{(n.event as { name: string } | null)?.name ?? "—"}</span>
                        <span>·</span>
                        <span>{formatAgo(n.created_at)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {n.type === "announcement" ? "Duyuru" : n.type === "reminder" ? "Hatırlatma" : "Uyarı"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
