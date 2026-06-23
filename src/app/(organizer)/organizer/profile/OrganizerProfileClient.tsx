"use client";

import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { UserCircle2 } from "lucide-react";
import type { Profile } from "@/types";
import { ORGANIZER_NAV } from "../_nav";

export function OrganizerProfileClient({ profile }: { profile: Profile }) {
  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Organizatör Profili</h1>
          </div>
          <p className="text-muted-foreground">
            Organizasyon bilgilerinizi ve marka detaylarınızı yönetin.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass rounded-2xl border border-white/8 p-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center flex-shrink-0">
              <UserCircle2 className="w-8 h-8 text-brand-indigo-light" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{profile.full_name || "—"}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Profil düzenleme özellikleri yakında burada olacak.
          </p>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
