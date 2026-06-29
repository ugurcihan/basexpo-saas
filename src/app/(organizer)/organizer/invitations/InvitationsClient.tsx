"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail, Building2, Search, MapPin, CheckCircle2,
  Clock, XCircle, ChevronDown, X, Send,
} from "lucide-react";
import { ORGANIZER_NAV } from "../_nav";
import { sendExhibitorInvitation } from "@/features/exhibitors/actions";
import type { Profile } from "@/types";

interface EventRef { id: string; name: string; start_date: string; location: string; status: string }

interface ExhibitorFirm {
  id: string;
  company_name: string;
  city: string | null;
  tags: string[];
  owner: { id: string; full_name: string | null; email: string } | Array<{ id: string; full_name: string | null; email: string }> | null;
}

interface SentInvitation {
  id: string;
  event_id: string;
  to_user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  event: { id: string; name: string } | Array<{ id: string; name: string }> | null;
  to_user: { full_name: string | null; email: string } | Array<{ full_name: string | null; email: string }> | null;
}

interface Props {
  profile: Profile;
  myEvents: EventRef[];
  allExhibitors: ExhibitorFirm[];
  sentInvitations: SentInvitation[];
}

function getOwner(f: ExhibitorFirm) {
  if (!f.owner) return null;
  return Array.isArray(f.owner) ? (f.owner[0] ?? null) : f.owner;
}
function getToUser(inv: SentInvitation) {
  if (!inv.to_user) return null;
  return Array.isArray(inv.to_user) ? (inv.to_user[0] ?? null) : inv.to_user;
}
function getInvEvent(inv: SentInvitation) {
  if (!inv.event) return null;
  return Array.isArray(inv.event) ? (inv.event[0] ?? null) : inv.event;
}

function statusBadge(status: string) {
  if (status === "accepted")
    return <Badge className="text-xs bg-green-500/15 text-green-400 border-green-500/25"><CheckCircle2 className="w-3 h-3 mr-1" />Kabul Edildi</Badge>;
  if (status === "rejected")
    return <Badge className="text-xs bg-red-500/15 text-red-400 border-red-500/25"><XCircle className="w-3 h-3 mr-1" />Reddedildi</Badge>;
  return <Badge className="text-xs bg-amber-500/15 text-amber-400 border-amber-500/25"><Clock className="w-3 h-3 mr-1" />Bekliyor</Badge>;
}

