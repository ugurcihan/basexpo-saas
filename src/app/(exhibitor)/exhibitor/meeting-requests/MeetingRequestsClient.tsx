"use client";

import { EXHIBITOR_NAV } from "../_nav";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Building2, Package, QrCode, Users,
  TrendingUp, Settings, MessageSquare, Brain, CalendarClock,
  Store, CheckCircle2, XCircle, Clock, UserCircle2, Calendar,
  StickyNote,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { respondToMeeting } from "@/features/connections/actions";
import type { Profile } from "@/types";
import type { FirmMeetingRequest } from "@/features/connections/actions";

const NAV_ITEMS = [
  { label: "Panel",               href: "/exhibitor",                    icon: LayoutDashboard },
  { label: "Marka Profili",       href: "/exhibitor/profile",            icon: Building2 },
  { label: "QR Yarat",            href: "/exhibitor/qr",                 icon: QrCode },
  { label: "Ürünlerim",           href: "/exhibitor/products",           icon: Package },
  { label: "Ziyaretçilerim",      href: "/exhibitor/leads",              icon: Users },
  { label: "Mesajlar",            href: "/exhibitor/messages",           icon: MessageSquare },
  { label: "Analiz AI",           href: "/exhibitor/analytics",          icon: Brain },
  { label: "Yaklaşan Fuarlar",    href: "/exhibitor/upcoming-fairs",     icon: CalendarClock },
  { label: "Fuar Standlarım",     href: "/exhibitor/my-booths",          icon: Store },
  { label: "Randevu Talepleri",   href: "/exhibitor/meeting-requests",   icon: CalendarClock },
  { label: "Satış Pipeline'ı", href: "/exhibitor/pipeline",       icon: Workflow },
  { label: "ROI Raporu",          href: "/exhibitor/roi-report",         icon: TrendingUp },
  { label: "Ayarlar",             href: "/exhibitor/settings",           icon: Settings },
];

interface Props {
  profile: Profile;
  requests: FirmMeetingRequest[];
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusConfig(status: string) {
  switch (status) {
    case "accepted":
      return { label: "Onaylandı", badge: <Badge variant="cyan" className="text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Onaylandı</Badge> };
    case "declined":
      return { label: "Reddedildi", badge: <Badge className="text-xs bg-red-500/15 border-red-500/25 text-red-400"><XCircle className="w-3 h-3 mr-1" />Reddedildi</Badge> };
    default:
      return { label: "Bekliyor", badge: <Badge className="text-xs bg-amber-500/15 border-amber-500/25 text-amber-400"><Clock className="w-3 h-3 mr-1" />Bekliyor</Badge> };
  }
}

export function MeetingRequestsClient({ profile, requests: initialRequests }: Props) {
  const [isPending, startTransition] = useTransition();
  const [requests, setRequests] = useState(initialRequests);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  function handleRespond(id: string, action: "accepted" | "declined") {
    startTransition(async () => {
      const result = await respondToMeeting(id, action);
      if ((result as { error?: string })?.error) {
        setFeedback((prev) => ({ ...prev, [id]: "Bir hata oluştu." }));
        return;
      }
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: action } : r)
      );
    });
  }

  const pending = requests.filter((r) => r.status === "pending");
  const others = requests.filter((r) => r.status !== "pending");

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Randevu Talepleri</h1>
          </div>
          <p className="text-muted-foreground">
            Ziyaretçilerden gelen randevu istekleri — {pending.length} bekleyen.
          </p>
        </motion.div>

        {requests.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-violet/8 border border-brand-violet/15 flex items-center justify-center mb-4">
              <CalendarClock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-semibold text-white mb-2">Henüz randevu talebi yok</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ziyaretçiler firmanızı AI Öneriler&apos;de veya QR tarama yaptıklarında randevu talep edebilirler.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Pending section */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                  Bekleyen ({pending.length})
                </h2>
                {pending.map((req, i) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    i={i}
                    isPending={isPending}
                    feedback={feedback[req.id]}
                    onAccept={() => handleRespond(req.id, "accepted")}
                    onDecline={() => handleRespond(req.id, "declined")}
                  />
                ))}
              </div>
            )}

            {/* Past requests */}
            {others.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
                  Geçmiş ({others.length})
                </h2>
                {others.map((req, i) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    i={i}
                    isPending={isPending}
                    feedback={feedback[req.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function RequestCard({
  req, i, isPending, feedback, onAccept, onDecline,
}: {
  req: FirmMeetingRequest;
  i: number;
  isPending: boolean;
  feedback?: string;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const { badge } = statusConfig(req.status);
  const isPendingStatus = req.status === "pending";

  return (
    <motion.div
      initial={{ y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 * i }}
      className={`glass rounded-xl border p-5 space-y-4 ${
        isPendingStatus ? "border-brand-violet/20" : "border-white/8"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0">
            <UserCircle2 className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">
              {req.visitor?.full_name || req.visitor?.email || "Ziyaretçi"}
            </p>
            <p className="text-xs text-muted-foreground">{req.visitor?.email}</p>
          </div>
        </div>
        {badge}
      </div>

      {/* Details */}
      <div className="space-y-2">
        {req.subject && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-16 flex-shrink-0">Konu:</span>
            <span className="text-white font-medium">{req.subject}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Önerilen:</span>
          <span className="text-white">{formatDateTime(req.proposed_at)}</span>
        </div>
        {req.note && (
          <div className="flex items-start gap-2 text-sm">
            <StickyNote className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground line-clamp-3">{req.note}</p>
          </div>
        )}
        {req.visitor?.interests && req.visitor.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {req.visitor.interests.slice(0, 4).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-muted-foreground">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {feedback && <p className="text-xs text-red-400">{feedback}</p>}

      {/* Actions */}
      {isPendingStatus && onAccept && onDecline && (
        <div className="flex gap-2 pt-1 border-t border-white/6">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-red-400 border-red-500/20 hover:bg-red-500/10"
            onClick={onDecline}
            disabled={isPending}
          >
            <XCircle className="w-3.5 h-3.5" /> Reddet
          </Button>
          <Button
            size="sm"
            variant="gradient"
            className="flex-1"
            onClick={onAccept}
            disabled={isPending}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Onayla
          </Button>
        </div>
      )}
    </motion.div>
  );
}
