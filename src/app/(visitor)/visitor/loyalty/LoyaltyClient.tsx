"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard, Sparkles, Heart, Users, CalendarClock,
  Settings, CalendarDays, Ticket, Trophy, Star, QrCode,
  Handshake, MapPin, Award, Medal, Crown,
} from "lucide-react";
import type { Profile } from "@/types";
import type { LoyaltyStats, RewardTierWithStats, WonReward, LeaderboardEntry } from "@/features/loyalty/actions";

const NAV_ITEMS = [
  { label: "Panel",            href: "/visitor",                  icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs",   icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",           icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations",   icon: Sparkles },
  { label: "Favorilerim",      href: "/visitor/favorites",         icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",       icon: Users },
  { label: "Puanlarım",        href: "/visitor/loyalty",           icon: Trophy },
  { label: "Toplantılarım",    href: "/visitor/meetings",          icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",          icon: Settings },
];

const REASON_CONFIG: Record<string, { label: string; icon: typeof QrCode; color: string }> = {
  checkin:     { label: "Fuar Girişi",     icon: MapPin,      color: "text-brand-cyan" },
  booth_visit: { label: "Stant Ziyareti",  icon: QrCode,      color: "text-brand-indigo-light" },
  meeting:     { label: "Toplantı",        icon: Handshake,   color: "text-brand-gold" },
  connection:  { label: "Bağlantı",        icon: Users,       color: "text-brand-violet-light" },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-brand-gold" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-slate-300" />;
  if (rank === 3) return <Medal className="w-4 h-4 text-amber-700" />;
  return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{rank}</span>;
}

// ─── Ödül İlerleme Çubuğu ────────────────────────────────────
function ProgressRewardBar({
  totalPoints,
  tiers,
  wonRewards,
}: {
  totalPoints: number;
  tiers: RewardTierWithStats[];
  wonRewards: WonReward[];
}) {
  if (tiers.length === 0) return null;
  const maxPoints = tiers[tiers.length - 1].points_required;
  const progressPct = Math.min((totalPoints / maxPoints) * 100, 100);

  const wonMap = new Map(wonRewards.map((w) => [w.tier_id, w]));

  return (
    <div className="glass rounded-2xl border border-white/8 p-5 space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-semibold text-white">Ödül Yolculuğu</p>
        <span className="text-xs text-muted-foreground">{totalPoints} / {maxPoints} puan</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-cyan"
        />
        {tiers.map((tier) => {
          const pct = Math.min((tier.points_required / maxPoints) * 100, 100);
          const reached = totalPoints >= tier.points_required;
          return (
            <div
              key={tier.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              <div className={`w-3 h-3 rounded-full border-2 ${reached ? "bg-brand-cyan border-brand-cyan" : "bg-brand-dark border-white/30"}`} />
            </div>
          );
        })}
      </div>

      {/* Reward tier chips */}
      <div className="flex flex-col gap-2">
        {tiers.map((tier) => {
          const reached = totalPoints >= tier.points_required;
          const myWin = wonMap.get(tier.id);
          const hasLimit = tier.max_winners !== null;

          return (
            <div
              key={tier.id}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border text-xs transition-all ${
                myWin
                  ? "glass-strong border-brand-gold/30 text-white"
                  : reached && !tier.is_full
                  ? "glass-strong border-brand-cyan/30 text-white"
                  : tier.is_full
                  ? "glass border-red-500/20 text-muted-foreground"
                  : "glass border-white/8 text-muted-foreground"
              }`}
            >
              <Star className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${myWin ? "text-brand-gold" : reached ? "text-brand-cyan" : "text-muted-foreground/50"}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${myWin ? "text-brand-gold" : reached ? "text-white" : "text-muted-foreground"}`}>
                  {tier.reward_title}
                </p>
                <p className={`text-[10px] mt-0.5 ${myWin ? "text-brand-gold/80" : reached ? "text-brand-cyan" : "text-muted-foreground/60"}`}>
                  {tier.points_required} puan
                  {!reached && ` · ${tier.points_required - totalPoints} puan daha`}
                  {reached && !myWin && !tier.is_full && " · Kazandın!"}
                  {tier.is_full && !myWin && " · Kontenjan doldu"}
                </p>
                {myWin && (
                  <p className="text-[10px] text-brand-gold font-bold mt-0.5">
                    Tebrikler! {myWin.rank}. kazanansın
                  </p>
                )}
                {hasLimit && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tier.is_full ? "bg-red-500" : "bg-brand-gold"}`}
                        style={{ width: `${Math.min((tier.winner_count / tier.max_winners!) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {tier.is_full
                        ? "Kontenjan doldu"
                        : `${tier.winner_count}/${tier.max_winners} kişi kazandı`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Leaderboard ──────────────────────────────────────────────
function LeaderboardSection({
  leaderboard,
  myVisitorId,
}: {
  leaderboard: LeaderboardEntry[];
  myVisitorId: string;
}) {
  if (leaderboard.length === 0) return null;
  return (
    <div className="glass rounded-2xl border border-white/8 p-5 space-y-3">
      <p className="text-sm font-semibold text-white">Liderlik Tablosu</p>
      <div className="space-y-2">
        {leaderboard.map((entry, idx) => {
          const isMe = entry.visitor_id === myVisitorId;
          return (
            <div
              key={entry.visitor_id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                isMe
                  ? "glass-strong border-brand-cyan/30"
                  : "glass border-white/5"
              }`}
            >
              <div className="w-5 flex-shrink-0 flex items-center justify-center">
                <RankIcon rank={idx + 1} />
              </div>
              <span className={`flex-1 font-medium truncate ${isMe ? "text-brand-cyan" : "text-white"}`}>
                {isMe ? "Sen" : (entry.full_name ?? "Ziyaretçi")}
              </span>
              <span className={`font-display font-bold ${isMe ? "text-brand-cyan" : "text-muted-foreground"}`}>
                {entry.total_points}p
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LoyaltyClient({
  profile,
  eventsWithPoints,
  selectedEventId,
  stats,
}: {
  profile: Profile;
  eventsWithPoints: {
    event_id: string;
    event_name: string;
    total_points: number;
    start_date: string;
    location: string;
  }[];
  selectedEventId: string | null;
  stats: LoyaltyStats | null;
}) {
  const router = useRouter();

  function switchEvent(id: string) {
    router.push(`/visitor/loyalty?event=${id}`);
  }

  const selectedEvent = eventsWithPoints.find((e) => e.event_id === selectedEventId);

  return (
    <DashboardShell role="visitor" userName={profile.full_name ?? ""} navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">Puanlarım</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Her fuarın puanları o fuara özel — bir fuardan diğerine geçmez.
          </p>
        </motion.div>

        {/* Fuar Seçici */}
        {eventsWithPoints.length > 0 ? (
          <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex flex-wrap gap-2">
              {eventsWithPoints.map((ev) => (
                <button
                  key={ev.event_id}
                  onClick={() => switchEvent(ev.event_id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                    ev.event_id === selectedEventId
                      ? "glass-strong border-brand-indigo/40 text-white"
                      : "glass border-white/8 text-muted-foreground hover:text-white hover:border-white/20"
                  }`}
                >
                  <Trophy className={`w-3.5 h-3.5 ${ev.event_id === selectedEventId ? "text-brand-cyan" : "text-muted-foreground/50"}`} />
                  <span>{ev.event_name}</span>
                  <span className={`text-xs font-bold ml-1 ${ev.event_id === selectedEventId ? "text-brand-cyan" : "text-muted-foreground/60"}`}>
                    {ev.total_points}p
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ y: 8 }} animate={{ y: 0 }}>
            <div className="glass rounded-2xl border border-white/8 p-8 text-center space-y-2">
              <Trophy className="w-10 h-10 text-brand-gold/40 mx-auto" />
              <p className="font-semibold text-white">Henüz puan kazanmadın</p>
              <p className="text-sm text-muted-foreground">
                Bir fuara katıl, stantları QR ile tara ve puan kazanmaya başla.
              </p>
            </div>
          </motion.div>
        )}

        {stats && selectedEvent && (
          <>
            {/* Toplam Puan + Sıralama */}
            <motion.div
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="glass-strong rounded-2xl border border-brand-cyan/20 p-6 text-center">
                <Trophy className="w-6 h-6 text-brand-gold mx-auto mb-2" />
                <p className="font-display text-4xl font-bold text-brand-cyan">{stats.totalPoints}</p>
                <p className="text-sm text-muted-foreground mt-1">Toplam Puan</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{selectedEvent.event_name}</p>
              </div>
              <div className="glass rounded-2xl border border-white/8 p-6 text-center">
                <Award className="w-6 h-6 text-brand-violet-light mx-auto mb-2" />
                {stats.rank ? (
                  <>
                    <p className="font-display text-4xl font-bold text-brand-violet-light">#{stats.rank}</p>
                    <p className="text-sm text-muted-foreground mt-1">Sıralaman</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl font-bold text-muted-foreground">—</p>
                    <p className="text-sm text-muted-foreground mt-1">Sıralama yükleniyor</p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Ödül progress */}
            {stats.rewardTiers.length > 0 && (
              <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.15 }}>
                <ProgressRewardBar
                  totalPoints={stats.totalPoints}
                  tiers={stats.rewardTiers}
                  wonRewards={stats.wonRewards}
                />
              </motion.div>
            )}

            {/* Rozetler */}
            {stats.earnedBadges.length > 0 && (
              <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.2 }}>
                <p className="text-sm font-semibold text-white mb-3">Kazanılan Rozetler ({stats.earnedBadges.length})</p>
                <div className="flex flex-wrap gap-3">
                  {stats.earnedBadges.map((eb) => (
                    <div
                      key={eb.id}
                      className="glass rounded-xl border border-brand-gold/20 px-4 py-2.5 flex items-center gap-2"
                    >
                      <span className="text-xl">{eb.badge.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{eb.badge.name}</p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {new Date(eb.earned_at).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Nasıl puan kazanırım */}
            <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.25 }}>
              <p className="text-sm font-semibold text-white mb-3">Nasıl puan kazanırsın?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: MapPin,    label: "Fuar Girişi",    pts: "+50", color: "text-brand-cyan" },
                  { icon: QrCode,    label: "Stant Ziyareti", pts: "+20", color: "text-brand-indigo-light" },
                  { icon: Handshake, label: "Toplantı",       pts: "+100", color: "text-brand-gold" },
                ].map(({ icon: Icon, label, pts, color }) => (
                  <div key={label} className="glass rounded-xl border border-white/8 p-4 text-center">
                    <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                    <p className={`font-display text-lg font-bold ${color}`}>{pts}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
                <div className="glass rounded-xl border border-white/8 p-4 text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-2 text-brand-gold" />
                  <p className="text-xs text-white font-semibold">Her fuarda</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sıfırdan başlar</p>
                </div>
              </div>
            </motion.div>

            {/* Leaderboard */}
            {stats.leaderboard.length > 0 && (
              <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.3 }}>
                <LeaderboardSection leaderboard={stats.leaderboard} myVisitorId={profile.id} />
              </motion.div>
            )}

            {/* Puan Geçmişi */}
            {stats.history.length > 0 && (
              <motion.div initial={{ y: 8 }} animate={{ y: 0 }} transition={{ delay: 0.35 }}>
                <p className="text-sm font-semibold text-white mb-3">Puan Geçmişi</p>
                <div className="space-y-2">
                  {stats.history.map((row) => {
                    const cfg = REASON_CONFIG[row.reason] ?? { label: row.reason, icon: Star, color: "text-white" };
                    const Icon = cfg.icon;
                    return (
                      <div key={row.id} className="glass rounded-xl border border-white/8 p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{cfg.label}</p>
                          {row.exhibitor && (
                            <p className="text-xs text-muted-foreground truncate">{row.exhibitor.company_name}</p>
                          )}
                          <p className="text-xs text-muted-foreground/60">{formatDate(row.created_at)}</p>
                        </div>
                        <span className={`text-sm font-bold ${cfg.color} flex-shrink-0`}>+{row.points}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
