"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  UserCircle2, Building2, Globe, Phone, MapPin, CheckCircle2, Camera,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Profile } from "@/types";
import { ORGANIZER_NAV } from "../_nav";

interface Props { profile: Profile }

export function OrganizerProfileClient({ profile }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState(profile.phone_number ?? "");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");

  function handleSave() {
    startTransition(async () => {
      setMsg(null);
      const updates: Record<string, string | null> = {
        full_name: fullName.trim() || null,
        phone_number: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };
      const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
      setMsg(error
        ? { type: "err", text: "Güncelleme başarısız: " + error.message }
        : { type: "ok", text: "Profil başarıyla güncellendi." }
      );
    });
  }

  const msgCls = (type: "ok" | "err") =>
    type === "ok"
      ? "bg-green-500/10 border border-green-500/20 text-green-400"
      : "bg-red-500/10 border border-red-500/20 text-red-400";

  return (
    <DashboardShell role="organizer" userName={profile.full_name || profile.email} navItems={ORGANIZER_NAV}>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Organizatör Profili</h1>
          </div>
          <p className="text-muted-foreground pl-12">Organizasyon kimliğinizi ve iletişim bilgilerinizi yönetin.</p>
        </motion.div>

        {/* Avatar + preview */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
          <div className="glass rounded-2xl border border-white/8 p-6 flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-indigo/30" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-brand-indigo/15 border-2 border-brand-indigo/30 flex items-center justify-center">
                  <UserCircle2 className="w-10 h-10 text-brand-indigo-light" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-indigo/20 border border-brand-indigo/40 flex items-center justify-center">
                <Camera className="w-3 h-3 text-brand-indigo-light" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{fullName || "—"}</p>
              <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
              <div className="mt-2">
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Avatar URL (https://...)"
                  className="text-xs h-8"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Kişisel bilgiler */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
              <div className="w-8 h-8 rounded-lg bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center">
                <UserCircle2 className="w-4 h-4 text-brand-indigo-light" />
              </div>
              <h2 className="font-semibold text-white">Kişisel Bilgiler</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Ad Soyad *</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label>E-posta</Label>
                  <Input value={profile.email} readOnly className="opacity-50 cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefon</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" maxLength={20} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Şehir</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="İstanbul" maxLength={60} />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Organizasyon bilgileri */}
        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="glass rounded-2xl border border-white/8 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
              <div className="w-8 h-8 rounded-lg bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-brand-violet-light" />
              </div>
              <h2 className="font-semibold text-white">Organizasyon</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Organizasyon Adı</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Teknik Fuar A.Ş." maxLength={120} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Web Sitesi</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://sirket.com" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Hakkında / Biyografi</Label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Organizasyonunuzu kısaca tanıtın..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-brand-violet/40 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
              </div>
            </div>
          </div>
        </motion.div>

        {msg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${msgCls(msg.type)}`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {msg.text}
          </motion.div>
        )}

        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button variant="gradient" onClick={handleSave} disabled={isPending || !fullName.trim()} className="w-full sm:w-auto">
            {isPending ? "Kaydediliyor..." : "Profili Kaydet"}
          </Button>
        </motion.div>
      </div>
    </DashboardShell>
  );
}
