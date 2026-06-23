"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Profile } from "@/types";
import { ORGANIZER_NAV } from "../_nav";

interface Props { profile: Profile }

function SectionCard({ icon: Icon, title, children, colorClass = "bg-brand-indigo/15 border-brand-indigo/30 text-brand-indigo-light" }: {
  icon: React.ElementType; title: string; children: React.ReactNode; colorClass?: string;
}) {
  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export function OrganizerSettingsClient({ profile }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [nameMsg, setNameMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  function handleSaveName() {
    if (!fullName.trim()) return;
    startTransition(async () => {
      setNameMsg(null);
      const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", profile.id);
      setNameMsg(error ? { type: "err", text: "Güncelleme başarısız." } : { type: "ok", text: "Ad başarıyla güncellendi." });
    });
  }

  function handlePasswordChange() {
    if (newPw.length < 8) { setPwMsg({ type: "err", text: "Şifre en az 8 karakter olmalı." }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: "err", text: "Şifreler eşleşmiyor." }); return; }
    startTransition(async () => {
      setPwMsg(null);
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) { setPwMsg({ type: "err", text: error.message }); }
      else { setPwMsg({ type: "ok", text: "Şifre başarıyla değiştirildi." }); setNewPw(""); setConfirmPw(""); }
    });
  }

  function handleDeleteAccount() {
    if (deleteConfirm !== "SİL") return;
    startTransition(async () => { await supabase.auth.signOut(); window.location.href = "/"; });
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
              <Settings className="w-5 h-5 text-brand-indigo-light" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Ayarlar</h1>
          </div>
          <p className="text-muted-foreground pl-12">Hesap bilgileri ve şifre</p>
        </motion.div>

        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <SectionCard icon={User} title="Hesap Bilgileri">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>E-posta</Label>
                <Input value={profile.email} readOnly className="opacity-50 cursor-not-allowed" />
                <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Ad Soyad</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" maxLength={80} />
              </div>
              {nameMsg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${msgCls(nameMsg.type)}`}>
                  <CheckCircle2 className="w-4 h-4" /> {nameMsg.text}
                </div>
              )}
              <Button variant="gradient" onClick={handleSaveName} disabled={isPending || !fullName.trim() || fullName.trim() === profile.full_name} className="w-full">
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </SectionCard>
        </motion.div>

        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <SectionCard icon={Lock} title="Şifre Değiştir" colorClass="bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Yeni Şifre</Label>
                <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="En az 8 karakter" />
              </div>
              <div className="space-y-1.5">
                <Label>Yeni Şifre (Tekrar)</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Şifreyi tekrarlayın" />
              </div>
              {pwMsg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${msgCls(pwMsg.type)}`}>
                  <CheckCircle2 className="w-4 h-4" /> {pwMsg.text}
                </div>
              )}
              <Button variant="outline" onClick={handlePasswordChange} disabled={isPending || !newPw || !confirmPw} className="w-full border-brand-cyan/30 text-brand-cyan hover:bg-brand-cyan/10">
                {isPending ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
              </Button>
            </div>
          </SectionCard>
        </motion.div>

        <motion.div initial={{ y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionCard icon={AlertTriangle} title="Tehlikeli Alan" colorClass="bg-red-500/10 border-red-500/30 text-red-400">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Hesabınızı silmek tüm verilerinizi kalıcı olarak kaldırır. Bu işlem geri alınamaz.</p>
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setDeleteOpen(true)}>
                <AlertTriangle className="w-4 h-4" /> Hesabı Sil
              </Button>
            </div>
          </SectionCard>
        </motion.div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-red-400">Hesabı Sil</DialogTitle>
              <DialogDescription>
                Bu işlem geri alınamaz. Onaylamak için <span className="text-white font-mono font-bold">SİL</span> yazın.
              </DialogDescription>
            </DialogHeader>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="SİL" className="text-center font-mono" />
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}>İptal</Button>
              <Button variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10" onClick={handleDeleteAccount} disabled={deleteConfirm !== "SİL" || isPending}>
                Kalıcı Olarak Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
