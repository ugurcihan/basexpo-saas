"use client";

import { EXHIBITOR_NAV } from "../_nav";

import { useState, useTransition, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2, Upload, X, Check, AlertCircle, Plus, Globe, Phone,
  Linkedin, QrCode, Download, Copy, ClipboardList, ToggleLeft,
  ToggleRight, Trash2, ChevronDown, ChevronUp, Eye, Mail, UserCheck,
  Play, Package, ExternalLink, Pencil, BarChart2, FileDown,
} from "lucide-react";
import {
  updateExhibitorProfile, getExhibitorContacts, upsertContact, deleteContact, getExhibitorProducts,
  createStandaloneExhibitor, deleteStandaloneExhibitor,
  getStandaloneQRStats, getStandaloneQRExportData, recordStandaloneInteraction,
} from "@/features/exhibitors/actions";
import {
  createOrGetSurvey, addQuestion, deleteQuestion, toggleSurvey, updateQuestion, getSurveyResults,
  getExhibitorSurvey,
} from "@/features/surveys/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

interface EventInfo { id: string; name: string; location: string; start_date: string; end_date: string }
interface ExhibitorRow {
  id: string;
  company_name: string;
  qr_token: string;
  contact_name: string | null;
  job_title: string | null;
  linkedin_url: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  logo_url: string | null;
  tags: string[];
  description: string;
  video_url: string | null;
  video_points: number;
  survey_points: number;
  custom_reward: string | null;
  event: EventInfo | EventInfo[];
}

type ContactDraft = {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  contact_type: "official" | "booth";
};

function EditContactRow({ c, onChange, onRemove }: {
  c: ContactDraft;
  onChange: (patch: Partial<ContactDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 p-2.5 rounded-lg bg-white/3 border border-white/8">
      <Input value={c.full_name} onChange={e => onChange({ full_name: e.target.value })}
        placeholder="Ad Soyad" className="h-7 text-xs col-span-2" />
      <Input value={c.job_title} onChange={e => onChange({ job_title: e.target.value })}
        placeholder="Unvan" className="h-7 text-xs" />
      <Input value={c.email} onChange={e => onChange({ email: e.target.value })}
        placeholder="E-posta" type="email" className="h-7 text-xs" />
      <Input value={c.phone} onChange={e => onChange({ phone: e.target.value })}
        placeholder="Telefon" className="h-7 text-xs" />
      <Button type="button" size="sm" variant="outline"
        className="h-7 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 gap-1 col-span-1"
        onClick={onRemove}
      >
        <X className="w-3 h-3" /> Kaldır
      </Button>
    </div>
  );
}
interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
}

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: "yes_no" | "multiple_choice";
  options: string[] | null;
  sort_order: number;
  is_required: boolean;
}
interface Survey { id: string; title: string; is_active: boolean; questions: SurveyQuestion[] }

interface Props {
  profile: Profile;
  exhibitors: ExhibitorRow[];
  availableEvents: EventInfo[];
  initialSurvey: Survey | null;
  primaryId: string | null;
  initialTab: string | null;
}

const TABS = [
  { key: "card",       label: "Kartvizit" },
  { key: "qr",        label: "Fuar QR Kodları" },
  { key: "standalone", label: "Bağımsız QR" },
  { key: "survey",    label: "Anket" },
  { key: "results",   label: "Sonuçlar" },
  { key: "preview",   label: "Önizleme" },
] as const;

type Tab = typeof TABS[number]["key"];

export function CardClient({ profile, exhibitors, availableEvents, initialSurvey, primaryId, initialTab }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((initialTab as Tab) ?? "card");

  const primary = primaryId
    ? (exhibitors.find(e => e.id === primaryId) ?? exhibitors[0] ?? null)
    : exhibitors[0] ?? null;

  return (
    <DashboardShell role="exhibitor" userName={profile.full_name || profile.email} navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">Dijital Kartvizit</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            QR tarandığında ziyaretçilere gösterilecek bilgiler + anket ayarları
          </p>
        </motion.div>

        {/* No exhibitor profile */}
        {!primary && (
          <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-brand-cyan/20 p-10 text-center">
            <Building2 className="w-10 h-10 text-brand-cyan mx-auto mb-3" />
            <h2 className="font-display text-lg font-semibold text-white mb-2">Önce bir fuara kayıt ol</h2>
            <p className="text-muted-foreground text-sm">Firma profili oluşturmak için bir fuara kayıt olman gerekiyor.</p>
            <Button variant="gradient" className="mt-4" onClick={() => router.push("/exhibitor/fairs")}>
              Fuarlara Göz At
            </Button>
          </motion.div>
        )}

        {primary && (
          <>
            {/* Tab bar */}
            <motion.div initial={{ y: 16 }} animate={{ y: 0 }} transition={{ delay: 0.06 }}>
              <div className="flex gap-1 p-1 glass rounded-xl border border-white/8 w-fit">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                      tab === t.key
                        ? "bg-brand-indigo text-white shadow-sm"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {tab === "card" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span><span className="text-white font-medium">Ana Profil</span> — Tüm QR kodlarınız (fuar + bağımsız) için ortak bilgiler. Logo, açıklama, ürünler ve yetkili kişiler buradan yönetilir.</span>
                </div>
                <CardTab exhibitor={primary} router={router} />
              </div>
            )}
            {tab === "qr" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-muted-foreground">
                  <QrCode className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span><span className="text-white font-medium">Fuar QR Kodları</span> — Katıldığınız fuarlara özgü QR'lar. PNG indirin veya URL kopyalayın. Bağımsız etkinlikler için &quot;Bağımsız QR&quot; sekmesini kullanın.</span>
                </div>
                <QRTab exhibitors={exhibitors} />
              </div>
            )}
            {tab === "standalone" && (
              <StandaloneTab exhibitors={exhibitors} profile={profile} router={router} />
            )}
            {tab === "survey" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-muted-foreground">
                  <ClipboardList className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span><span className="text-white font-medium">Ana Profil Anketi</span> — Yalnız fuar QR&apos;larında gösterilir. Her bağımsız QR&apos;ın kendi anketi için o QR kartındaki &quot;Anket&quot; bölümünü kullanın. Maks 5 soru.</span>
                </div>
                <SurveyTab exhibitorId={primary.id} initialSurvey={initialSurvey} />
              </div>
            )}
            {tab === "results" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-muted-foreground">
                  <BarChart2 className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span><span className="text-white font-medium">Anket Sonuçları</span> — Ana profil anketine gelen yanıtlar (fuar QR&apos;larından). Bağımsız QR yanıtları için o QR kartındaki &quot;Rapor&quot; bölümünü açın.</span>
                </div>
                <SurveyResultsTab surveyId={initialSurvey?.id ?? null} surveyTitle={initialSurvey?.title ?? "Anket"} />
              </div>
            )}
            {tab === "preview" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/8 text-sm text-muted-foreground">
                  <Eye className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
                  <span><span className="text-white font-medium">Önizleme</span> — Ziyaretçilerin QR taradığında gördüğü sayfa. Anket aktifse sorular altta gösterilir.</span>
                </div>
                <PreviewTab exhibitor={primary} survey={initialSurvey} />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

// ─── Contact types ────────────────────────────────────────────
interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  contact_type: "official" | "booth";
  sort_order: number;
}

