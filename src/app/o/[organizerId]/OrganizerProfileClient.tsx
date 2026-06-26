"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users, Calendar, MapPin, UserCheck, UserPlus, Building2,
  ExternalLink, CalendarDays, Tag, Trophy, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { followOrganizer, unfollowOrganizer } from "@/features/organizers/organizerActions";
import type { OrganizerProfile, OrganizerEvent } from "@/features/organizers/organizerActions";
import type { Profile } from "@/types";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:    { label: "Aktif",    color: "text-green-400 bg-green-500/15 border-green-500/30" },
  published: { label: "Yayında",  color: "text-brand-gold bg-brand-gold/15 border-brand-gold/30" },
  ended:     { label: "Tamamlandı", color: "text-muted-foreground bg-white/5 border-white/10" },
};

interface Props {
  organizer: OrganizerProfile;
  events: OrganizerEvent[];
  viewerProfile: Profile | null;
  initialIsFollowing: boolean;
}

export function OrganizerProfileClient({ organizer, events, viewerProfile, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(organizer.follower_count);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleFollow() {
    if (!viewerProfile) {
      setMsg("Takip etmek için giriş yapmanız gerekiyor.");
      return;
    }
    startTransition(async () => {
      if (isFollowing) {
        const res = await unfollowOrganizer(organizer.id);
        if (!res.error) { setIsFollowing(false); setFollowerCount(c => c - 1); }
      } else {
        const res = await followOrganizer(organizer.id);
        if (!res.error) { setIsFollowing(true); setFollowerCount(c => c + 1); }
      }
    });
  }

  const upcomingEvents = events.filter(e => e.status === "active" || e.status === "published");
  const pastEvents = events.filter(e => e.status === "ended");

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Organizer Header */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }}
          className="glass rounded-2xl border border-white/10 p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {organizer.avatar_url ? (
                <img
                  src={organizer.avatar_url}
                  alt={organizer.full_name}
                  className="w-20 h-20 rounded-2xl object-cover border border-white/15"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center">
                  <Building2 className="w-9 h-9 text-brand-indigo-light" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">{organizer.full_name}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Fuar Organizatörü</p>
                </div>
                <Button
                  onClick={handleFollow}
                  disabled={isPending}
                  variant={isFollowing ? "ghost" : "gradient"}
                  className={`flex items-center gap-2 text-sm ${isFollowing ? "border border-white/15 hover:border-red-500/30 hover:text-red-400" : ""}`}
                >
                  {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? "Takip Ediliyor" : "Takip Et"}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 mt-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span><span className="text-white font-semibold">{followerCount}</span> takipçi</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span><span className="text-white font-semibold">{organizer.event_count}</span> fuar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Org details */}
          {(organizer.org_name || organizer.website || organizer.city || organizer.bio) && (
            <div className="mt-4 border-t border-white/8 pt-4 space-y-2">
              {organizer.org_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{organizer.org_name}</span>
                </div>
              )}
              {organizer.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{organizer.city}</span>
                </div>
              )}
              {organizer.website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0 text-brand-indigo-light" />
                  <a href={organizer.website} target="_blank" rel="noopener noreferrer" className="text-brand-indigo-light hover:underline truncate">
                    {organizer.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              {organizer.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">{organizer.bio}</p>
              )}
            </div>
          )}

          {/* Auth hint */}
          {msg && (
            <p className="mt-3 text-xs text-brand-gold/80 flex items-center gap-1.5">
              <span>{msg}</span>
              <Link href="/login" className="underline underline-offset-2 hover:text-brand-gold">Giriş yap</Link>
            </p>
          )}
        </motion.div>

        {/* Aktif / Yaklaşan Fuarlar */}
        {upcomingEvents.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.07 }}>
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-brand-indigo-light" />
              <h2 className="font-semibold text-white">Aktif ve Yaklaşan Fuarlar</h2>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map(ev => <EventCard key={ev.id} event={ev} />)}
            </div>
          </motion.div>
        )}

        {/* Geçmiş Fuarlar */}
        {pastEvents.length > 0 && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.12 }}>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-semibold text-white">Geçmiş Fuarlar</h2>
            </div>
            <div className="space-y-3">
              {pastEvents.map(ev => <EventCard key={ev.id} event={ev} />)}
            </div>
          </motion.div>
        )}

        {events.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Henüz yayında fuar yok.</p>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground/50 pb-6">
          <span className="font-display font-bold text-white/30">BasExpo</span> · Fuar Yönetim Platformu
        </div>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: OrganizerEvent }) {
  const s = STATUS_MAP[event.status] ?? STATUS_MAP.ended;
  return (
    <Link href={`/e/${event.id}`}
      className="block glass rounded-xl border border-white/8 hover:border-brand-indigo/30 transition-colors overflow-hidden group">
      <div className="flex gap-4">
        {event.cover_url ? (
          <img
            src={event.cover_url}
            alt={event.name}
            className="w-24 h-24 object-cover flex-shrink-0 group-hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="w-24 h-24 bg-brand-indigo/10 flex-shrink-0 flex items-center justify-center">
            <CalendarDays className="w-8 h-8 text-brand-indigo/40" />
          </div>
        )}
        <div className="py-3 pr-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${s.color}`}>{s.label}</span>
            {event.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 text-muted-foreground">{event.category}</span>
            )}
          </div>
          <p className="font-semibold text-white text-sm truncate group-hover:text-brand-indigo-light transition-colors">{event.name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" /> {event.location}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(event.start_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        <div className="flex items-center pr-4">
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-brand-indigo-light transition-colors" />
        </div>
      </div>
    </Link>
  );
}
