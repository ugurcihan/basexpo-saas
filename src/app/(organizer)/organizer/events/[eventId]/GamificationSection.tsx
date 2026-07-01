"use client";

import { useState, useTransition, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, Package, Gift, Gamepad2,
  BarChart3, Box, Sparkles, Eye, EyeOff,
} from "lucide-react";
import {
  getLootBoxTypes, upsertLootBoxType, deleteLootBoxType,
  getLootRewards, upsertLootReward, deleteLootReward,
  toggleLootRewardActive, getGamificationStats,
} from "@/features/gamification/actions";
import type { LootBoxType, LootReward } from "@/features/gamification/actions";

// ── Sabitler ────────────────────────────────────────────────

const TIER_META = {
  common:    { label: "Yaygın",    color: "text-slate-300",   border: "border-slate-500/40",  bg: "bg-slate-500/10",   emoji: "📦" },
  rare:      { label: "Nadir",     color: "text-blue-300",    border: "border-blue-500/40",   bg: "bg-blue-500/10",    emoji: "💎" },
  epic:      { label: "Destansı",  color: "text-purple-300",  border: "border-purple-500/40", bg: "bg-purple-500/10",  emoji: "⚡" },
  legendary: { label: "Efsanevi", color: "text-yellow-300",  border: "border-yellow-500/40", bg: "bg-yellow-500/10",  emoji: "🏆" },
} as const;

const BOX_TIER_DEFAULTS = {
  common: { name: "Yaygın Kutu",   points_required: 200,  prob_common: 6500, prob_rare: 2500, prob_epic: 800, prob_legendary: 200 },
  rare:   { name: "Nadir Kutu",    points_required: 500,  prob_common: 4000, prob_rare: 3500, prob_epic: 2000, prob_legendary: 500 },
  epic:   { name: "Destansı Kutu", points_required: 1500, prob_common: 2000, prob_rare: 3000, prob_epic: 3500, prob_legendary: 1500 },
};

// ── Props ────────────────────────────────────────────────────

