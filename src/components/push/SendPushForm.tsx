"use client";

import { useState } from "react";
import { Send, Bell, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  events: { id: string; name: string }[];
}

export default function SendPushForm({ events }: Props) {
  const [mode, setMode] = useState<"all" | "event">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [eventId, setEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number; error?: string } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          eventId: mode === "event" && eventId ? eventId : undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
      if (data.sent > 0) { setTitle(""); setBody(""); }
    } catch {
      setResult({ error: "Gönderim sırasında hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl border border-white/8 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-indigo/15 border border-brand-indigo/30 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-brand-indigo-light" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Anlık Bildirim Gönder</h2>
          <p className="text-xs text-muted-foreground">Ziyaretçilerin telefonuna anlık push bildirimi gider</p>
        </div>
      </div>

      {/* Gönderim modu seçici */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setMode("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "all"
              ? "bg-brand-indigo/20 border border-brand-indigo/40 text-brand-indigo-light"
              : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" /> Tüm Ziyaretçilerim
        </button>
        <button
          type="button"
          onClick={() => setMode("event")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "event"
              ? "bg-brand-indigo/20 border border-brand-indigo/40 text-brand-indigo-light"
              : "bg-white/5 border border-white/10 text-muted-foreground hover:text-white"
          }`}
        >
          <CalendarDays className="w-4 h-4" /> Belirli Fuara Kayıtlılar
        </button>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        {mode === "event" && (
          <div className="space-y-1.5">
            <Label htmlFor="push-event">Fuar seçin *</Label>
            <select
              id="push-event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
              required={mode === "event"}
            >
              <option value="">Fuar seçin...</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="push-title">Başlık * <span className="text-muted-foreground text-xs">(max 60 karakter)</span></Label>
          <Input
            id="push-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: CEO Konuşması Başlıyor!"
            required
            maxLength={60}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="push-body">Mesaj * <span className="text-muted-foreground text-xs">(max 120 karakter)</span></Label>
          <Input
            id="push-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Örn: Salon B'de CEO konuşması 15 dakika sonra başlıyor."
            required
            maxLength={120}
          />
        </div>

        {result && (
          <div
            className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
              result.error
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-green-500/10 border border-green-500/20 text-green-400"
            }`}
          >
            {result.error ? result.error : (
              <>
                <Users className="w-4 h-4" />
                <span className="font-semibold">{result.sent} kişiye ulaştı</span>
                {result.failed ? `, ${result.failed} başarısız` : ""}
              </>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="gradient"
          className="w-full gap-2"
          disabled={loading || !title || !body || (mode === "event" && !eventId)}
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {loading ? "Gönderiliyor..." : "Bildirim Gönder"}
        </Button>
      </form>
    </div>
  );
}
