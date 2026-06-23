"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Sparkles, Heart, Users,
  CalendarClock, Settings, CalendarDays, Ticket,
  Building2, Tag, MapPin, Trash2, CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeFavorite } from "@/features/favorites/actions";
import { RequestMeetingModal } from "@/components/meeting/RequestMeetingModal";
import type { Profile } from "@/types";
import type { FavoriteExhibitor } from "@/features/favorites/actions";

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

interface Props {
  profile: Profile;
  favorites: FavoriteExhibitor[];
}

export function FavoritesClient({ profile, favorites: initialFavorites }: Props) {
  const [isPending, startTransition] = useTransition();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [meetingModal, setMeetingModal] = useState<{ exhibitorId: string; exhibitorName: string } | null>(null);

  function handleRemove(exhibitorId: string) {
    startTransition(async () => {
      await removeFavorite(exhibitorId);
      setFavorites((prev) => prev.filter((f) => f.exhibitor_id !== exhibitorId));
    });
  }

  return (
    <>
      {meetingModal && (
        <RequestMeetingModal
          exhibitorId={meetingModal.exhibitorId}
          exhibitorName={meetingModal.exhibitorName}
          isOpen={true}
          onClose={() => setMeetingModal(null)}
        />
      )}

      <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={NAV_ITEMS}>
        <div className="p-6 lg:p-8 space-y-6">
          <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <h1 className="font-display text-2xl font-bold text-white">Favorilerim</h1>
            </div>
            <p className="text-muted-foreground">
              Beğendiğiniz firmalar — {favorites.length} firma favorilenmiş.
            </p>
          </motion.div>

          {favorites.length === 0 ? (
            <motion.div
              initial={{ y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/8 border border-red-500/15 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="font-semibold text-white mb-2">Henüz favori firma yok</h2>
              <p className="text-sm text-muted-foreground max-w-sm mb-5">
                AI Öneriler sayfasındaki firma kartlarından kalp ikonuna tıklayarak favorilerinize ekleyebilirsiniz.
              </p>
              <Button variant="gradient" size="sm" asChild>
                <Link href="/visitor/recommendations">
                  <Sparkles className="w-4 h-4" /> AI Önerileri Gör
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {favorites.map((fav, i) => {
                const ex = fav.exhibitor;
                return (
                  <motion.div
                    key={fav.id}
                    initial={{ y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    className="glass rounded-xl border border-white/8 hover:border-white/15 transition-all p-5 flex flex-col gap-4"
                  >
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {ex.logo_url ? (
                          <Image
                            src={ex.logo_url}
                            alt={ex.company_name}
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{ex.company_name}</h3>
                        {ex.event_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {ex.event_name}
                            {ex.event_location && ` · ${ex.event_location}`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(ex.id)}
                        disabled={isPending}
                        className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors flex-shrink-0"
                        title="Favoriden çıkar"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>

                    {/* Description */}
                    {ex.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {ex.description}
                      </p>
                    )}

                    {/* Tags */}
                    {ex.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {ex.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs bg-white/5 text-muted-foreground"
                          >
                            <Tag className="w-2.5 h-2.5" /> {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1 border-t border-white/6">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        asChild
                      >
                        <Link href={`/scan/${ex.qr_token}`}>
                          Profili Gör
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="gradient"
                        className="flex-1 text-xs"
                        onClick={() => setMeetingModal({ exhibitorId: ex.id, exhibitorName: ex.company_name })}
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        Randevu
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardShell>
    </>
  );
}
