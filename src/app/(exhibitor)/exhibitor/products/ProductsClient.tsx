"use client";

import { EXHIBITOR_NAV } from "../_nav";

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
  Package,
  Plus,
  Trash2,
  AlertCircle,
  Upload,
  ImageOff,
  Link as LinkIcon,
  Play,
} from "lucide-react";
import { createProduct, deleteProduct } from "@/features/exhibitors/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";

type MediaMode = "upload" | "url" | "video";

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
  const [mediaMode, setMediaMode] = useState<MediaMode>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Görsel 5MB'dan küçük olmalı"); return; }

    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const ext = file.name.split(".").pop();
    const path = `products/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { upsert: true });

    if (upErr) { setError("Görsel yüklenemedi: " + upErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
  }

  function openCreate() {
    setName(""); setDesc(""); setImageUrl(null); setImageUrlInput("");
    setVideoUrl(""); setMediaMode("upload"); setError(null);
    setOpen(true);
  }

  function validateVideoUrl(url: string) {
    return url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com");
  }

  async function handleAdd() {
    if (!name.trim()) { setError("Ürün adı zorunlu"); return; }

    let finalImageUrl: string | null = null;
    let finalVideoUrl: string | null = null;

    if (mediaMode === "upload") {
      finalImageUrl = imageUrl;
    } else if (mediaMode === "url") {
      if (imageUrlInput && !imageUrlInput.startsWith("http")) { setError("Geçerli bir URL girin (https://...)"); return; }
      finalImageUrl = imageUrlInput || null;
    } else {
      if (videoUrl && !validateVideoUrl(videoUrl)) { setError("Lütfen YouTube veya Vimeo linki girin"); return; }
      finalVideoUrl = videoUrl || null;
    }

    setError(null);
    startTransition(async () => {
      const result = await createProduct({
        exhibitor_id: exhibitor.id,
        name: name.trim(),
        description: desc,
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
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

  const mediaTabs: { mode: MediaMode; label: string; icon: React.ReactNode }[] = [
    { mode: "upload", label: "Dosya Yükle", icon: <Upload className="w-3.5 h-3.5" /> },
    { mode: "url",    label: "Görsel URL",  icon: <LinkIcon className="w-3.5 h-3.5" /> },
    { mode: "video",  label: "Video URL",   icon: <Play className="w-3.5 h-3.5" /> },
  ];

  return (
    <DashboardShell role="exhibitor" userName="" navItems={EXHIBITOR_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: 12 }}
          animate={{ y: 0 }}
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
            animate={{ y: 0 }}
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
            {products.map((product, i) => {
              const p = product as Product & { video_url?: string | null };
              return (
                <motion.div
                  key={p.id}
                  initial={{ y: 16 }}
                  animate={{ y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group glass rounded-xl border border-white/8 hover:border-white/15 transition-all overflow-hidden"
                >
                  {/* Image / Video placeholder */}
                  <div className="h-36 bg-white/5 flex items-center justify-center overflow-hidden relative">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    ) : p.video_url ? (
                      <div className="flex flex-col items-center gap-1">
                        <Play className="w-8 h-8 text-brand-cyan/60" />
                        <span className="text-xs text-muted-foreground">Video</span>
                      </div>
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
                    <h3 className="font-semibold text-white text-sm mb-1 truncate">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    )}
                    {p.video_url && (
                      <a
                        href={p.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-brand-cyan hover:underline"
                      >
                        <Play className="w-3 h-3" /> Tanıtım Videosu
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
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

            {/* Media mode selector */}
            <div className="space-y-2">
              <Label>Medya Türü</Label>
              <div className="flex gap-1 p-1 glass rounded-lg border border-white/8">
                {mediaTabs.map(({ mode, label, icon }) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setMediaMode(mode); setError(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                      mediaMode === mode
                        ? "bg-brand-indigo text-white"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media input by mode */}
            {mediaMode === "upload" && (
              <div className="space-y-2">
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
                        {uploading ? "Yükleniyor..." : "Görsel seç (maks 5MB)"}
                      </span>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
            )}

            {mediaMode === "url" && (
              <div className="space-y-2">
                <Label>Görsel URL</Label>
                <Input
                  placeholder="https://example.com/urun-gorseli.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Ürüne ait genel erişime açık bir görsel URL'si</p>
              </div>
            )}

            {mediaMode === "video" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5 text-brand-cyan" /> Video URL</Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">YouTube veya Vimeo linki. QR sayfasında "Tanıtım Videosu" olarak gösterilir.</p>
              </div>
            )}

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
