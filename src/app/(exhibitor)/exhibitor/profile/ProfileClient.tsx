"use client";

import { useState, useTransition, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard,
  Building2,
  Package,
  QrCode,
  Users,
  TrendingUp,
  Settings,
  Upload,
  X,
  Check,
  AlertCircle,
  Plus,
  Calendar,
  MapPin,
  Brain,
  Sparkles,
  MessageSquare,
  CalendarClock,
  Store,
} from "lucide-react";
import { createExhibitorProfile, updateExhibitorProfile } from "@/features/exhibitors/actions";
import { generateExhibitorEmbedding } from "@/features/ai/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { CreditCard, BadgeCheck, Zap } from "lucide-react";

const NAV_ITEMS = [
  { label: "Panel",            href: "/exhibitor",                icon: LayoutDashboard },
  { label: "Marka Profili",    href: "/exhibitor/profile",        icon: Building2 },
  { label: "QR Yarat",         href: "/exhibitor/qr",             icon: QrCode },
  { label: "Ürünlerim",        href: "/exhibitor/products",       icon: Package },
  { label: "Ziyaretçilerim",   href: "/exhibitor/leads",          icon: Users },
  { label: "Mesajlar",         href: "/exhibitor/messages",       icon: MessageSquare },
  { label: "Analiz AI",        href: "/exhibitor/analytics",      icon: Brain },
  { label: "Yaklaşan Fuarlar", href: "/exhibitor/upcoming-fairs", icon: CalendarClock },
  { label: "Fuar Standlarım",  href: "/exhibitor/my-booths",      icon: Store },
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

interface AvailableEvent {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface ExhibitorWithEvent {
  id: string;
  company_name: string;
  description: string;
  logo_url: string | null;
  tags: string[];
  qr_token: string;
  paid_at: string | null;
  event: {
    id: string;
    name: string;
    location: string;
    start_date: string;
    end_date: string;
  };
}

interface Props {
  exhibitor: ExhibitorWithEvent | null;
  availableEvents: AvailableEvent[];
}

export function ProfileClient({ exhibitor, availableEvents }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [companyName, setCompanyName] = useState(exhibitor?.company_name ?? "");
  const [description, setDescription] = useState(exhibitor?.description ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(exhibitor?.logo_url ?? null);
  const [tags, setTags] = useState<string[]>(exhibitor?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [selectedEventId, setSelectedEventId] = useState(exhibitor?.event.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Logo 2MB'dan küçük olmalı"); return; }

    setUploading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `logos/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (upErr) { setError("Logo yüklenemedi: " + upErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    setLogoUrl(urlData.publicUrl);
    setUploading(false);
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!companyName.trim()) { setError("Firma adı zorunlu"); return; }
    if (!exhibitor && !selectedEventId) { setError("Bir fuar seçmelisin"); return; }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      let result: { error: string | null };
      if (exhibitor) {
        result = await updateExhibitorProfile({
          id: exhibitor.id,
          company_name: companyName,
          description,
          logo_url: logoUrl,
          tags,
        });
      } else {
        result = await createExhibitorProfile({
          event_id: selectedEventId,
          company_name: companyName,
          description,
          logo_url: logoUrl,
          tags,
        });
      }

      if (result.error) { setError(result.error); return; }
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <DashboardShell role="exhibitor" userName="" navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 max-w-2xl space-y-6">
        {/* Header */}
        <motion.div initial={{ y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-white">
            {exhibitor ? "Firma Profilim" : "Profil Oluştur"}
          </h1>
          {exhibitor && (
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {exhibitor.event.name}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {exhibitor.event.location}
              </span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/8 p-6 space-y-5"
        >
          {/* Event select (only when creating) */}
          {!exhibitor && (
            <div className="space-y-2">
              <Label>Fuar Seç *</Label>
              {availableEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                  Şu an yayında fuar yok. Organizatör fuar yayınladığında burada görünür.
                </p>
              ) : (
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Katılmak istediğin fuarı seç..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEvents.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        <div>
                          <span className="font-medium">{ev.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">
                            {ev.location} · {new Date(ev.start_date).toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Logo upload */}
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
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploading ? "Yükleniyor..." : "Logo Yükle"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5">
                  PNG / JPG · Maks 2MB
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      Kaldır
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Company name */}
          <div className="space-y-2">
            <Label htmlFor="company-name">Firma Adı *</Label>
            <Input
              id="company-name"
              placeholder="Acme Teknoloji A.Ş."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Firma Açıklaması</Label>
            <Textarea
              id="description"
              placeholder="Firmanız, ürünleriniz ve fuar hedefleriniz hakkında kısa bir açıklama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              AI eşleştirme bu açıklamayı kullanır. Sektör, ürün kategorisi ve hedef kitle bilgisi ekle.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Etiketler</Label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-brand-indigo/15 border border-brand-indigo/25 text-brand-indigo-light"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Etiket ekle (Enter'a bas)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
                }}
                disabled={tags.length >= 10}
              />
              <Button type="button" variant="outline" size="icon" onClick={addTag} disabled={tags.length >= 10 || !tagInput.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Maks 10 etiket. Örn: yapay-zeka, robotik, medikal
            </p>
          </div>

          {/* Error / success */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              <Check className="w-4 h-4 flex-shrink-0" /> Profil kaydedildi!
            </div>
          )}

          <Button
            variant="gradient"
            className="w-full"
            onClick={handleSave}
            disabled={isPending || uploading}
          >
            {isPending ? "Kaydediliyor..." : exhibitor ? "Profili Güncelle" : "Profil Oluştur"}
          </Button>
        </motion.div>

        {/* Payment card — shown only when exhibitor exists */}
        {exhibitor && (
          <motion.div
            initial={{ y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <PaymentSection
              exhibitorId={exhibitor.id}
              paidAt={exhibitor.paid_at}
              eventName={exhibitor.event.name}
            />
          </motion.div>
        )}

        {/* AI embedding card — shown only when exhibitor exists */}
        {exhibitor && (
          <motion.div
            initial={{ y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl border border-brand-violet/15 p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-violet/15 border border-brand-violet/20 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-brand-violet-light" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm mb-0.5">AI Eşleştirme Profili</p>
              <p className="text-xs text-muted-foreground mb-3">
                Firma bilgilerinden OpenAI embedding oluşturur. Ziyaretçiler ilgi alanlarına göre seni bulur.
              </p>
              <AIEmbedButton exhibitorId={exhibitor.id} />
            </div>
          </motion.div>
        )}
      </div>
    </DashboardShell>
  );
}

function AIEmbedButton({ exhibitorId }: { exhibitorId: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleEmbed() {
    setStatus("idle");
    startTransition(async () => {
      const result = await generateExhibitorEmbedding(exhibitorId);
      if (result.error) { setStatus("error"); setErrorMsg(result.error); return; }
      setStatus("done");
    });
  }

  return (
    <div className="space-y-2">
      {status === "done" && (
        <p className="text-xs text-green-400">AI profili oluşturuldu.</p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-400">{errorMsg}</p>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleEmbed}
        disabled={isPending}
        className="text-xs"
      >
        <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isPending ? "animate-pulse" : ""}`} />
        {isPending ? "Oluşturuluyor..." : "AI Profili Oluştur / Güncelle"}
      </Button>
    </div>
  );
}

function PaymentSection({
  exhibitorId,
  paidAt,
  eventName,
}: {
  exhibitorId: string;
  paidAt: string | null;
  eventName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibitorId, eventName }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      window.location.href = data.url;
    } catch {
      setError("Ödeme sayfası açılamadı");
      setLoading(false);
    }
  }

  if (paidAt) {
    return (
      <div className="glass rounded-2xl border border-green-500/20 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center flex-shrink-0">
          <BadgeCheck className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm">Stand Aktif</p>
          <p className="text-xs text-muted-foreground">
            {new Date(paidAt).toLocaleDateString("tr-TR", { dateStyle: "long" })} tarihinde aktive edildi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-yellow-400/20 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
        <Zap className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white text-sm mb-0.5">Stand Aktivasyonu Gerekiyor</p>
        <p className="text-xs text-muted-foreground mb-3">
          QR kodunun aktif olması ve AI eşleştirmelerinde görünmen için stand aktivasyon ücretini öde.
        </p>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <Button variant="gradient" size="sm" onClick={handleCheckout} disabled={loading}>
          <CreditCard className="w-3.5 h-3.5" />
          {loading ? "Yönlendiriliyor..." : "Stand'ı Aktive Et — ₺99"}
        </Button>
      </div>
    </div>
  );
}
