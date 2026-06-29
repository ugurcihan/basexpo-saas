"use client";
import { VISITOR_NAV } from "../_nav";

import { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, Sparkles, QrCode, Heart, Users,
  CalendarClock, Settings, UserCircle2, UserPlus, Check,
  X, Clock, Search, CalendarCheck, MessageCircle,
  CalendarDays, Ticket,
  Trophy,
} from "lucide-react";
import {
  sendConnectionRequest,
  acceptConnection,
  rejectConnection,
  type VisitorProfile,
  type ConnectionRow,
} from "@/features/connections/actions";
import Link from "next/link";
import type { Profile } from "@/types";


type Tab = "discover" | "incoming" | "accepted";

interface Props {
  profile: Profile;
  incoming: ConnectionRow[];
  outgoing: ConnectionRow[];
  accepted: ConnectionRow[];
  discoverable: VisitorProfile[];
}

export function ConnectionsClient({ profile, incoming, outgoing, accepted, discoverable }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [search, setSearch] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return discoverable
      .filter((v) => !q || v.full_name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q))
      .map((v) => ({
        ...v,
        commonInterests: v.interests.filter((i) => profile.interests.includes(i)),
      }))
      .sort((a, b) => b.commonInterests.length - a.commonInterests.length);
  }, [discoverable, search, profile.interests]);

  async function handleSend(toId: string) {
    setError(null);
    startTransition(async () => {
      const result = await sendConnectionRequest(toId);
      if (result.error) { setError(result.error); return; }
      setSentIds((prev) => new Set(prev).add(toId));
      router.refresh();
    });
  }

  async function handleAccept(id: string) {
    startTransition(async () => {
      await acceptConnection(id);
      router.refresh();
    });
  }

  async function handleReject(id: string) {
    startTransition(async () => {
      await rejectConnection(id);
      router.refresh();
    });
  }

  const tabs = [
    { key: "discover" as Tab, label: "Keşfet",            count: filtered.length },
    { key: "incoming" as Tab, label: "Gelen İstekler",    count: incoming.length },
    { key: "accepted" as Tab, label: "Bağlantılarım",     count: accepted.length },
  ];

  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={VISITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-5">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">Bağlantılar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {accepted.length} bağlantı · {incoming.length} bekleyen istek
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? "bg-brand-indigo/25 text-white"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab.key === "incoming" && tab.count > 0
                    ? "bg-brand-cyan/25 text-brand-cyan"
                    : "bg-white/10 text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <X className="w-4 h-4" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── DISCOVER ── */}
          {activeTab === "discover" && (
            <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="İsim veya e-posta ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="glass rounded-2xl border border-white/8 p-10 flex flex-col items-center text-center">
                  <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Keşfedilecek ziyaretçi yok</p>
                </div>
              ) : (
                filtered.map((v, i) => (
                  <motion.div
                    key={v.id}
                    initial={{ y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="glass rounded-xl border border-white/8 hover:border-white/12 transition-all p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-violet/15 border border-brand-violet/20 flex items-center justify-center flex-shrink-0">
                      <UserCircle2 className="w-5 h-5 text-brand-violet-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{v.full_name || "İsimsiz"}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.email}</p>
                      {v.commonInterests.length > 0 && (
                        <p className="text-xs text-brand-cyan mt-0.5">
                          {v.commonInterests.length} ortak ilgi · {v.commonInterests.slice(0, 2).join(", ")}
                        </p>
                      )}
                    </div>
                    <Button
                      variant={sentIds.has(v.id) ? "outline" : "gradient"}
                      size="sm"
                      onClick={() => handleSend(v.id)}
                      disabled={isPending || sentIds.has(v.id)}
                      className="flex-shrink-0"
                    >
                      {sentIds.has(v.id) ? (
                        <><Clock className="w-3.5 h-3.5" /> Gönderildi</>
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5" /> Bağlan</>
                      )}
                    </Button>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ── INCOMING ── */}
          {activeTab === "incoming" && (
            <motion.div key="incoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {incoming.length === 0 ? (
                <div className="glass rounded-2xl border border-white/8 p-10 flex flex-col items-center text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Bekleyen bağlantı isteği yok</p>
                </div>
              ) : (
                incoming.map((conn, i) => (
                  <motion.div
                    key={conn.id}
                    initial={{ y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl border border-brand-cyan/15 p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-cyan/15 border border-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                      <UserCircle2 className="w-5 h-5 text-brand-cyan" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{conn.other?.full_name || "İsimsiz"}</p>
                      <p className="text-xs text-muted-foreground">{conn.other?.email}</p>
                      {conn.other?.interests?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {conn.other.interests.slice(0, 3).map((int) => (
                            <span key={int} className="px-1.5 py-0.5 rounded text-xs bg-white/5 text-muted-foreground">{int}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(conn.id)}
                        disabled={isPending}
                        className="p-2 rounded-lg bg-green-500/15 border border-green-500/25 text-green-400 hover:bg-green-500/25 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(conn.id)}
                        disabled={isPending}
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}

              {/* Outgoing */}
              {outgoing.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground px-1 mb-2">Gönderilen İstekler ({outgoing.length})</p>
                  {outgoing.map((conn) => (
                    <div key={conn.id} className="glass rounded-xl border border-white/8 p-3 flex items-center gap-3 mb-2">
                      <UserCircle2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{conn.other?.full_name || conn.other?.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Bekliyor
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ACCEPTED ── */}
          {activeTab === "accepted" && (
            <motion.div key="accepted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {accepted.length === 0 ? (
                <div className="glass rounded-2xl border border-white/8 p-10 flex flex-col items-center text-center">
                  <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Henüz bağlantın yok</p>
                  <button onClick={() => setActiveTab("discover")} className="mt-3 text-xs text-brand-indigo-light hover:underline">
                    Keşfete git →
                  </button>
                </div>
              ) : (
                accepted.map((conn, i) => (
                  <motion.div
                    key={conn.id}
                    initial={{ y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass rounded-xl border border-white/8 hover:border-white/12 transition-all p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-indigo/15 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
                      <UserCircle2 className="w-5 h-5 text-brand-indigo-light" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{conn.other?.full_name || "İsimsiz"}</p>
                      <p className="text-xs text-muted-foreground truncate">{conn.other?.email}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/visitor/meetings?with=${conn.other?.id}&name=${encodeURIComponent(conn.other?.full_name || "")}`}>
                        <CalendarCheck className="w-3.5 h-3.5" /> Toplantı
                      </Link>
                    </Button>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