// ─── ContactRow ───────────────────────────────────────────────
function ContactRow({ contact, onDelete }: { contact: Contact; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{contact.full_name}</p>
        {contact.job_title && (
          <p className="text-xs text-muted-foreground truncate">{contact.job_title}</p>
        )}
        {(contact.email || contact.phone) && (
          <div className="flex flex-wrap gap-2 mt-1">
            {contact.email && (
              <span className="text-xs text-brand-cyan truncate">{contact.email}</span>
            )}
            {contact.phone && (
              <span className="text-xs text-muted-foreground">{contact.phone}</span>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDelete(contact.id)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── AddContactForm ───────────────────────────────────────────
function AddContactForm({
  exhibitorId,
  contactType,
  sortOrder,
  onAdded,
}: {
  exhibitorId: string;
  contactType: "official" | "booth";
  sortOrder: number;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function handleAdd() {
    if (!fullName.trim()) { setErr("Ad Soyad zorunlu"); return; }
    setErr(null);
    startTransition(async () => {
      const result = await upsertContact({
        exhibitor_id: exhibitorId,
        full_name: fullName.trim(),
        email: email || null,
        phone: phone || null,
        job_title: jobTitle || null,
        contact_type: contactType,
        sort_order: sortOrder,
      });
      if (result.error) { setErr(result.error); return; }
      setFullName(""); setEmail(""); setPhone(""); setJobTitle("");
      setOpen(false);
      onAdded();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-white/12 hover:border-white/25 text-xs text-muted-foreground hover:text-white transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Kişi Ekle
      </button>
    );
  }

  return (
    <div className="p-3 rounded-xl border border-brand-indigo/25 bg-brand-indigo/5 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Ad Soyad *</Label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ali Yılmaz" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unvan</Label>
          <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Satış Müdürü" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">E-posta</Label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ali@firma.com" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Telefon</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+90 5xx..." className="h-8 text-sm" />
        </div>
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="gradient" size="sm" onClick={handleAdd} disabled={isPending}>
          {isPending ? "Ekleniyor..." : "Ekle"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); setErr(null); }}>İptal</Button>
      </div>
    </div>
  );
}

// ─── Tab: Kartvizit Bilgileri ──────────────────────────────────
function CardTab({ exhibitor, router }: { exhibitor: ExhibitorRow; router: ReturnType<typeof useRouter> }) {
  const [isPending, startTransition] = useTransition();
  const [companyName, setCompanyName] = useState(exhibitor.company_name);
  const [description, setDescription] = useState(exhibitor.description);
  const [logoUrl, setLogoUrl] = useState<string | null>(exhibitor.logo_url);
  const [contactName, setContactName] = useState(exhibitor.contact_name ?? "");
  const [jobTitle, setJobTitle] = useState(exhibitor.job_title ?? "");
  const [phone, setPhone] = useState(exhibitor.phone ?? "");
  const [website, setWebsite] = useState(exhibitor.website ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(exhibitor.linkedin_url ?? "");
  const [city, setCity] = useState(exhibitor.city ?? "");
  const [tags, setTags] = useState<string[]>(exhibitor.tags);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);

  useEffect(() => {
    getExhibitorContacts(exhibitor.id).then((data) => {
      setContacts(data as Contact[]);
      setContactsLoaded(true);
    });
  }, [exhibitor.id]);

  function handleDeleteContact(contactId: string) {
    deleteContact(contactId).then(() => {
      setContacts(prev => prev.filter(c => c.id !== contactId));
    });
  }

  function reloadContacts() {
    getExhibitorContacts(exhibitor.id).then((data) => {
      setContacts(data as Contact[]);
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo 2MB'dan küçük olmalı"); return; }
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `logos/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (upErr) { setError("Logo yüklenemedi"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    setUploading(false);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags(prev => [...prev, t]);
    setTagInput("");
  }

  function handleSave() {
    if (!companyName.trim()) { setError("Firma adı zorunlu"); return; }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateExhibitorProfile({
        id: exhibitor.id,
        company_name: companyName,
        description,
        logo_url: logoUrl,
        tags,
        website: website || null,
        phone: phone || null,
        city: city || null,
        contact_name: contactName || null,
        job_title: jobTitle || null,
        linkedin_url: linkedinUrl || null,
      });
      if (result.error) { setError(result.error); return; }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 p-6 space-y-5 max-w-2xl">
      {/* Logo */}
      <div className="space-y-2">
        <Label>Firma Logosu</Label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt="logo" width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              <Building2 className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {uploading ? "Yükleniyor..." : "Logo Yükle"}
            </Button>
            {logoUrl && (
              <button type="button" onClick={() => setLogoUrl(null)} className="ml-3 text-xs text-red-400 hover:text-red-300">Kaldır</button>
            )}
          </div>
        </div>
      </div>

      {/* Firma adı + açıklama */}
      <div className="space-y-2">
        <Label>Firma Adı *</Label>
        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Teknoloji A.Ş." />
      </div>
      <div className="space-y-2">
        <Label>Açıklama</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Firmanız hakkında kısa bilgi..." />
      </div>

      {/* Yetkili Kişiler — çoklu */}
      <div className="border-t border-white/8 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-brand-cyan" />
          <p className="text-sm font-semibold text-white">Yetkili Kişiler</p>
          <span className="text-xs text-muted-foreground">(Firma geneli — maks 5)</span>
        </div>
        {contactsLoaded && (
          <div className="space-y-2">
            {contacts.filter(c => c.contact_type === "official").map(c => (
              <ContactRow key={c.id} contact={c} onDelete={handleDeleteContact} />
            ))}
            {contacts.filter(c => c.contact_type === "official").length < 5 && (
              <AddContactForm
                exhibitorId={exhibitor.id}
                contactType="official"
                sortOrder={contacts.filter(c => c.contact_type === "official").length}
                onAdded={reloadContacts}
              />
            )}
          </div>
        )}
        {!contactsLoaded && <p className="text-xs text-muted-foreground">Yükleniyor...</p>}
      </div>

      {/* Stant Yetkilileri — çoklu */}
      <div className="border-t border-white/8 pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-brand-violet-light" />
          <p className="text-sm font-semibold text-white">Stant Yetkilileri</p>
          <span className="text-xs text-muted-foreground">(Fuardaki stant sorumlusu — maks 5)</span>
        </div>
        {contactsLoaded && (
          <div className="space-y-2">
            {contacts.filter(c => c.contact_type === "booth").map(c => (
              <ContactRow key={c.id} contact={c} onDelete={handleDeleteContact} />
            ))}
            {contacts.filter(c => c.contact_type === "booth").length < 5 && (
              <AddContactForm
                exhibitorId={exhibitor.id}
                contactType="booth"
                sortOrder={contacts.filter(c => c.contact_type === "booth").length}
                onAdded={reloadContacts}
              />
            )}
          </div>
        )}
      </div>

      {/* İletişim */}
      <div className="border-t border-white/8 pt-4 space-y-3">
        <p className="text-sm font-semibold text-white">İletişim Bilgileri</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" /> Telefon</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-muted-foreground" /> Web Sitesi</Label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://firmam.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5 text-muted-foreground" /> LinkedIn URL</Label>
          <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/company/..." />
        </div>
        <div className="space-y-2">
          <Label>Şehir</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="İstanbul" />
        </div>
      </div>

      {/* Etiketler */}
      <div className="border-t border-white/8 pt-4 space-y-2">
        <Label>Etiketler (AI eşleştirme)</Label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/25 text-brand-indigo-light">
                {tag}
                <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Etiket ekle (Enter)"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            disabled={tags.length >= 10}
          />
          <Button type="button" variant="outline" size="icon" onClick={addTag} disabled={tags.length >= 10 || !tagInput.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <Check className="w-4 h-4 flex-shrink-0" /> Kartvizit bilgileri kaydedildi!
        </div>
      )}

      <Button variant="gradient" className="w-full" onClick={handleSave} disabled={isPending || uploading}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </motion.div>
  );
}

// ─── Tab: QR Kodlarım ─────────────────────────────────────────
function QRTab({ exhibitors }: { exhibitors: ExhibitorRow[] }) {
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const qrRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => { setMounted(true); }, []);

  function getEvent(exhibitor: ExhibitorRow) {
    const ev = exhibitor.event;
    if (!ev) return null;
    return Array.isArray(ev) ? ev[0] : ev;
  }

  function handleCopy(token: string, id: string) {
    const url = `${window.location.origin}/scan/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleDownload(exhibitor: ExhibitorRow) {
    const ref = qrRefs.current[exhibitor.id];
    const svg = ref?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    const svgBlob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      const ev = getEvent(exhibitor);
      link.download = `${exhibitor.company_name}-${ev?.name ?? "qr"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }

  function QRCard({ ex, index }: { ex: ExhibitorRow; index: number }) {
    const ev = getEvent(ex);
    const scanUrl = mounted ? `${window.location.origin}/scan/${ex.qr_token}` : "";
    return (
      <motion.div
        key={ex.id}
        initial={{ y: 14 }}
        animate={{ y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="glass rounded-2xl border border-white/8 p-6 flex flex-col sm:flex-row items-center gap-6"
      >
        {/* QR */}
        <div
          ref={el => { qrRefs.current[ex.id] = el; }}
          className="p-4 bg-white rounded-xl shadow-[0_0_24px_rgba(99,102,241,0.2)] flex-shrink-0"
        >
          {mounted ? (
            <QRCodeSVG value={scanUrl} size={160} level="H" includeMargin={false} fgColor="#0A0F1E" bgColor="#FFFFFF" />
          ) : (
            <div className="w-40 h-40 bg-gray-100 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          {ev ? (
            <>
              <p className="font-display font-bold text-white text-lg">{ev.name}</p>
              <p className="text-muted-foreground text-sm mb-1">
                {ev.location} · {new Date(ev.start_date).toLocaleDateString("tr-TR")}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <p className="font-semibold text-white">{ex.company_name}</p>
              <Badge className="text-[10px] bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25">Bağımsız</Badge>
            </div>
          )}
          <div className="flex items-center gap-2 justify-center sm:justify-start mt-3">
            <Button variant="gradient" size="sm" onClick={() => handleDownload(ex)}>
              <Download className="w-3.5 h-3.5" /> PNG İndir
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleCopy(ex.qr_token, ex.id)}>
              {copiedId === ex.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === ex.id ? "Kopyalandı" : "URL Kopyala"}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const eventBased = exhibitors.filter(ex => getEvent(ex) !== null);

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-6">
      {eventBased.length > 0 ? (
        <div className="space-y-4">
          {eventBased.map((ex, i) => <QRCard key={ex.id} ex={ex} index={i} />)}
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/8 p-10 text-center">
          <QrCode className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Henüz fuar QR kodu yok. Bir fuara kayıt olunca QR kodun burada görünür.</p>
          <p className="text-xs text-muted-foreground mt-1">Fuar dışı QR için &quot;Bağımsız QR&quot; sekmesini kullan.</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab: Bağımsız QR ────────────────────────────────────────

interface QRStats { scan_count: number; unique_visitors: number; survey_fill_count: number }

function StandaloneQRCard({ ex, onDelete }: { ex: ExhibitorRow; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, startDelete] = useTransition();

  // Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editCompany, setEditCompany] = useState(ex.company_name);
  const [editContact, setEditContact] = useState(ex.contact_name ?? "");
  const [editJob, setEditJob] = useState(ex.job_title ?? "");
  const [editPhone, setEditPhone] = useState(ex.phone ?? "");
  const [editWebsite, setEditWebsite] = useState(ex.website ?? "");
  const [editCity, setEditCity] = useState(ex.city ?? "");
  const [editVideoUrl, setEditVideoUrl] = useState(ex.video_url ?? "");
  const [editVideoPoints, setEditVideoPoints] = useState(ex.video_points ?? 0);
  const [editSurveyPoints, setEditSurveyPoints] = useState(ex.survey_points ?? 0);
  const [editCustomReward, setEditCustomReward] = useState(ex.custom_reward ?? "");
  // Contacts
  const [contacts, setContacts] = useState<ContactDraft[]>([]);
  const [deletedContactIds, setDeletedContactIds] = useState<string[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [saving, startSave] = useTransition();
  const [saveErr, setSaveErr] = useState<string | null>(null);

  // Report
  const [showReport, setShowReport] = useState(false);
  const [stats, setStats] = useState<QRStats | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [surveyResults, setSurveyResults] = useState<SurveyResult[] | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Survey panel
  const [showSurvey, setShowSurvey] = useState(false);

  // Export
  const [exporting, startExport] = useTransition();

  useEffect(() => {
    setUrl(`${window.location.origin}/scan/${ex.qr_token}`);
  }, [ex.qr_token]);

  useEffect(() => {
    if (!isEditing) return;
    if (contacts.length > 0 || contactsLoading) return;
    setContactsLoading(true);
    getExhibitorContacts(ex.id).then(data => {
      setContacts(data.map(c => ({
        id: c.id,
        full_name: c.full_name ?? "",
        email: c.email ?? "",
        phone: c.phone ?? "",
        job_title: c.job_title ?? "",
        contact_type: (c.contact_type ?? "official") as "official" | "booth",
      })));
      setContactsLoading(false);
    });
  }, [isEditing, ex.id]);

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    setSaveErr(null);
    startSave(async () => {
      const result = await updateExhibitorProfile({
        id: ex.id,
        company_name: editCompany.trim() || ex.company_name,
        description: ex.description,
        logo_url: ex.logo_url,
        tags: ex.tags,
        phone: editPhone || null,
        website: editWebsite || null,
        city: editCity || null,
        contact_name: editContact || null,
        job_title: editJob || null,
        linkedin_url: ex.linkedin_url,
        video_url: editVideoUrl || null,
        video_points: editVideoPoints,
        survey_points: editSurveyPoints,
        custom_reward: editCustomReward || null,
      });
      if (result.error) { setSaveErr(result.error); return; }

      for (const cid of deletedContactIds) await deleteContact(cid);
      setDeletedContactIds([]);

      for (let i = 0; i < contacts.length; i++) {
        const c = contacts[i];
        if (!c.full_name.trim()) continue;
        await upsertContact({
          id: c.id,
          exhibitor_id: ex.id,
          full_name: c.full_name,
          email: c.email || null,
          phone: c.phone || null,
          job_title: c.job_title || null,
          contact_type: c.contact_type,
          sort_order: i,
        });
      }

      setIsEditing(false);
      setContacts([]);
      router.refresh();
    });
  }

  function addContact(type: "official" | "booth") {
    const count = contacts.filter(c => c.contact_type === type).length;
    if (count >= 5) return;
    setContacts(prev => [...prev, { full_name: "", email: "", phone: "", job_title: "", contact_type: type }]);
  }

  function updateContact(idx: number, patch: Partial<ContactDraft>) {
    setContacts(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }

  function removeContact(idx: number, id?: string) {
    if (id) setDeletedContactIds(prev => [...prev, id]);
    setContacts(prev => prev.filter((_, i) => i !== idx));
  }

  async function toggleReport() {
    if (showReport) { setShowReport(false); return; }
    setShowReport(true);
    if (!stats) {
      setReportLoading(true);
      const [statsData, surveyData] = await Promise.all([
        getStandaloneQRStats(ex.id),
        getExhibitorSurvey(ex.id).then(async (s) => {
          if (!s?.id) return [];
          return getSurveyResults(s.id);
        }),
      ]);
      setStats(statsData);
      setSurveyResults(surveyData as SurveyResult[]);
      setReportLoading(false);
    }
  }

  function handleQRDownload() {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download = `${ex.company_name.replace(/\s+/g, "-")}-qr.png`;
      a.href = canvas.toDataURL("image/png");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = dataUri;
  }

  function handleExcelExport() {
    startExport(async () => {
      const data = await getStandaloneQRExportData(ex.id);
      const lines: string[] = [];
      lines.push("=== TARAMALAR ===");
      lines.push("Tarih,Ziyaretçi Adı,Ziyaretçi E-posta");
      data.scans.forEach(s => {
        lines.push(`"${new Date(s.scanned_at).toLocaleString("tr-TR")}","${s.visitor_name ?? "Misafir"}","${s.visitor_email ?? ""}"`);
      });
      lines.push("", "=== ANKET YANITLARI ===");
      lines.push("Ziyaretçi E-posta,Soru,Yanıt,Tarih");
      data.surveyResponses.forEach(r => {
        lines.push(`"${r.visitor_email ?? ""}","${r.question_text}","${r.response_value}","${new Date(r.created_at).toLocaleString("tr-TR")}"`);
      });
      const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${ex.company_name}-qr-raporu.csv`;
      a.click();
    });
  }

  return (
    <motion.div initial={{ y: 14 }} animate={{ y: 0 }} className="glass rounded-xl border border-white/8 p-5 space-y-4">
      {/* Ana satır */}
      <div className="flex items-start gap-5">
        <div ref={qrRef} className="flex-shrink-0 p-2.5 bg-white rounded-xl shadow-md">
          {url ? (
            <QRCodeSVG value={url} size={96} level="M" fgColor="#1a1a2e" bgColor="white" />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gray-100 animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-white">{ex.company_name}</p>
            <Badge className="text-[10px] bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25">Bağımsız</Badge>
          </div>
          {(ex.contact_name || ex.job_title) && (
            <p className="text-xs text-muted-foreground mb-1">{[ex.contact_name, ex.job_title].filter(Boolean).join(" · ")}</p>
          )}
          <p className="text-xs text-muted-foreground mb-3">Herhangi bir etkinlikte, kongre veya toplantıda kullanılabilir.</p>

          {/* Satır 1: temel eylemler */}
          <div className="flex flex-wrap gap-2 mb-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={copy}>
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "Kopyalandı!" : "Linki Kopyala"}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleQRDownload} disabled={!url}>
              <Download className="w-3 h-3" /> QR PNG
            </Button>
            <Link href={`/scan/${ex.qr_token}`} target="_blank">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                <ExternalLink className="w-3 h-3" /> Önizle
              </Button>
            </Link>
            <Button
              size="sm"
              variant={isEditing ? "gradient" : "outline"}
              className="h-7 text-xs gap-1.5"
              onClick={() => setIsEditing(v => !v)}
            >
              <Pencil className="w-3 h-3" /> {isEditing ? "Düzenleniyor..." : "Düzenle"}
            </Button>
          </div>

          {/* Satır 2: rapor / anket / export / sil */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={showReport ? "gradient" : "outline"}
              className="h-7 text-xs gap-1.5"
              onClick={toggleReport}
            >
              <BarChart2 className="w-3 h-3" /> Rapor
            </Button>
            <Button
              size="sm"
              variant={showSurvey ? "gradient" : "outline"}
              className="h-7 text-xs gap-1.5"
              onClick={() => setShowSurvey(v => !v)}
            >
              <ClipboardList className="w-3 h-3" /> Anket
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              disabled={exporting}
              onClick={handleExcelExport}
            >
              <FileDown className="w-3 h-3" /> {exporting ? "Hazırlanıyor..." : "Excel İndir"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10"
              disabled={deleting}
              onClick={() => startDelete(async () => { await deleteStandaloneExhibitor(ex.id); onDelete(ex.id); })}
            >
              <Trash2 className="w-3 h-3" /> Sil
            </Button>
          </div>
        </div>
      </div>

      {/* Düzenle formu */}
      {isEditing && (
        <motion.div initial={{ y: 8 }} animate={{ y: 0 }}
          className="border-t border-white/8 pt-4 space-y-4"
        >
          <p className="text-xs font-semibold text-white uppercase tracking-wider">QR Bilgilerini Düzenle</p>

          {/* Temel bilgiler */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Firma / Etiket Adı</Label>
              <Input value={editCompany} onChange={e => setEditCompany(e.target.value)} placeholder={ex.company_name} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Yetkili Adı</Label>
              <Input value={editContact} onChange={e => setEditContact(e.target.value)} placeholder="Ali Yılmaz" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unvan</Label>
              <Input value={editJob} onChange={e => setEditJob(e.target.value)} placeholder="Satış Müdürü" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+90 5xx..." className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Şehir</Label>
              <Input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="İstanbul" className="h-8 text-sm" />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Web Sitesi</Label>
              <Input value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="https://firmam.com" className="h-8 text-sm" />
            </div>
          </div>

          {/* Tanıtım videosu */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-white">Tanıtım Videosu</Label>
            <Input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... veya Vimeo linki"
              className="h-8 text-sm" />
            <p className="text-[11px] text-muted-foreground">Ziyaretçiler QR taradığında bu videoyu görecek.</p>
          </div>

          {/* Puan & Ödül */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white">Puan & Ödül Ayarları</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Video izleme puanı</Label>
                <Input type="number" min={0} max={999} value={editVideoPoints}
                  onChange={e => setEditVideoPoints(Number(e.target.value))}
                  placeholder="0" className="h-7 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Anket doldurma puanı</Label>
                <Input type="number" min={0} max={999} value={editSurveyPoints}
                  onChange={e => setEditSurveyPoints(Number(e.target.value))}
                  placeholder="0" className="h-7 text-xs" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Özel ödül / teşvik mesajı</Label>
              <Input value={editCustomReward} onChange={e => setEditCustomReward(e.target.value)}
                placeholder='Örn: "İlk 10 ankete katılana kahve ısmarlıyoruz!"'
                className="h-8 text-sm" />
            </div>
          </div>

          {/* Firma Yetkilileri */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-white">Firma Yetkilileri</Label>
              <Button type="button" size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1"
                disabled={contacts.filter(c => c.contact_type === "official").length >= 5}
                onClick={() => addContact("official")}
              >
                <Plus className="w-3 h-3" /> Ekle
              </Button>
            </div>
            {contactsLoading ? (
              <div className="h-8 rounded bg-white/5 animate-pulse" />
            ) : contacts.filter(c => c.contact_type === "official").length === 0 ? (
              <p className="text-[11px] text-muted-foreground">Henüz yetkili eklenmedi.</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c, idx) => c.contact_type !== "official" ? null : (
                  <EditContactRow key={c.id ?? `new-off-${idx}`} c={c}
                    onChange={patch => updateContact(idx, patch)}
                    onRemove={() => removeContact(idx, c.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Stant Görevlileri */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-white">Stant Görevlileri</Label>
              <Button type="button" size="sm" variant="outline" className="h-6 text-[11px] px-2 gap-1"
                disabled={contacts.filter(c => c.contact_type === "booth").length >= 5}
                onClick={() => addContact("booth")}
              >
                <Plus className="w-3 h-3" /> Ekle
              </Button>
            </div>
            {!contactsLoading && contacts.filter(c => c.contact_type === "booth").length === 0 && (
              <p className="text-[11px] text-muted-foreground">Henüz stant görevlisi eklenmedi.</p>
            )}
            {!contactsLoading && (
              <div className="space-y-2">
                {contacts.map((c, idx) => c.contact_type !== "booth" ? null : (
                  <EditContactRow key={c.id ?? `new-booth-${idx}`} c={c}
                    onChange={patch => updateContact(idx, patch)}
                    onRemove={() => removeContact(idx, c.id)} />
                ))}
              </div>
            )}
          </div>

          {saveErr && <p className="text-xs text-red-400">{saveErr}</p>}
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setSaveErr(null); setContacts([]); }}>İptal</Button>
          </div>
        </motion.div>
      )}

      {/* Rapor bölümü */}
      {showReport && (
        <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="border-t border-white/8 pt-4 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Raporu</p>
          {reportLoading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[0,1,2].map(i => <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />)}
              </div>
              <div className="h-20 rounded-lg bg-white/5 animate-pulse" />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="glass rounded-lg border border-white/8 p-3 text-center">
                  <p className="text-xl font-bold text-white">{stats.scan_count}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tarama</p>
                </div>
                <div className="glass rounded-lg border border-white/8 p-3 text-center">
                  <p className="text-xl font-bold text-brand-cyan">{stats.unique_visitors}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tekil Kişi</p>
                </div>
                <div className="glass rounded-lg border border-white/8 p-3 text-center">
                  <p className="text-xl font-bold text-brand-violet-light">{stats.survey_fill_count}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Anket Dolduran</p>
                </div>
              </div>

              {surveyResults && surveyResults.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anket Cevapları</p>
                  {surveyResults.map(q => {
                    const answers = q.question_type === "yes_no"
                      ? ["Evet", "Hayır"]
                      : (q.options ?? Object.keys(q.counts));
                    const total = q.total || 1;
                    return (
                      <div key={q.id} className="glass rounded-lg border border-white/8 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-white">{q.question_text}</p>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">{q.total} yanıt</span>
                        </div>
                        <div className="space-y-1.5">
                          {answers.map(answer => {
                            const count = q.counts[answer] ?? 0;
                            const pct = Math.round((count / total) * 100);
                            return (
                              <div key={answer} className="space-y-0.5">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-muted-foreground">{answer}</span>
                                  <span className="text-white font-medium">{count} ({pct}%)</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-violet"
                                    style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {surveyResults && surveyResults.length === 0 && (
                <p className="text-xs text-muted-foreground">Bu QR&apos;a henüz anket eklenmemiş veya yanıt yok.</p>
              )}
            </>
          ) : null}
        </motion.div>
      )}

      {/* Anket bölümü */}
      {showSurvey && (
        <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="border-t border-white/8 pt-4">
          <MiniSurveyPanel exhibitorId={ex.id} />
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── MiniSurveyPanel ──────────────────────────────────────────
function MiniSurveyPanel({ exhibitorId }: { exhibitorId: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] = useState<"yes_no" | "multiple_choice">("yes_no");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getExhibitorSurvey(exhibitorId).then(data => {
      setSurvey(data as Survey | null);
      setLoaded(true);
    });
  }, [exhibitorId]);

  async function ensureSurvey() {
    if (survey) return survey.id;
    const result = await createOrGetSurvey(exhibitorId);
    if (result.error || !result.surveyId) { setErr(result.error ?? "Hata"); return null; }
    const ns: Survey = { id: result.surveyId, title: "Anket", is_active: true, questions: [] };
    setSurvey(ns);
    return result.surveyId;
  }

  function handleToggle() {
    if (!survey) return;
    startTransition(async () => {
      await toggleSurvey(survey.id, !survey.is_active);
      setSurvey(prev => prev ? { ...prev, is_active: !prev.is_active } : prev);
    });
  }

  function handleAddQuestion() {
    if (!newQuestion.trim()) { setErr("Soru metni boş bırakılamaz"); return; }
    if (newType === "multiple_choice" && newOptions.filter(o => o.trim()).length < 2) {
      setErr("En az 2 seçenek giriniz"); return;
    }
    if ((survey?.questions.length ?? 0) >= 5) { setErr("En fazla 5 soru"); return; }
    setErr(null);
    startTransition(async () => {
      const surveyId = await ensureSurvey();
      if (!surveyId) return;
      const opts = newType === "multiple_choice" ? newOptions.filter(o => o.trim()) : undefined;
      const result = await addQuestion({
        surveyId,
        question_text: newQuestion.trim(),
        question_type: newType,
        options: opts,
        sort_order: survey?.questions.length ?? 0,
      });
      if (result.error) { setErr(result.error); return; }
      const nq: SurveyQuestion = {
        id: crypto.randomUUID(),
        question_text: newQuestion.trim(),
        question_type: newType,
        options: opts ?? null,
        sort_order: survey?.questions.length ?? 0,
        is_required: false,
      };
      setSurvey(prev => prev
        ? { ...prev, questions: [...prev.questions, nq] }
        : { id: surveyId, title: "Anket", is_active: true, questions: [nq] }
      );
      setNewQuestion(""); setNewOptions(["", ""]); setShowAdd(false);
    });
  }

  function handleDelete(questionId: string) {
    startTransition(async () => {
      await deleteQuestion(questionId);
      setSurvey(prev => prev ? { ...prev, questions: prev.questions.filter(q => q.id !== questionId) } : prev);
    });
  }

  if (!loaded) {
    return <div className="text-xs text-muted-foreground">Anket yükleniyor...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white uppercase tracking-wider">Bu QR'a Özel Anket</p>
        {survey && (
          <button onClick={handleToggle} disabled={isPending} className="flex items-center gap-1.5 text-xs">
            {survey.is_active ? (
              <><ToggleRight className="w-5 h-5 text-brand-cyan" /><span className="text-brand-cyan">Aktif</span></>
            ) : (
              <><ToggleLeft className="w-5 h-5 text-muted-foreground" /><span className="text-muted-foreground">Pasif</span></>
            )}
          </button>
        )}
      </div>

      {(survey?.questions ?? []).map((q, i) => (
        <div key={q.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/3 border border-white/8">
          <span className="w-5 h-5 rounded-full bg-brand-indigo/15 border border-brand-indigo/25 flex items-center justify-center text-[10px] font-bold text-brand-indigo-light flex-shrink-0 mt-0.5">{i+1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white">{q.question_text}</p>
            <p className="text-[11px] text-muted-foreground">{q.question_type === "yes_no" ? "Evet/Hayır" : "Çoktan Seçmeli"}</p>
          </div>
          <button onClick={() => handleDelete(q.id)} disabled={isPending}
            className="p-1 text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {(survey?.questions.length ?? 0) === 0 && !showAdd && (
        <p className="text-xs text-muted-foreground">Henüz soru yok. Aşağıdan ekle.</p>
      )}

      {showAdd ? (
        <div className="p-3 rounded-lg border border-brand-indigo/20 bg-brand-indigo/5 space-y-2">
          <Input
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="Soru metni..."
            className="h-8 text-xs"
          />
          <div className="flex gap-2">
            {(["yes_no", "multiple_choice"] as const).map(type => (
              <button key={type} onClick={() => setNewType(type)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs border transition-all ${
                  newType === type ? "border-brand-indigo bg-brand-indigo/15 text-white" : "border-white/10 text-muted-foreground"
                }`}>
                {type === "yes_no" ? "Evet/Hayır" : "Çoktan Seçmeli"}
              </button>
            ))}
          </div>
          {newType === "multiple_choice" && (
            <div className="space-y-1.5">
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-1.5">
                  <Input value={opt} onChange={e => { const u = [...newOptions]; u[i] = e.target.value; setNewOptions(u); }}
                    placeholder={`Seçenek ${i+1}`} className="h-7 text-xs" />
                  {newOptions.length > 2 && (
                    <button onClick={() => setNewOptions(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              ))}
              {newOptions.length < 4 && (
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => setNewOptions(prev => [...prev, ""])}>
                  <Plus className="w-3 h-3" /> Seçenek
                </Button>
              )}
            </div>
          )}
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" className="h-7 text-xs" onClick={handleAddQuestion} disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setShowAdd(false); setErr(null); }}>İptal</Button>
          </div>
        </div>
      ) : (survey?.questions.length ?? 0) < 5 && (
        <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => setShowAdd(true)}>
          <Plus className="w-3.5 h-3.5" /> Soru Ekle
        </Button>
      )}
    </div>
  );
}

function StandaloneTab({ exhibitors, profile, router }: { exhibitors: ExhibitorRow[]; profile: Profile; router: ReturnType<typeof useRouter> }) {
  const [standaloneLabel, setStandaloneLabel] = useState("");
  const [creating, startCreate] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [localNew, setLocalNew] = useState<ExhibitorRow[]>([]);

  function getEvent(ex: ExhibitorRow) {
    const ev = ex.event;
    if (!ev) return null;
    return Array.isArray(ev) ? ev[0] ?? null : ev;
  }

  const fromDB  = exhibitors.filter(ex => getEvent(ex) === null);
  const all = [...fromDB, ...localNew];

  function handleCreate() {
    const label = standaloneLabel.trim() || (profile.full_name ? `${profile.full_name} — Bağımsız QR` : "Bağımsız QR");
    startCreate(async () => {
      const { error: err, qrToken } = await createStandaloneExhibitor(label);
      if (err) {
        setError(err);
      } else {
        setError(null);
        setStandaloneLabel("");
        router.refresh();
      }
    });
  }

  function handleDelete(id: string) {
    setLocalNew(prev => prev.filter(e => e.id !== id));
    router.refresh();
  }

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-5">
      <div className="glass rounded-xl border border-brand-cyan/20 p-4 flex gap-3">
        <QrCode className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground leading-relaxed">
          <span className="text-white font-medium">Bağımsız QR</span> — Herhangi bir fuara bağlı olmayan dijital kartvizit QR kodları oluştur.
          Kongreler, workshoplar, iş toplantıları veya sosyal etkinliklerde kullanabilirsin.
          QR tarandığında ziyaretçiler dijital kartvizitin görür; anket ekleyebilirsin.
        </div>
      </div>

      <div className="glass rounded-xl border border-white/10 p-5 space-y-3">
        <p className="text-sm font-semibold text-white">Yeni Bağımsız QR Oluştur</p>
        <div className="flex gap-3">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-indigo/50"
            placeholder='Etiket — örn. "Kongre 2026", "Genel QR" (isteğe bağlı)'
            value={standaloneLabel}
            onChange={e => setStandaloneLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
          />
          <Button variant="gradient" className="gap-2 flex-shrink-0" disabled={creating} onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            {creating ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {all.length === 0 ? (
        <div className="glass rounded-2xl border border-white/8 p-10 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Henüz bağımsız QR yok. Yukarıdan oluşturabilirsin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {all.map(ex => (
            <StandaloneQRCard key={ex.id} ex={ex} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Tab: Anket ───────────────────────────────────────────────
function SurveyTab({ exhibitorId, initialSurvey }: { exhibitorId: string; initialSurvey: Survey | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [survey, setSurvey] = useState<Survey | null>(initialSurvey);
  const [newQuestion, setNewQuestion] = useState("");
  const [newType, setNewType] = useState<"yes_no" | "multiple_choice">("yes_no");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureSurvey() {
    if (survey) return survey.id;
    const result = await createOrGetSurvey(exhibitorId);
    if (result.error || !result.surveyId) { setError(result.error ?? "Hata"); return null; }
    const newSurvey: Survey = { id: result.surveyId, title: "Anket", is_active: true, questions: [] };
    setSurvey(newSurvey);
    return result.surveyId;
  }

  function handleToggle() {
    if (!survey) return;
    startTransition(async () => {
      await toggleSurvey(survey.id, !survey.is_active);
      setSurvey(prev => prev ? { ...prev, is_active: !prev.is_active } : prev);
    });
  }

  function handleAddQuestion() {
    if (!newQuestion.trim()) { setError("Soru metni boş bırakılamaz"); return; }
    if (newType === "multiple_choice" && newOptions.filter(o => o.trim()).length < 2) {
      setError("En az 2 seçenek giriniz"); return;
    }
    if ((survey?.questions.length ?? 0) >= 5) { setError("En fazla 5 soru eklenebilir"); return; }

    setError(null);
    startTransition(async () => {
      const surveyId = await ensureSurvey();
      if (!surveyId) return;
      const opts = newType === "multiple_choice" ? newOptions.filter(o => o.trim()) : undefined;
      const result = await addQuestion({
        surveyId,
        question_text: newQuestion.trim(),
        question_type: newType,
        options: opts,
        sort_order: (survey?.questions.length ?? 0),
      });
      if (result.error) { setError(result.error); return; }
      const newQ: SurveyQuestion = {
        id: crypto.randomUUID(),
        question_text: newQuestion.trim(),
        question_type: newType,
        options: opts ?? null,
        sort_order: (survey?.questions.length ?? 0),
        is_required: false,
      };
      setSurvey(prev => prev
        ? { ...prev, questions: [...prev.questions, newQ] }
        : { id: surveyId, title: "Anket", is_active: true, questions: [newQ] }
      );
      setNewQuestion("");
      setNewOptions(["", ""]);
      setShowAdd(false);
      router.refresh();
    });
  }

  function handleDeleteQuestion(questionId: string) {
    startTransition(async () => {
      await deleteQuestion(questionId);
      setSurvey(prev => prev ? { ...prev, questions: prev.questions.filter(q => q.id !== questionId) } : prev);
    });
  }

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-4 max-w-2xl">
      {/* Anket aktif/pasif */}
      <div className="glass rounded-xl border border-white/8 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-white text-sm">Anket Durumu</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {survey?.is_active ? "Aktif — ziyaretçiler QR taradıktan sonra soruları görür" : "Pasif — sorular gösterilmiyor"}
          </p>
        </div>
        <button onClick={handleToggle} disabled={isPending} className="flex-shrink-0">
          {survey?.is_active ? (
            <ToggleRight className="w-8 h-8 text-brand-cyan" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Soru listesi */}
      <div className="space-y-2">
        {(survey?.questions ?? []).map((q, i) => (
          <div key={q.id} className="glass rounded-xl border border-white/8 p-4 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-brand-indigo/15 border border-brand-indigo/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-brand-indigo-light">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium">{q.question_text}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-muted-foreground">
                  {q.question_type === "yes_no" ? "Evet / Hayır" : "Çoktan Seçmeli"}
                </span>
                {q.options && q.options.length > 0 && (
                  <span className="text-xs text-muted-foreground">{q.options.join(" · ")}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDeleteQuestion(q.id)}
              disabled={isPending}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {(survey?.questions.length ?? 0) === 0 && !showAdd && (
          <div className="glass rounded-xl border border-white/8 p-6 text-center text-muted-foreground text-sm">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            Henüz soru eklenmedi. Ziyaretçilere sormak istediğin soruları ekle.
          </div>
        )}
      </div>

      {/* Yeni soru formu */}
      {showAdd ? (
        <div className="glass rounded-xl border border-brand-indigo/20 p-4 space-y-3">
          <p className="text-sm font-semibold text-white">Yeni Soru</p>
          <div className="space-y-2">
            <Label>Soru Metni</Label>
            <Input
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="Ürünümüzü daha önce kullandınız mı?"
            />
          </div>
          <div className="space-y-2">
            <Label>Soru Tipi</Label>
            <div className="flex gap-2">
              {(["yes_no", "multiple_choice"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-all ${
                    newType === type
                      ? "border-brand-indigo bg-brand-indigo/15 text-white"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  {type === "yes_no" ? "Evet / Hayır" : "Çoktan Seçmeli"}
                </button>
              ))}
            </div>
          </div>
          {newType === "multiple_choice" && (
            <div className="space-y-2">
              <Label>Seçenekler (en az 2, en fazla 4)</Label>
              {newOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={opt}
                    onChange={e => {
                      const updated = [...newOptions];
                      updated[i] = e.target.value;
                      setNewOptions(updated);
                    }}
                    placeholder={`Seçenek ${i + 1}`}
                  />
                  {newOptions.length > 2 && (
                    <button onClick={() => setNewOptions(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-2 text-muted-foreground hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {newOptions.length < 4 && (
                <Button type="button" variant="outline" size="sm" onClick={() => setNewOptions(prev => [...prev, ""])}>
                  <Plus className="w-3.5 h-3.5" /> Seçenek Ekle
                </Button>
              )}
            </div>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button variant="gradient" size="sm" onClick={handleAddQuestion} disabled={isPending}>
              {isPending ? "Kaydediliyor..." : "Soruyu Kaydet"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setError(null); }}>İptal</Button>
          </div>
        </div>
      ) : (
        (survey?.questions.length ?? 0) < 5 && (
          <Button variant="outline" onClick={() => setShowAdd(true)} className="w-full">
            <Plus className="w-4 h-4" /> Soru Ekle
          </Button>
        )
      )}

      {(survey?.questions.length ?? 0) >= 5 && (
        <p className="text-xs text-muted-foreground text-center">Maksimum 5 soru eklenebilir.</p>
      )}
    </motion.div>
  );
}

// ─── Tab: Sonuçlar ────────────────────────────────────────────
type SurveyResult = {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  total: number;
  counts: Record<string, number>;
};

function SurveyResultsTab({ surveyId, surveyTitle }: { surveyId: string | null; surveyTitle: string }) {
  const [results, setResults] = useState<SurveyResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!surveyId) return;
    setLoading(true);
    getSurveyResults(surveyId).then(data => {
      setResults(data as SurveyResult[]);
      setLoading(false);
    });
  }, [surveyId]);

  if (!surveyId) {
    return (
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 p-10 text-center">
        <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <h2 className="font-display text-lg font-semibold text-white mb-2">Henüz anket yok</h2>
        <p className="text-muted-foreground text-sm">Önce Anket sekmesinden sorularını oluştur.</p>
      </motion.div>
    );
  }

  if (loading) {
    return <div className="text-muted-foreground text-sm text-center py-12">Sonuçlar yükleniyor...</div>;
  }

  if (results.length === 0) {
    return (
      <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="glass rounded-2xl border border-white/8 p-10 text-center">
        <ClipboardList className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <h2 className="font-display text-lg font-semibold text-white mb-2">Henüz yanıt yok</h2>
        <p className="text-muted-foreground text-sm">Ziyaretçiler QR tarayıp anket doldurduğunda sonuçlar burada görünecek.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList className="w-4 h-4 text-brand-violet-light" />
        <h3 className="font-semibold text-white text-sm">{surveyTitle} — Sonuçlar</h3>
      </div>
      {results.map((q) => {
        const total = q.total || 1;
        const answers = q.question_type === "yes_no"
          ? ["Evet", "Hayır"]
          : (q.options ?? Object.keys(q.counts));

        return (
          <div key={q.id} className="glass rounded-xl border border-white/8 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-white">{q.question_text}</p>
              <span className="text-xs text-muted-foreground flex-shrink-0">{q.total} yanıt</span>
            </div>
            <div className="space-y-2">
              {answers.map((answer) => {
                const count = q.counts[answer] ?? 0;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={answer} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{answer}</span>
                      <span className="text-white font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/6 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-violet"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ─── Tab: Önizleme ────────────────────────────────────────────
function PreviewTab({ exhibitor, survey }: { exhibitor: ExhibitorRow; survey: Survey | null }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getExhibitorContacts(exhibitor.id).then(data => setContacts(data as Contact[]));
    getExhibitorProducts(exhibitor.id).then(data => setProducts(data as Product[]));
  }, [exhibitor.id]);

  const officialContacts = contacts.filter(c => c.contact_type === "official");
  const boothContacts    = contacts.filter(c => c.contact_type === "booth");

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-4">
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Eye className="w-4 h-4" /> Ziyaretçinin QR taradığında göreceği kartvizit önizlemesi
      </p>

      <div className="max-w-sm mx-auto glass rounded-2xl border border-white/8 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-brand-indigo/20 to-brand-violet/10 border-b border-white/8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {exhibitor.logo_url ? (
                <Image src={exhibitor.logo_url} alt="logo" width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground/60" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-white text-lg leading-tight">{exhibitor.company_name}</p>
              {exhibitor.city && <p className="text-muted-foreground text-xs mt-0.5">{exhibitor.city}</p>}
            </div>
          </div>

          {/* İletişim butonları */}
          {(exhibitor.phone || exhibitor.website || exhibitor.linkedin_url) && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {exhibitor.phone && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-xs text-white">
                  <Phone className="w-3 h-3" /> Ara
                </span>
              )}
              {exhibitor.website && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-xs text-white">
                  <Globe className="w-3 h-3" /> Site
                </span>
              )}
              {exhibitor.linkedin_url && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-xs text-white">
                  <Linkedin className="w-3 h-3" /> LinkedIn
                </span>
              )}
            </div>
          )}
        </div>

        {/* Açıklama + etiketler */}
        {(exhibitor.description || exhibitor.tags.length > 0) && (
          <div className="p-4 border-b border-white/8 space-y-2">
            {exhibitor.description && (
              <p className="text-xs text-muted-foreground line-clamp-3">{exhibitor.description}</p>
            )}
            {exhibitor.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {exhibitor.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/20 text-brand-indigo-light">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Yetkili Kişiler */}
        {officialContacts.length > 0 && (
          <div className="p-4 border-b border-white/8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Yetkili Kişiler</p>
            <div className="space-y-2">
              {officialContacts.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{c.full_name}</p>
                    {c.job_title && <p className="text-[11px] text-muted-foreground truncate">{c.job_title}</p>}
                  </div>
                  {c.email && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-cyan/15 border border-brand-cyan/25 text-[11px] text-brand-cyan flex-shrink-0">
                      <Mail className="w-2.5 h-2.5" /> Mail At
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stant Yetkilileri */}
        {boothContacts.length > 0 && (
          <div className="p-4 border-b border-white/8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Stant Yetkilileri</p>
            <div className="space-y-2">
              {boothContacts.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{c.full_name}</p>
                    {c.job_title && <p className="text-[11px] text-muted-foreground truncate">{c.job_title}</p>}
                  </div>
                  {c.email && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-violet/15 border border-brand-violet/25 text-[11px] text-brand-violet-light flex-shrink-0">
                      <Mail className="w-2.5 h-2.5" /> Mail At
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ürünler */}
        {products.length > 0 && (
          <div className="p-4 border-b border-white/8">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ürünler</p>
            <div className="space-y-2">
              {products.slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center gap-3 py-1.5">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.image_url ? (
                      <Image src={p.image_url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                    ) : p.video_url ? (
                      <Play className="w-4 h-4 text-brand-cyan/60" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>
                    )}
                    {p.video_url && (
                      <span className="flex items-center gap-1 text-[11px] text-brand-cyan mt-0.5">
                        <Play className="w-2.5 h-2.5" /> Tanıtım Videosu
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {products.length > 3 && (
                <p className="text-[11px] text-muted-foreground">+{products.length - 3} ürün daha</p>
              )}
            </div>
          </div>
        )}

        {/* Check-in */}
        <div className="p-4 border-b border-white/8">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-cyan/15 border border-brand-cyan/25">
            <QrCode className="w-5 h-5 text-brand-cyan flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Bağlantı Kur</p>
              <p className="text-xs text-muted-foreground">+20 puan kazan</p>
            </div>
          </div>
        </div>

        {/* Anket önizleme */}
        {survey && survey.is_active && survey.questions.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Anket</p>
            {survey.questions.slice(0, 2).map(q => (
              <div key={q.id} className="mb-3">
                <p className="text-xs text-white mb-1.5">{q.question_text}</p>
                {q.question_type === "yes_no" ? (
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full border border-white/15 text-xs text-muted-foreground">Evet</span>
                    <span className="px-3 py-1 rounded-full border border-white/15 text-xs text-muted-foreground">Hayır</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {(q.options ?? []).map(opt => (
                      <span key={opt} className="px-2 py-0.5 rounded-full border border-white/15 text-xs text-muted-foreground">{opt}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {survey.questions.length > 2 && (
              <p className="text-xs text-muted-foreground">+{survey.questions.length - 2} soru daha...</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
