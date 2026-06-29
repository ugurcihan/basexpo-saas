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
  Play, Package,
} from "lucide-react";
import {
  updateExhibitorProfile, getExhibitorContacts, upsertContact, deleteContact, getExhibitorProducts,
} from "@/features/exhibitors/actions";
import {
  createOrGetSurvey, addQuestion, deleteQuestion, toggleSurvey, updateQuestion, getSurveyResults,
} from "@/features/surveys/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase";
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
  event: EventInfo | EventInfo[];
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
  { key: "card",    label: "Kartvizit" },
  { key: "qr",     label: "QR Kodlarım" },
  { key: "survey", label: "Anket" },
  { key: "results",label: "Sonuçlar" },
  { key: "preview",label: "Önizleme" },
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
              <CardTab exhibitor={primary} router={router} />
            )}
            {tab === "qr" && (
              <QRTab exhibitors={exhibitors} />
            )}
            {tab === "survey" && (
              <SurveyTab exhibitorId={primary.id} initialSurvey={initialSurvey} />
            )}
            {tab === "results" && (
              <SurveyResultsTab surveyId={initialSurvey?.id ?? null} surveyTitle={initialSurvey?.title ?? "Anket"} />
            )}
            {tab === "preview" && (
              <PreviewTab exhibitor={primary} survey={initialSurvey} />
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

  const eventBased    = exhibitors.filter(ex => getEvent(ex) !== null);
  const standaloneQRs = exhibitors.filter(ex => getEvent(ex) === null);

  return (
    <motion.div initial={{ y: 16 }} animate={{ y: 0 }} className="space-y-6">
      {eventBased.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fuar QR Kodları
          </p>
          {eventBased.map((ex, i) => <QRCard key={ex.id} ex={ex} index={i} />)}
        </div>
      )}

      {standaloneQRs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bağımsız QR Kodları
            </p>
            <Badge className="text-[10px] bg-brand-cyan/15 text-brand-cyan border-brand-cyan/25">Fuar Dışı</Badge>
          </div>
          {standaloneQRs.map((ex, i) => <QRCard key={ex.id} ex={ex} index={i} />)}
        </div>
      )}

      {exhibitors.length === 0 && (
        <div className="glass rounded-2xl border border-white/8 p-10 text-center">
          <QrCode className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Henüz QR kod yok. Bir fuara kayıt ol veya Fuarlarım'dan bağımsız QR oluştur.</p>
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
