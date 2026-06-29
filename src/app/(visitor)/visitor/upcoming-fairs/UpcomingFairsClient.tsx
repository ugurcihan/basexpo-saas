"use client";
import { VISITOR_NAV } from "../_nav";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Sparkles, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
  MapPin, Calendar, Clock, CheckCircle2, Users2, AlertCircle,
  FileCheck, Search, Tag, ChevronRight,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { registerForEvent, joinWaitlist } from "@/features/events/registrationActions";
import type { Profile } from "@/types";


interface FairEvent {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  capacity: number | null;
  requires_approval: boolean;
  organizer_id: string;
  category: string | null;
  tags: string[] | null;
  cover_url: string | null;
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
  const [feedback, setFeedback] = useState<Record<string, { msg: string; type: "success" | "error" }>>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[];
  const months = Array.from(new Set(events.map((e) => {
    const d = new Date(e.start_date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))).sort();

  const filteredEvents = events.filter((ev) => {
    const q = search.toLowerCase();
    const matchSearch = !q || ev.name.toLowerCase().includes(q) || ev.location.toLowerCase().includes(q);
    const matchCat = !activeCategory || ev.category === activeCategory;
    const matchMonth = !activeMonth || new Date(ev.start_date).toISOString().slice(0, 7) === activeMonth;
    return matchSearch && matchCat && matchMonth;
  });

  const regMap = Object.fromEntries(myRegistrations.map((r) => [r.event_id, r]));

  function handleRegister(eventId: string, isFull: boolean) {
    startTransition(async () => {
      const action = isFull ? joinWaitlist : registerForEvent;
      const result = await action(eventId);
      const errMsg = (result as { error?: string } | undefined)?.error;
      if (errMsg) {
        setFeedback((prev) => ({ ...prev, [eventId]: { msg: errMsg, type: "error" } }));
      } else {
        const status = (result as { status?: string } | undefined)?.status;
        let msg = "Kayıt başarılı! Biletiniz oluşturuldu.";
        if (status === "pending_approval") msg = "Başvurunuz alındı! Organizatör onayı bekleniyor.";
        else if (status === "waitlisted") msg = "Bekleme listesine alındınız!";
        setFeedback((prev) => ({ ...prev, [eventId]: { msg, type: "success" } }));
      }
    });
  }

  const isProfileComplete = !!(profile.full_name && profile.phone_number);

  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={VISITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-brand-violet-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Yaklaşan Fuarlar</h1>
          </div>
          <p className="text-muted-foreground">
            Yaklaşan fuarlara kayıt olun ve kişisel QR biletinizi alın.
          </p>
        </motion.div>

        {/* Arama */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Fuar adı veya konum ara..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-violet/40 transition-all"
          />
        </div>

        {/* Kategori filtreleri */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                !activeCategory ? "bg-brand-violet/20 border border-brand-violet/40 text-brand-violet-light" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"
              }`}
            >Tümü</button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat ? "bg-brand-violet/20 border border-brand-violet/40 text-brand-violet-light" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"
                }`}
              >{cat}</button>
            ))}
          </div>
        )}

        {/* Ay filtreleri */}
        {months.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {months.map((m) => {
              const [y, mo] = m.split("-");
              const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
              return (
                <button
                  key={m}
                  onClick={() => setActiveMonth(activeMonth === m ? null : m)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeMonth === m ? "bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan" : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"
                  }`}
                >{label}</button>
              );
            })}
          </div>
        )}

        {/* Profile incomplete warning */}
        {!isProfileComplete && (
          <motion.div
            initial={{ y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-300 font-medium">Profilinizi tamamlayın</p>
              <p className="text-amber-200/70 text-xs mt-0.5">
                Bilet QR kodu için telefon numaranızın kayıtlı olması gerekiyor.{" "}
                <a href="/visitor/settings" className="underline hover:text-white">Ayarlar</a>&apos;dan güncelleyebilirsiniz.
              </p>
            </div>
          </motion.div>
        )}

        {filteredEvents.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
          >
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-semibold text-white mb-2">Fuar bulunamadı</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              {search || activeCategory || activeMonth ? "Filtrelerinizi değiştirin." : "Organizatörler fuar duyurduğunda burada görünecek."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, i) => {
              const reg = regMap[event.id];
              const isRegistered = reg?.status === "confirmed";
              const isWaitlisted = reg?.status === "waitlisted";
              const isPendingApproval = reg?.status === "pending_approval";
              const isFull = event.capacity !== null && event.capacity <= 0;
              const fb = feedback[event.id];

              return (
                <motion.div
                  key={event.id}
                  initial={{ y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="glass rounded-2xl border border-white/8 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Link href={`/visitor/upcoming-fairs/${event.id}`} className="font-semibold text-white text-lg hover:text-brand-violet-light transition-colors">{event.name}</Link>
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
                        {isPendingApproval && (
                          <Badge className="text-xs bg-amber-500/15 border-amber-500/25 text-amber-400">
                            <FileCheck className="w-3 h-3 mr-1" /> Onay Bekleniyor
                          </Badge>
                        )}
                        {event.requires_approval && !reg && (
                          <Badge className="text-xs bg-brand-indigo/15 border-brand-indigo/25 text-brand-indigo-light">
                            Başvuru Gerekli
                          </Badge>
                        )}
                      </div>

                      {/* Category + tags */}
                      {(event.category || (event.tags && event.tags.length > 0)) && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {event.category && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-indigo/15 border border-brand-indigo/25 text-brand-indigo-light">{event.category}</span>
                          )}
                          {event.tags?.slice(0, 3).map((tag) => (
                            <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-white/8 border border-white/10 text-muted-foreground">
                              <Tag className="w-2.5 h-2.5" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}

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

                      {fb && (
                        <p className={`text-sm mb-3 ${fb.type === "success" ? "text-brand-violet-light" : "text-red-400"}`}>
                          {fb.msg}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {isRegistered ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href="/visitor/tickets">
                            <Ticket className="w-4 h-4" /> Biletim
                          </a>
                        </Button>
                      ) : isWaitlisted ? (
                        <Button variant="outline" size="sm" disabled>
                          <Clock className="w-4 h-4" /> Bekliyorsunuz
                        </Button>
                      ) : isPendingApproval ? (
                        <Button variant="outline" size="sm" disabled>
                          <AlertCircle className="w-4 h-4" /> İnceleniyor
                        </Button>
                      ) : (
                        <Button
                          variant={isFull && !event.requires_approval ? "outline" : "gradient"}
                          size="sm"
                          disabled={pending}
                          onClick={() => handleRegister(event.id, isFull && !event.requires_approval)}
                        >
                          {event.requires_approval ? (
                            <><FileCheck className="w-4 h-4" /> Başvur</>
                          ) : isFull ? (
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
