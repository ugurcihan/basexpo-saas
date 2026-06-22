"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Sparkles, QrCode, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
  MapPin, Calendar, Clock, CheckCircle2, Users2, ChevronRight,
} from "lucide-react";
import { registerForEvent, joinWaitlist } from "@/features/events/registrationActions";
import type { Profile } from "@/types";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "QR Badge'im",      href: "/visitor/badge",             icon: QrCode },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

interface FairEvent {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity: number | null;
  organizer_id: string;
}

interface Registration {
  event_id: string;
  status: string;
  ticket_code: string | null;
}

interface Props {
  profile: Profile;
  events: FairEvent[];
  myRegistrations: Registration[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function UpcomingFairsClient({ profile, events, myRegistrations }: Props) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const regMap = Object.fromEntries(myRegistrations.map((r) => [r.event_id, r]));

  function handleRegister(eventId: string, isFull: boolean) {
    startTransition(async () => {
      const action = isFull ? joinWaitlist : registerForEvent;
      const result = await action(eventId);
      if (result?.error) {
        setFeedback((prev) => ({ ...prev, [eventId]: result.error }));
      } else {
        setFeedback((prev) => ({ ...prev, [eventId]: isFull ? "Bekleme listesine alındınız!" : "Kayıt başarılı! Biletiniz oluşturuldu." }));
      }
    });
  }

  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Yaklaşan Fuarlar</h1>
          </div>
          <p className="text-muted-foreground">
            Yaklaşan fuarlara kayıt olun ve fuar biletinizi alın.
          </p>
        </motion.div>

        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
          >
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-semibold text-white mb-2">Yaklaşan fuar bulunamadı</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Organizatörler fuar duyurduğunda burada görünecek.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {events.map((event, i) => {
              const reg = regMap[event.id];
              const isRegistered = reg?.status === "confirmed";
              const isWaitlisted = reg?.status === "waitlisted";
              const isFull = event.capacity !== null && event.capacity <= 0;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="glass rounded-2xl border border-white/8 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h2 className="font-semibold text-white text-lg">{event.name}</h2>
                        {isRegistered && (
                          <Badge variant="cyan" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Kayıtlı
                          </Badge>
                        )}
                        {isWaitlisted && (
                          <Badge variant="gold" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" /> Bekleme Listesi
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" /> {event.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(event.start_date)} — {formatDate(event.end_date)}
                        </span>
                        {event.capacity !== null && (
                          <span className="flex items-center gap-1.5">
                            <Users2 className="w-3.5 h-3.5" />
                            {isFull ? (
                              <span className="text-red-400">Kapasite dolu</span>
                            ) : (
                              <span>{event.capacity} kişilik</span>
                            )}
                          </span>
                        )}
                      </div>

                      {feedback[event.id] && (
                        <p className="text-sm text-brand-violet-light mb-3">{feedback[event.id]}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {isRegistered ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/visitor/tickets`}>
                            <Ticket className="w-4 h-4" /> Biletim
                          </a>
                        </Button>
                      ) : isWaitlisted ? (
                        <Button variant="outline" size="sm" disabled>
                          <Clock className="w-4 h-4" /> Bekliyorsunuz
                        </Button>
                      ) : (
                        <Button
                          variant={isFull ? "outline" : "gradient"}
                          size="sm"
                          disabled={pending}
                          onClick={() => handleRegister(event.id, isFull)}
                        >
                          {isFull ? (
                            <><Clock className="w-4 h-4" /> Bekleme Listesi</>
                          ) : (
                            <><Ticket className="w-4 h-4" /> Kayıt Ol</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