export function InvitationsClient({ profile, myEvents, allExhibitors, sentInvitations: initialSent }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string>(myEvents[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inviting, setInviting] = useState<string | null>(null); // to_user_id
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState<Set<string>>(new Set()); // to_user_id keys
  const [sentInvitations, setSentInvitations] = useState(initialSent);

  const selectedEvent = myEvents.find(e => e.id === selectedEventId);

  // Tüm unique taglar
  const allTags = Array.from(new Set(allExhibitors.flatMap(f => f.tags))).sort();

  // Seçili etkinliğe göre zaten davet edilmiş kullanıcı ID'leri
  const alreadyInvited = new Set(
    sentInvitations
      .filter(inv => inv.event_id === selectedEventId)
      .map(inv => inv.to_user_id),
  );

  // Firma filtreleme
  const seenOwners = new Set<string>();
  const uniqueFirms = allExhibitors.filter(f => {
    const owner = getOwner(f);
    if (!owner) return false;
    if (seenOwners.has(owner.id)) return false;
    seenOwners.add(owner.id);
    return true;
  });

  const filtered = uniqueFirms.filter(f => {
    const owner = getOwner(f);
    if (!owner) return false;
    const matchSearch = !search || f.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (f.city?.toLowerCase().includes(search.toLowerCase()));
    const matchTags = selectedTags.length === 0 || selectedTags.some(t => f.tags.includes(t));
    return matchSearch && matchTags;
  });

  // Seçili etkinliğe gönderilen davetler
  const eventInvitations = sentInvitations.filter(inv => inv.event_id === selectedEventId);

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  }

  function handleSendInvite(toUserId: string) {
    if (!selectedEventId) return;
    startTransition(async () => {
      const { error } = await sendExhibitorInvitation({
        event_id: selectedEventId,
        to_user_id: toUserId,
        message: message.trim() || undefined,
      });
      if (!error) {
        setSent(prev => new Set([...prev, toUserId]));
        setInviting(null);
        setMessage("");
        setSentInvitations(prev => [
          {
            id: crypto.randomUUID(),
            event_id: selectedEventId,
            to_user_id: toUserId,
            message: message.trim() || null,
            status: "pending",
            created_at: new Date().toISOString(),
            event: selectedEvent ? { id: selectedEvent.id, name: selectedEvent.name } : null,
            to_user: uniqueFirms.find(f => getOwner(f)?.id === toUserId)?.owner ?? null,
          },
          ...prev,
        ]);
      }
    });
  }

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">Firma Davetleri</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Sektöre göre firmalar bul, fuarına davet gönder</p>
        </motion.div>

        {myEvents.length === 0 ? (
          <div className="glass rounded-2xl border border-white/8 p-10 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Önce bir etkinlik oluşturman gerekiyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sol Panel — Firma Keşfet */}
            <div className="lg:col-span-2 space-y-5">
              {/* Etkinlik seçici */}
              <div className="glass rounded-xl border border-white/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etkinlik Seç</p>
                <div className="relative">
                  <select
                    value={selectedEventId}
                    onChange={e => setSelectedEventId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-brand-indigo/50 pr-8"
                  >
                    {myEvents.map(ev => (
                      <option key={ev.id} value={ev.id} className="bg-gray-900">
                        {ev.name} — {new Date(ev.start_date).toLocaleDateString("tr-TR")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Filtreler */}
              <div className="glass rounded-xl border border-white/10 p-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-indigo/50"
                    placeholder="Firma adı veya şehir ara..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.slice(0, 20).map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                          selectedTags.includes(tag)
                            ? "bg-brand-indigo text-white border-brand-indigo/60"
                            : "bg-white/5 text-muted-foreground border-white/10 hover:text-white"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                    {selectedTags.length > 0 && (
                      <button onClick={() => setSelectedTags([])} className="px-2.5 py-1 rounded-full text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10">
                        Temizle
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Firma listesi */}
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="glass rounded-2xl border border-white/8 p-8 text-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Kriterlere uyan firma bulunamadı.</p>
                  </div>
                ) : (
                  filtered.map((f, i) => {
                    const owner = getOwner(f);
                    if (!owner) return null;
                    const isInvited = alreadyInvited.has(owner.id) || sent.has(owner.id);
                    const isActive = inviting === owner.id;
                    return (
                      <motion.div key={f.id} initial={{ y: 12 }} animate={{ y: 0 }} transition={{ delay: i * 0.03 }}
                        className="glass rounded-xl border border-white/8 p-4 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 border border-brand-indigo/15 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-brand-indigo-light" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{f.company_name}</p>
                            {f.city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" /> {f.city}
                              </p>
                            )}
                            {f.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {f.tags.slice(0, 4).map(t => (
                                  <span key={t} className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-muted-foreground">{t}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {isInvited ? (
                            <Badge className="text-xs bg-green-500/15 text-green-400 border-green-500/25 flex-shrink-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Gönderildi
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant={isActive ? "outline" : "gradient"}
                              className="h-7 text-xs gap-1.5 flex-shrink-0"
                              onClick={() => setInviting(isActive ? null : owner.id)}
                            >
                              {isActive ? <X className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                              {isActive ? "İptal" : "Davet Gönder"}
                            </Button>
                          )}
                        </div>

                        {isActive && !isInvited && (
                          <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="space-y-2 pt-1">
                            <Textarea
                              placeholder="Davet mesajı (isteğe bağlı)..."
                              value={message}
                              onChange={e => setMessage(e.target.value)}
                              className="resize-none h-16 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="gradient"
                              className="w-full gap-1.5"
                              disabled={isPending}
                              onClick={() => handleSendInvite(owner.id)}
                            >
                              <Send className="w-3.5 h-3.5" />
                              {isPending ? "Gönderiliyor..." : "Daveti Gönder"}
                            </Button>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sağ Panel — Gönderilen Davetler */}
            <div className="space-y-4">
              <div className="glass rounded-xl border border-white/10 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Gönderilen Davetler
                  {selectedEvent && <span className="ml-1 normal-case font-normal">— {selectedEvent.name}</span>}
                </p>
                {eventInvitations.length === 0 ? (
                  <div className="text-center py-6">
                    <Mail className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Henüz bu etkinlik için davet gönderilmedi.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventInvitations.map(inv => {
                      const u = getToUser(inv);
                      return (
                        <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/8">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white truncate">{u?.full_name ?? u?.email ?? "Firma"}</p>
                            <p className="text-[11px] text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("tr-TR")}</p>
                          </div>
                          {statusBadge(inv.status)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