export function GamificationSection({ eventId }: { eventId: string }) {
  const [boxTypes, setBoxTypes]   = useState<LootBoxType[]>([]);
  const [rewards, setRewards]     = useState<LootReward[]>([]);
  const [stats, setStats]         = useState({ total_boxes: 0, opened_boxes: 0, rewards: [] as any[] });
  const [activePanel, setActivePanel] = useState<"boxes" | "rewards" | "stats">("boxes");
  const [isPending, startTransition] = useTransition();

  // Kutu formu
  const [boxForm, setBoxForm] = useState<{
    tier: "common" | "rare" | "epic";
    name: string;
    points_required: number;
    prob_common: number; prob_rare: number; prob_epic: number; prob_legendary: number;
  }>({ ...BOX_TIER_DEFAULTS.common, tier: "common" });

  // Ödül formu
  const [rewardForm, setRewardForm] = useState<{
    id?: string;
    tier: "common" | "rare" | "epic" | "legendary";
    name: string; description: string; total_stock: string; weight: number;
  }>({ tier: "common", name: "", description: "", total_stock: "", weight: 100 });

  const [boxError, setBoxError]       = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);

  function loadAll() {
    startTransition(async () => {
      const [bt, rw, st] = await Promise.all([
        getLootBoxTypes(eventId),
        getLootRewards(eventId),
        getGamificationStats(eventId),
      ]);
      setBoxTypes(bt);
      setRewards(rw);
      setStats(st);
    });
  }

  useEffect(() => { loadAll(); }, [eventId]);

  // Kutu tier değişince default'ları doldur
  function onBoxTierChange(tier: "common" | "rare" | "epic") {
    const existing = boxTypes.find(b => b.tier === tier);
    if (existing) {
      setBoxForm({ ...existing });
    } else {
      setBoxForm({ tier, ...BOX_TIER_DEFAULTS[tier] });
    }
  }

  function saveBox() {
    setBoxError(null);
    startTransition(async () => {
      const res = await upsertLootBoxType(eventId, boxForm);
      if (res.error) { setBoxError(res.error); return; }
      loadAll();
    });
  }

  function removeBox(id: string) {
    startTransition(async () => {
      await deleteLootBoxType(id, eventId);
      loadAll();
    });
  }

  function saveReward() {
    setRewardError(null);
    if (!rewardForm.name.trim()) { setRewardError("Ödül adı gerekli"); return; }
    startTransition(async () => {
      const res = await upsertLootReward(eventId, {
        ...rewardForm,
        total_stock: rewardForm.total_stock ? parseInt(rewardForm.total_stock) : null,
        description: rewardForm.description || undefined,
      });
      if (res.error) { setRewardError(res.error); return; }
      setRewardForm({ tier: "common", name: "", description: "", total_stock: "", weight: 100 });
      loadAll();
    });
  }

  function removeReward(id: string) {
    startTransition(async () => {
      await deleteLootReward(id, eventId);
      loadAll();
    });
  }

  function toggleReward(id: string, is_active: boolean) {
    startTransition(async () => {
      await toggleLootRewardActive(id, eventId, is_active);
      loadAll();
    });
  }

  const totalProb = boxForm.prob_common + boxForm.prob_rare + boxForm.prob_epic + boxForm.prob_legendary;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="glass rounded-2xl border border-purple-500/20 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Gamepad2 className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold text-white text-lg">Oyunlaştırma Yönetimi</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Loot box tipleri, ödül havuzu ve olasılık ayarları. Ziyaretçiler puan kazanarak kutu açar.
        </p>

        {/* Stats özet */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Toplam Kutu", value: stats.total_boxes, icon: Box },
            { label: "Açılan", value: stats.opened_boxes, icon: Package },
            { label: "Aktif Ödül", value: stats.rewards.length, icon: Gift },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-3 text-center">
              <s.icon className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panel seçici */}
      <div className="flex gap-2">
        {([
          { id: "boxes",   label: "Kutu Tipleri", icon: Box     },
          { id: "rewards", label: "Ödül Havuzu",  icon: Gift    },
          { id: "stats",   label: "İstatistik",   icon: BarChart3 },
        ] as const).map(p => (
          <button
            key={p.id}
            onClick={() => setActivePanel(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activePanel === p.id
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <p.icon className="w-4 h-4" />
            {p.label}
          </button>
        ))}
      </div>

      {/* ── KUTU TİPLERİ ─────────────────────────────────── */}
      {activePanel === "boxes" && (
        <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="space-y-4">
          {/* Mevcut kutular */}
          {boxTypes.length > 0 && (
            <div className="space-y-2">
              {boxTypes.map(b => {
                const m = TIER_META[b.tier];
                return (
                  <div key={b.id} className={`glass rounded-xl border ${m.border} p-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.emoji}</span>
                      <div>
                        <p className={`font-semibold ${m.color}`}>{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.points_required} puan · Leg: {(b.prob_legendary / 100).toFixed(1)}% · Epic: {(b.prob_epic / 100).toFixed(1)}% · Rare: {(b.prob_rare / 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost"
                        className="text-muted-foreground hover:text-white"
                        onClick={() => setBoxForm({ ...b })}>
                        Düzenle
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => removeBox(b.id)}
                        disabled={isPending}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kutu formu */}
          <div className="glass rounded-xl border border-white/8 p-5 space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              {boxTypes.find(b => b.tier === boxForm.tier) ? "Kutuyu Düzenle" : "Yeni Kutu Tipi"}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tier</Label>
                <Select value={boxForm.tier} onValueChange={v => onBoxTierChange(v as any)}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">📦 Yaygın</SelectItem>
                    <SelectItem value="rare">💎 Nadir</SelectItem>
                    <SelectItem value="epic">⚡ Destansı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kutu Adı</Label>
                <Input className="bg-white/5 border-white/10" value={boxForm.name}
                  onChange={e => setBoxForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kazanmak için gereken puan</Label>
              <Input type="number" className="bg-white/5 border-white/10"
                value={boxForm.points_required}
                onChange={e => setBoxForm(p => ({ ...p, points_required: parseInt(e.target.value) || 0 }))} />
            </div>

            {/* Olasılık ayarları */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Olasılıklar (toplam = 10000)</Label>
                <span className={`text-xs font-bold ${totalProb === 10000 ? "text-green-400" : "text-red-400"}`}>
                  {totalProb} / 10000
                </span>
              </div>
              {(["legendary", "epic", "rare", "common"] as const).map(tier => {
                const key = `prob_${tier}` as keyof typeof boxForm;
                const m = TIER_META[tier];
                return (
                  <div key={tier} className="flex items-center gap-3">
                    <span className={`w-24 text-sm ${m.color}`}>{m.emoji} {m.label}</span>
                    <Input type="number" className="bg-white/5 border-white/10 w-24"
                      value={boxForm[key] as number}
                      onChange={e => setBoxForm(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))} />
                    <span className="text-xs text-muted-foreground">
                      = {((boxForm[key] as number) / 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Örn: 300 = %3 · 1200 = %12 · 2500 = %25 · 6000 = %60
              </p>
            </div>

            {boxError && <p className="text-sm text-red-400">{boxError}</p>}

            <Button onClick={saveBox} disabled={isPending || totalProb !== 10000}
              className="w-full bg-purple-600 hover:bg-purple-700">
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── ÖDÜL HAVUZU ──────────────────────────────────── */}
      {activePanel === "rewards" && (
        <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="space-y-4">
          {/* Tier grupları */}
          {(["legendary", "epic", "rare", "common"] as const).map(tier => {
            const tierRewards = rewards.filter(r => r.tier === tier);
            const m = TIER_META[tier];
            return (
              <div key={tier} className={`glass rounded-xl border ${m.border} p-4 space-y-3`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.emoji}</span>
                  <span className={`font-semibold ${m.color}`}>{m.label} Ödüller</span>
                  <span className="text-xs text-muted-foreground ml-auto">{tierRewards.length} ödül</span>
                </div>

                {tierRewards.map(r => (
                  <div key={r.id} className={`flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 ${!r.is_active ? "opacity-50" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-white">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ağırlık: {r.weight}
                        {r.total_stock ? ` · Stok: ${r.claimed_count}/${r.total_stock}` : " · Sınırsız"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                        onClick={() => toggleReward(r.id, !r.is_active)}>
                        {r.is_active ? <Eye className="w-3.5 h-3.5 text-green-400" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                        onClick={() => removeReward(r.id)} disabled={isPending}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {tierRewards.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Henüz ödül yok</p>
                )}
              </div>
            );
          })}

          {/* Yeni ödül formu */}
          <div className="glass rounded-xl border border-white/8 p-5 space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Yeni Ödül Ekle
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tier</Label>
                <Select value={rewardForm.tier} onValueChange={v => setRewardForm(p => ({ ...p, tier: v as any }))}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="common">📦 Yaygın</SelectItem>
                    <SelectItem value="rare">💎 Nadir</SelectItem>
                    <SelectItem value="epic">⚡ Destansı</SelectItem>
                    <SelectItem value="legendary">🏆 Efsanevi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ödül Adı</Label>
                <Input className="bg-white/5 border-white/10" placeholder="ör. Akıllı Saat"
                  value={rewardForm.name} onChange={e => setRewardForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Açıklama (isteğe bağlı)</Label>
              <Input className="bg-white/5 border-white/10" placeholder="ör. Samsung Galaxy Watch 7"
                value={rewardForm.description} onChange={e => setRewardForm(p => ({ ...p, description: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stok (boş = sınırsız)</Label>
                <Input type="number" className="bg-white/5 border-white/10" placeholder="ör. 5"
                  value={rewardForm.total_stock} onChange={e => setRewardForm(p => ({ ...p, total_stock: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Ağırlık (yüksek = daha sık)</Label>
                <Input type="number" className="bg-white/5 border-white/10"
                  value={rewardForm.weight} onChange={e => setRewardForm(p => ({ ...p, weight: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>

            {rewardError && <p className="text-sm text-red-400">{rewardError}</p>}

            <Button onClick={saveReward} disabled={isPending}
              className="w-full bg-yellow-600 hover:bg-yellow-700">
              {isPending ? "Kaydediliyor..." : "Ödülü Ekle"}
            </Button>
          </div>
        </motion.div>
      )}

      {/* ── İSTATİSTİK ────────────────────────────────────── */}
      {activePanel === "stats" && (
        <motion.div initial={{ y: 8 }} animate={{ y: 0 }} className="space-y-4">
          <div className="glass rounded-xl border border-white/8 p-5 space-y-4">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              Kutu Açılım İstatistikleri
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white">{stats.total_boxes}</p>
                <p className="text-sm text-muted-foreground mt-1">Toplam Kutu</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{stats.opened_boxes}</p>
                <p className="text-sm text-muted-foreground mt-1">Açılan</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-400">
                  {stats.total_boxes > 0 ? Math.round((stats.opened_boxes / stats.total_boxes) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Açılma Oranı</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">
                  {stats.total_boxes - stats.opened_boxes}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Bekleyen</p>
              </div>
            </div>

            {/* Ödül dağılımı */}
            {stats.rewards.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">Ödül Stok Durumu</p>
                {stats.rewards.map((r: any) => {
                  const m = TIER_META[r.tier as keyof typeof TIER_META];
                  const pct = r.total_stock ? Math.round((r.claimed_count / r.total_stock) * 100) : 0;
                  return (
                    <div key={r.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={m.color}>{m.emoji} {r.name}</span>
                        <span className="text-muted-foreground">
                          {r.total_stock ? `${r.claimed_count}/${r.total_stock}` : `${r.claimed_count} kazanıldı`}
                        </span>
                      </div>
                      {r.total_stock && (
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${m.bg} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
