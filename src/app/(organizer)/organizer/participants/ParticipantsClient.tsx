"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users2, Building2, Search, CheckCircle2,
  Clock, XCircle, Ticket, Calendar, Grid3X3, Check, X,
} from "lucide-react";
import type { Profile } from "@/types";
import { ORGANIZER_NAV } from "../_nav";
import { approveRegistration, rejectRegistration } from "@/features/events/registrationActions";

interface EventRef { id: string; name: string }
interface VisitorRef { id: string; full_name: string | null; email: string; phone_number: string | null }
interface BoothRef { id: string; code: string }

interface VisitorRow {
  id: string;
  status: "confirmed" | "pending_approval" | "waitlisted";
  ticket_code: string | null;
  created_at: string;
  event: EventRef | null;
  visitor: VisitorRef | null;
}

interface FirmRow {
  id: string;
  company_name: string;
  tags: string[];
  created_at: string;
  event: EventRef | null;
  booths: BoothRef[];
}

interface Props {
  profile: Profile;
  visitors: VisitorRow[];
  firms: FirmRow[];
}

function statusBadge(status: string) {
  if (status === "confirmed")       return <Badge className="text-xs bg-green-500/15 text-green-400 border-green-500/25"><CheckCircle2 className="w-3 h-3 mr-1" /> Onaylı</Badge>;
  if (status === "pending_approval") return <Badge className="text-xs bg-amber-500/15 text-amber-400 border-amber-500/25"><Clock className="w-3 h-3 mr-1" /> Bekliyor</Badge>;
  return <Badge className="text-xs bg-white/8 text-muted-foreground border-white/10"><XCircle className="w-3 h-3 mr-1" /> Bekleme Listesi</Badge>;
}

function VisitorCard({ row, onApprove, onReject }: { row: VisitorRow; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [loading, startTransition] = useTransition();
  const isPending = row.status === "pending_approval";

  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
        <Users2 className="w-5 h-5 text-brand-indigo-light" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{row.visitor?.full_name || row.visitor?.email || "—"}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{row.visitor?.email}</span>
          {row.visitor?.phone_number && <span>· {row.visitor.phone_number}</span>}
          {row.event && (
            <span className="flex items-center gap-1 text-brand-cyan/70">
              <Calendar className="w-3 h-3" /> {row.event.name}
            </span>
          )}
        </div>
        {row.ticket_code && (
          <span className="flex items-center gap-1 text-xs text-brand-gold mt-0.5">
            <Ticket className="w-3 h-3" /> {row.ticket_code}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {statusBadge(row.status)}
        {isPending && (
          <>
            <Button
              size="sm"
              variant="gradient"
              className="h-7 text-xs gap-1"
              disabled={loading}
              onClick={() => startTransition(() => onApprove(row.id))}
            >
              <Check className="w-3 h-3" /> Bilet Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
              disabled={loading}
              onClick={() => startTransition(() => onReject(row.id))}
            >
              <X className="w-3 h-3" /> Reddet
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function ParticipantsClient({ profile, visitors, firms }: Props) {
  const [tab, setTab] = useState<"visitors" | "firms">("visitors");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState(visitors);

  const pendingCount = rows.filter((r) => r.status === "pending_approval").length;

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return !q
      || (r.visitor?.full_name ?? "").toLowerCase().includes(q)
      || (r.visitor?.email ?? "").toLowerCase().includes(q)
      || (r.event?.name ?? "").toLowerCase().includes(q);
  });

  const filteredFirms = firms.filter((f) => {
    const q = search.toLowerCase();
    return !q || f.company_name.toLowerCase().includes(q) || (f.event?.name ?? "").toLowerCase().includes(q);
  });

  async function handleApprove(id: string) {
    const res = await approveRegistration(id);
    if (res.success) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "confirmed", ticket_code: res.ticketCode ?? r.ticket_code } : r
        )
      );
    }
  }

  async function handleReject(id: string) {
    const res = await rejectRegistration(id);
    if (res.success) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  }

  const tabs = [
    { id: "visitors" as const, label: "Ziyaretçiler", count: rows.length, icon: Users2 },
    { id: "firms" as const,    label: "Firma Talepleri", count: firms.length, icon: Building2 },
  ];

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <Users2 className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Katılımcılar</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {pendingCount} bekliyor
              </span>
            )}
          </div>
          <p className="text-muted-foreground pl-12">Ziyaretçiler ve katılım talepleri tek ekranda</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/8 pb-px">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all ${
                tab === t.id
                  ? "border-brand-indigo text-brand-indigo-light"
                  : "border-transparent text-muted-foreground hover:text-white"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                tab === t.id ? "bg-brand-indigo/20 text-brand-indigo-light" : "bg-white/8 text-muted-foreground"
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={tab === "visitors" ? "İsim, e-posta veya fuar ara..." : "Firma veya fuar adı ara..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Content */}
        {tab === "visitors" && (
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "Toplam",    value: rows.length,                                          color: "text-white" },
                { label: "Onaylı",    value: rows.filter((r) => r.status === "confirmed").length,  color: "text-green-400" },
                { label: "Bekliyor", value: pendingCount,                                          color: "text-amber-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass rounded-xl p-4 border border-white/8">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {filtered.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
                <Users2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{search ? "Sonuç bulunamadı." : "Henüz kayıtlı ziyaretçi yok."}</p>
              </div>
            ) : (
              <div className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden">
                {filtered.map((row) => (
                  <VisitorCard key={row.id} row={row} onApprove={handleApprove} onReject={handleReject} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "firms" && (
          <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: "Toplam Firma",   value: firms.length },
                { label: "Standlı",        value: firms.filter((f) => f.booths.length > 0).length },
                { label: "Stand Bekliyor", value: firms.filter((f) => f.booths.length === 0).length },
              ].map(({ label, value }) => (
                <div key={label} className="glass rounded-xl p-4 border border-white/8">
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            {filteredFirms.length === 0 ? (
              <div className="glass rounded-2xl border border-white/8 p-12 flex flex-col items-center text-center">
                <Building2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">{search ? "Sonuç bulunamadı." : "Henüz katılım talebi yok."}</p>
              </div>
            ) : (
              <div className="glass rounded-2xl border border-white/8 divide-y divide-white/6 overflow-hidden">
                {filteredFirms.map((ex) => (
                  <div key={ex.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{ex.company_name}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ex.event?.name ?? "—"}</span>
                        {ex.booths.map((b) => (
                          <span key={b.id} className="flex items-center gap-1 font-mono text-brand-indigo-light">
                            <Grid3X3 className="w-3 h-3" /> {b.code}
                          </span>
                        ))}
                      </div>
                      {ex.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {ex.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/8 text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge variant={ex.booths.length > 0 ? "default" : "outline"} className="flex-shrink-0 text-xs">
                      {ex.booths.length > 0 ? `${ex.booths.length} Stand` : "Stand Yok"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}
