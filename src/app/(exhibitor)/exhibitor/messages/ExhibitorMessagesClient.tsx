"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Building2, QrCode, Package, Users,
  MessageSquare, Brain, CalendarClock, Store, Settings,
  Bell, Megaphone, Clock, AlertCircle, CheckCheck,
} from "lucide-react";
import { markNotificationRead, markAllRead } from "@/features/notifications/notificationActions";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/exhibitor",                icon: LayoutDashboard },
  { label: "Marka Profili",    href: "/exhibitor/profile",        icon: Building2 },
  { label: "QR Yarat",         href: "/exhibitor/qr",             icon: QrCode },
  { label: "Ürünlerim",        href: "/exhibitor/products",       icon: Package },
  { label: "Ziyaretçilerim",   href: "/exhibitor/leads",          icon: Users },
  { label: "Mesajlar",         href: "/exhibitor/messages",       icon: MessageSquare },
  { label: "Analiz AI",        href: "/exhibitor/analytics",      icon: Brain },
  { label: "Yaklaşan Fuarlar", href: "/exhibitor/upcoming-fairs", icon: CalendarClock },
  { label: "Fuar Standlarım",  href: "/exhibitor/my-booths",      icon: Store },
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

interface NotifRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  event: { id: string; name: string } | null;
  sender: { full_name: string | null } | null;
}

interface Props {
  profile: Profile;
  notifications: NotifRow[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  announcement: Megaphone,
  reminder:     Clock,
  alert:        AlertCircle,
  golden_qr:    Bell,
};

const TYPE_COLORS: Record<string, { bg: string; icon: string }> = {
  announcement: { bg: "bg-brand-cyan/10 border-brand-cyan/20",   icon: "text-brand-cyan" },
  reminder:     { bg: "bg-brand-gold/10 border-brand-gold/20",   icon: "text-brand-gold" },
  alert:        { bg: "bg-red-500/10 border-red-500/20",          icon: "text-red-400" },
  golden_qr:    { bg: "bg-brand-gold/10 border-brand-gold/20",   icon: "text-brand-gold" },
};

function formatAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export function ExhibitorMessagesClient({ profile, notifications: initial }: Props) {
  const [notifications, setNotifications] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unread = notifications.filter((n) => !n.is_read).length;

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    });
  }

  function markAllReadHandler() {
    startTransition(async () => {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    });
  }

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-brand-indigo-light" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">Bildirimler</h1>
                <p className="text-xs text-muted-foreground">{notifications.length} bildirim{unread > 0 ? ` · ${unread} okunmamış` : ""}</p>
              </div>
            </div>
            {unread > 0 && (
              <Button variant="outline" size="sm" onClick={markAllReadHandler} disabled={isPending}>
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Tümünü Okundu İşaretle
              </Button>
            )}
          </div>
        </motion.div>

        {notifications.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">Henüz bildirim yok.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Organizatörden duyuru geldiğinde burada görünecek.</p>
          </div>
        ) : (
          <motion.div
            initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden"
          >
            {notifications.map((n) => {
              const Icon = TYPE_ICONS[n.type] ?? Bell;
              const colors = TYPE_COLORS[n.type] ?? { bg: "bg-white/5 border-white/10", icon: "text-muted-foreground" };
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead(n.id)}
                  className={`px-5 py-4 flex items-start gap-4 transition-colors cursor-pointer ${n.is_read ? "opacity-60" : "hover:bg-white/3"}`}
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                    <Icon className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${n.is_read ? "text-muted-foreground" : "text-white"}`}>{n.title}</p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-indigo-light flex-shrink-0" />}
                    </div>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      <span>{(n.event as { name: string } | null)?.name ?? "—"}</span>
                      <span>·</span>
                      <span>{formatAgo(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
