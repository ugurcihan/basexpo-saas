"use client";

import { useState, useTransition, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  LayoutDashboard, Sparkles, QrCode, Heart, Users, CalendarClock,
  Settings, Plus, Check, X, Clock, MapPin, CalendarCheck, AlertCircle,
  UserCircle2, CalendarDays, Ticket,
} from "lucide-react";
import {
  requestMeeting, respondToMeeting,
  type MeetingRow, type ConnectionRow,
} from "@/features/connections/actions";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

const STATUS_MAP = {
  pending:  { label: "Bekliyor", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  accepted: { label: "Onaylandı", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  declined: { label: "Reddedildi", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
};

interface Props {
  profile: Profile;
  meetings: MeetingRow[];
  connections: ConnectionRow[];
  preselectedId?: string;
  preselectedName?: string;
}

export function MeetingsClient({ profile, meetings, connections, preselectedId, preselectedName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(!!preselectedId);
  const [toUserId, setToUserId] = useState(preselectedId ?? "");
  const [proposedAt, setProposedAt] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedId) { setToUserId(preselectedId); setModalOpen(true); }
  }, [preselectedId]);

  function openModal() {
    setToUserId(preselectedId ?? "");
    setProposedAt(""); setLocation(""); setNote(""); setError(null);
    setModalOpen(true);
  }

  async function handleRequest() {
    if (!toUserId) { setError("Kişi seç"); return; }
    if (!proposedAt) { setError("Tarih/saat gir"); return; }
    setError(null);
    startTransition(async () => {
      const result = await requestMeeting({ to_user: toUserId, proposed_at: proposedAt, location, note });
      if (result.error) { setError(result.error); return; }
      setModalOpen(false);
      router.refresh();
    });
  }

  async function handleRespond(meetingId: string, status: "accepted" | "declined") {
    startTransition(async () => {
      await respondToMeeting(meetingId, status);
      router.refresh();
    });
  }

  const upcoming = meetings.filter((m) => m.status !== "declined" && new Date(m.proposed_at) >= new Date());
  const past = meetings.filter((m) => m.status === "declined" || new Date(m.proposed_at) < new Date());

  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Toplantılarım</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {upcoming.length} yaklaşan toplantı
            </p>
          </div>
          <Button variant="gradient" size="sm" onClick={openModal} disabled={connections.length === 0}>
            <Plus className="w-4 h-4" /> Toplantı Öner
          </Button>
        </motion.div>

        {connections.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-400/8 border border-yellow-400/15 text-yellow-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Toplantı önermek için önce bağlantı kurman gerekiyor.
          </motion.div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
            <p className="text-xs text-muted-foreground px-1 font-medium uppercase tracking-wide">Yaklaşan</p>
            {upcoming.map((m, i) => <MeetingCard key={m.id} meeting={m} userId={profile.id} index={i} onRespond={handleRespond} isPending={isPending} />)}
          </motion.div>
        )}

        {/* Empty */}
        {meetings.length === 0 && (
          <motion.div initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
            <CalendarClock className="w-12 h-12 text-muted-foreground/25 mb-3" />
            <p className="text-muted-foreground font-medium">Henüz toplantı yok</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Bağlantılarından birine toplantı öner.</p>
          </motion.div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground px-1 font-medium uppercase tracking-wide">Geçmiş</p>
            {past.map((m, i) => <MeetingCard key={m.id} meeting={m} userId={profile.id} index={i} onRespond={handleRespond} isPending={isPending} />)}
          </div>
        )}
      </div>

      {/* REQUEST MODAL */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toplantı Öner</DialogTitle>
            <DialogDescription>Bağlantına tarih, saat ve yer bilgisi gönder.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Kişi *</Label>
              {preselectedName ? (
                <p className="text-sm text-white px-3 py-2 rounded-lg bg-white/5 border border-white/8">{preselectedName}</p>
              ) : (
                <Select value={toUserId} onValueChange={setToUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bağlantı seç..." />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((c) => (
                      <SelectItem key={c.other?.id} value={c.other?.id ?? ""}>
                        {c.other?.full_name || c.other?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet-dt">Tarih & Saat *</Label>
              <Input
                id="meet-dt"
                type="datetime-local"
                value={proposedAt}
                onChange={(e) => setProposedAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet-loc">Buluşma Yeri</Label>
              <Input id="meet-loc" placeholder="A Giriş Kapısı, Kafeterya..." value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet-note">Not</Label>
              <Textarea id="meet-note" placeholder="Görüşmek istediğin konu..." value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>İptal</Button>
            <Button variant="gradient" onClick={handleRequest} disabled={isPending}>
              {isPending ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function MeetingCard({
  meeting, userId, index, onRespond, isPending,
}: {
  meeting: MeetingRow;
  userId: string;
  index: number;
  onRespond: (id: string, s: "accepted" | "declined") => void;
  isPending: boolean;
}) {
  const status = STATUS_MAP[meeting.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending;
  const isIncoming = meeting.to_user === userId;
  const dt = new Date(meeting.proposed_at);

  return (
    <motion.div
      initial={{ y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl border border-white/8 p-5"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
          <UserCircle2 className="w-5 h-5 text-brand-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-white truncate">{meeting.other?.full_name || "İsimsiz"}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarCheck className="w-3 h-3" />
              {dt.toLocaleDateString("tr-TR")} · {dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {meeting.location}
              </span>
            )}
          </div>
          {meeting.note && (
            <p className="text-xs text-muted-foreground mt-1.5 italic">&quot;{meeting.note}&quot;</p>
          )}
        </div>

        {/* Accept/Decline for incoming pending */}
        {isIncoming && meeting.status === "pending" && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onRespond(meeting.id, "accepted")} disabled={isPending}
              className="p-2 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => onRespond(meeting.id, "declined")} disabled={isPending}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {!isIncoming && meeting.status === "pending" && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Clock className="w-3.5 h-3.5" /> Bekliyor
          </span>
        )}
      </div>
    </motion.div>
  );
}
