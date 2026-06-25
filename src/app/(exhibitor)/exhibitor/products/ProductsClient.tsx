"use client";

import { useState, useTransition, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Building2,
  Package,
  QrCode,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Trash2,
  AlertCircle,
  Upload,
  ImageOff,
  MessageSquare,
  Brain,
  CalendarClock,
  Store,
  Workflow,
} from "lucide-react";
import { createProduct, deleteProduct } from "@/features/exhibitors/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";

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
  { label: "Randevu Talepleri", href: "/exhibitor/meeting-requests", icon: CalendarClock },
  { label: "Satış Pipeline'ı", href: "/exhibitor/pipeline",       icon: Workflow },
  { label: "ROI Raporu",          href: "/exhibitor/roi-report",         icon: TrendingUp },
  { label: "Ayarlar",          href: "/exhibitor/settings",       icon: Settings },
];

interface ExhibitorMini { id: string; company_name: string }

export function ProductsClient({
  exhibitor,
  products: initialProducts,
}: {
  exhibitor: ExhibitorMini;
  products: Product[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState(initialProducts);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { setError("Görsel 3MB'dan küçük olmalı"); return; }

    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (upErr) { setError("Görsel yüklenemedi"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
  }

  function openCreate() {
    setName(""); setDesc(""); setImageUrl(null); setError(null);
    setOpen(true);
  }

  async function handleAdd() {
    if (!name.trim()) { setError("Ürün adı zorunlu"); return; }
    setError(null);
    startTransition(async () => {
      const result = await createProduct({
        exhibitor_id: exhibitor.id,
        name: name.trim(),
        description: desc,
        image_url: imageUrl,
      });
      if (result.error) { setError(result.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  async function handleDelete(product: Product) {
    startTransition(async () => {
      await deleteProduct(product.id, exhibitor.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    });
  }

  return (
    <DashboardShell role="exhibitor" userName="" navItems={NAV_ITEMS}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Ürünlerim</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {exhibitor.company_name} · {products.length} ürün
            </p>
          </div>
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Ürün Ekle
          </Button>
        </motion.div>

        {/* Products grid */}
        {products.length === 0 ? (
          <motion.div
            initial={{ y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl border border-brand-cyan/20 p-12 flex flex-col items-center text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/15 border border-brand-cyan/30 flex items-center justify-center mb-4">
              <Package className="w-7 h-7 text-brand-cyan" />
            </div>
            <h2 className="font-display text-lg font-semibold text-white mb-2">Ürün eklenmedi</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Standında sergileyeceğin ürün ve hizmetleri ekle. Ziyaretçiler QR tarayınca görecek.
            </p>
            <Button variant="gradient" onClick={openCreate}>
              <Plus className="w-4 h-4" /> İlk Ürünü Ekle
            </Button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="group glass rounded-xl border border-white/8 hover:border-white/15 transition-all overflow-hidden"
              >
                {/* Image */}
                <div className="h-36 bg-white/5 flex items-center justify-center overflow-hidden relative">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ImageOff className="w-8 h-8 text-muted-foreground/30" />
                  )}
                  <button
                    onClick={() => handleDelete(product)}
                    disabled={isPending}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/35"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm mb-1 truncate">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ürün Ekle</DialogTitle>
            <DialogDescription>Standında sergileyeceğin ürün veya hizmeti tanıt.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Ürün Görseli</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="h-32 rounded-xl border border-dashed border-white/15 hover:border-white/30 bg-white/3 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative"
              >
                {imageUrl ? (
                  <Image src={imageUrl} alt="preview" fill className="object-cover" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground mb-1.5" />
                    <span className="text-xs text-muted-foreground">
                      {uploading ? "Yükleniyor..." : "Görsel seç (maks 3MB)"}
                    </span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-name">Ürün / Hizmet Adı *</Label>
              <Input
                id="prod-name"
                placeholder="Akıllı Envanter Sistemi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod-desc">Açıklama</Label>
              <Textarea
                id="prod-desc"
                placeholder="Kısa açıklama..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>İptal</Button>
            <Button variant="gradient" onClick={handleAdd} disabled={isPending || uploading || !name.trim()}>
              {isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
