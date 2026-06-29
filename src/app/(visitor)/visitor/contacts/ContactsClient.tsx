"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen, Building2, MapPin, Mail, Phone, Globe,
  Linkedin, CheckCircle2, FileDown, Download, Search,
  CalendarDays,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VISITOR_NAV } from "../_nav";
import { upsertFirmNote } from "@/features/visitors/actions";
import type { ContactStatus, ContactLead } from "@/features/visitors/actions";
import type { Profile } from "@/types";

const STATUS_OPTS: { value: ContactStatus; label: string; color: string }[] = [
  { value: "new",       label: "Yeni",               color: "bg-white/8 text-muted-foreground border-white/12" },
  { value: "contacted", label: "İletişime Geçtim",   color: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30" },
  { value: "pending",   label: "Beklemede",           color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "done",      label: "Tamamlandı",          color: "bg-green-500/15 text-green-400 border-green-500/30" },
];

function StatusPill({ status }: { status: ContactStatus }) {
  const opt = STATUS_OPTS.find(s => s.value === status);
  if (!opt || status === "new") return null;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${opt.color}`}>
      {opt.label}
    </span>
  );
}

function FirmCard({ lead }: { lead: ContactLead }) {
  const firm = lead.firm;
  const initNote = lead.note;

  const [selectedId, setSelectedId] = useState<string | null>(initNote?.contact_id ?? null);
  const [note, setNote] = useState(initNote?.personal_note ?? "");
  const [status, setStatus] = useState<ContactStatus>(initNote?.status ?? "new");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = firm.contacts.find(c => c.id === selectedId);
  const activeEmail = selected?.email ?? null;
  const activePhone = selected?.phone ?? firm.phone ?? null;

  function handleSave() {
    startTransition(async () => {
      await upsertFirmNote({
        exhibitor_id: firm.id,
        contact_id: selectedId,
        personal_note: note.trim() || null,
        status,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  function handleVCard() {
    const contactPerson = selected;
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `ORG:${firm.company_name}`,
      contactPerson
        ? `FN:${contactPerson.full_name}`
        : firm.contact_name
          ? `FN:${firm.contact_name}`
          : `FN:${firm.company_name}`,
      contactPerson?.job_title ? `TITLE:${contactPerson.job_title}` : firm.job_title ? `TITLE:${firm.job_title}` : null,
      contactPerson?.email ? `EMAIL:${contactPerson.email}` : null,
      contactPerson?.phone ? `TEL:${contactPerson.phone}` : firm.phone ? `TEL:${firm.phone}` : null,
      firm.website ? `URL:${firm.website}` : null,
      note ? `NOTE:${note.replace(/\n/g, "\\n")}` : null,
      "END:VCARD",
    ].filter(Boolean) as string[];

    const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${firm.company_name.replace(/\s+/g, "-")}.vcf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  return (
    <div className="glass rounded-2xl border border-white/8 p-5 space-y-4 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3">
        {firm.logo_url ? (
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/8">
            <Image src={firm.logo_url} alt={firm.company_name} width={44} height={44} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-xl bg-brand-indigo/10 border border-brand-indigo/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-brand-indigo-light" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white text-sm leading-tight">{firm.company_name}</p>
            <StatusPill status={status} />
          </div>
          {firm.city && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {firm.city}
            </p>
          )}
          {firm.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {firm.tags.slice(0, 4).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleVCard} className="text-muted-foreground hover:text-white transition-colors flex-shrink-0 p-1" title="vCard İndir">
          <FileDown className="w-4 h-4" />
        </button>
      </div>

      {/* Contact selection */}
      {firm.contacts.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Konuştuğum Kişi</p>
          <div className="space-y-1">
            {firm.contacts.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(prev => prev === c.id ? null : c.id)}
                className={`w-full flex items-start gap-2.5 p-2 rounded-xl border text-left transition-all ${
                  c.id === selectedId
                    ? "bg-brand-indigo/12 border-brand-indigo/35"
                    : "bg-white/3 border-white/8 hover:border-white/18"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-brand-indigo/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-indigo-light">
                  {c.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{c.full_name}</p>
                  {c.job_title && <p className="text-[10px] text-muted-foreground">{c.job_title}</p>}
                  {c.id === selectedId && (
                    <div className="flex flex-wrap gap-x-3 mt-1">
                      {c.email && <span className="text-[10px] text-brand-cyan">{c.email}</span>}
                      {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
                    </div>
                  )}
                </div>
                {c.id === selectedId && <CheckCircle2 className="w-3.5 h-3.5 text-brand-indigo-light flex-shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>
      ) : firm.contact_name ? (
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/3 border border-white/8">
          <div className="w-7 h-7 rounded-full bg-brand-indigo/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-indigo-light">
            {firm.contact_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{firm.contact_name}</p>
            {firm.job_title && <p className="text-[10px] text-muted-foreground">{firm.job_title}</p>}
          </div>
        </div>
      ) : null}

      {/* Quick actions */}
      {(activeEmail || activePhone || firm.website || firm.linkedin_url) && (
        <div className="flex flex-wrap gap-1.5">
          {activeEmail && (
            <a href={`mailto:${activeEmail}`}>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 px-2.5">
                <Mail className="w-3 h-3" /> Mail
              </Button>
            </a>
          )}
          {activePhone && (
            <a href={`tel:${activePhone}`}>
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 px-2.5">
                <Phone className="w-3 h-3" /> Ara
              </Button>
            </a>
          )}
          {firm.website && (
            <a href={firm.website} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 px-2.5">
                <Globe className="w-3 h-3" /> Web
              </Button>
            </a>
          )}
          {firm.linkedin_url && (
            <a href={firm.linkedin_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1.5 px-2.5">
                <Linkedin className="w-3 h-3" /> LinkedIn
              </Button>
            </a>
          )}
        </div>
      )}

      {/* Status */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Durum</p>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                status === s.value ? s.color : "bg-white/3 text-muted-foreground border-white/8 hover:border-white/20"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5 flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notlarım</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Görüşme notları, takip edilecek konular..."
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-indigo/40 resize-none"
        />
      </div>

      {/* Save */}
      <Button
        size="sm"
        variant={saved ? "outline" : "gradient"}
        className={`w-full gap-1.5 ${saved ? "text-green-400 border-green-500/30 bg-green-500/5" : ""}`}
        onClick={handleSave}
        disabled={isPending}
      >
        {saved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
        {isPending ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Kaydet"}
      </Button>
    </div>
  );
}

interface Props {
  profile: Profile;
  contacts: ContactLead[];
}

export function ContactsClient({ profile, contacts }: Props) {
  const [search, setSearch] = useState("");

  const uniqueLeads = (() => {
    const seen = new Set<string>();
    return contacts.filter(l => {
      if (seen.has(l.firm.id)) return false;
      seen.add(l.firm.id);
      return true;
    });
  })();

  const filtered = search
    ? uniqueLeads.filter(l =>
        l.firm.company_name.toLowerCase().includes(search.toLowerCase()) ||
        l.firm.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
        (l.firm.city ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : uniqueLeads;

  const groups = new Map<string, { eventName: string | null; eventDate: string | null; leads: ContactLead[] }>();
  for (const lead of filtered) {
    const ev = lead.firm.event;
    const key = ev?.id ?? "standalone";
    if (!groups.has(key)) groups.set(key, { eventName: ev?.name ?? null, eventDate: ev?.start_date ?? null, leads: [] });
    groups.get(key)!.leads.push(lead);
  }

  const sortedGroups = [...groups.entries()].sort(([, a], [, b]) => {
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
  });

  function handleExportCSV() {
    const rows = ["﻿D﻿irma,Şehir,Sektörler,Konuştuğum Kişi,Email,Telefon,Web,Durum,Notlarım"];
    for (const lead of uniqueLeads) {
      const f = lead.firm;
      const n = lead.note;
      const c = f.contacts.find(x => x.id === n?.contact_id);
      rows.push([
        `"${f.company_name}"`,
        `"${f.city ?? ""}"`,
        `"${f.tags.join("; ")}"`,
        `"${c?.full_name ?? f.contact_name ?? ""}"`,
        `"${c?.email ?? ""}"`,
        `"${c?.phone ?? f.phone ?? ""}"`,
        `"${f.website ?? ""}"`,
        `"${n?.status ?? "new"}"`,
        `"${(n?.personal_note ?? "").replace(/"/g, "'")}"`,
      ].join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kartvizit-defteri.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  return (
    <DashboardShell role="visitor" userName={profile.full_name || profile.email} navItems={VISITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Kartvizit Defterim</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Ziyaret ettiğiniz firmalar — {uniqueLeads.length} firma
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> CSV İndir
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.05 }} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-indigo/40"
            placeholder="Firma adı, sektör veya şehir ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </motion.div>

        {/* Empty state */}
        {uniqueLeads.length === 0 ? (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.08 }}
            className="glass rounded-2xl border border-white/8 p-14 text-center"
          >
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h2 className="font-display text-lg font-semibold text-white mb-1.5">Henüz kartvizit yok</h2>
            <p className="text-muted-foreground text-sm">
              Bir fuarda veya etkinlikte firma QR kodlarını tarayın.
            </p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">"{search}" ile eşleşen firma bulunamadı.</div>
        ) : (
          <div className="space-y-10">
            {sortedGroups.map(([key, group]) => (
              <motion.div key={key} initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-4">
                {/* Section header */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/8" />
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-brand-indigo-light" />
                    <span className="text-sm font-semibold text-white">
                      {group.eventName ?? "Bağımsız QR"}
                    </span>
                    {group.eventDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(group.eventDate).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
                      </span>
                    )}
                    <Badge className="text-[10px] h-5 bg-white/5 border-white/12 text-muted-foreground">
                      {group.leads.length} firma
                    </Badge>
                  </div>
                  <div className="h-px flex-1 bg-white/8" />
                </div>

                {/* Firm grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.leads.map((lead, i) => (
                    <motion.div key={lead.id} initial={{ y: 12 }} animate={{ y: 0 }} transition={{ delay: i * 0.035 }}>
                      <FirmCard lead={lead} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
