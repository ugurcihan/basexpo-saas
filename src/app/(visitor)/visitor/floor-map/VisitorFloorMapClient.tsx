"use client";
import { VISITOR_NAV } from "../_nav";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FloorMapViewer } from "@/components/map/FloorMapViewer";
import {
  LayoutDashboard, CalendarDays, Ticket, Sparkles, Heart,
  Users, CalendarClock, Settings, Map,
  Trophy,
} from "lucide-react";
import type { Profile } from "@/types";
import type { HallWithMap } from "@/features/events/hallMapActions";


interface Props {
  profile: Profile;
  halls: HallWithMap[];
  eventName: string;
}

export function VisitorFloorMapClient({ profile, halls, eventName }: Props) {
  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={VISITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <Map className="w-5 h-5 text-brand-violet-light" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Fuar Haritası</h1>
              {eventName && <p className="text-sm text-muted-foreground">{eventName}</p>}
            </div>
          </div>
        </motion.div>

        {halls.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
            <Map className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-white font-medium">Kayıtlı Fuar Bulunamadı</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Bir fuara kayıt olduktan sonra o fuarın salon haritasını burada görebilirsin.
            </p>
          </div>
        ) : (
          <motion.div initial={{ y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <FloorMapViewer halls={halls} />
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
