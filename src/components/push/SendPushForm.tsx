"use client";

import { useState } from "react";
import { Send, Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  events: { id: string; title: string }[];
}

export default function SendPushForm({ events }: Props) {
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
        body: JSON.stringify({ title, body, eventId: eventId || undefined }),
      });
      const data = await res.json();
      setResult(data);
      if (data.sent > 0) {
        setTitle("");
        setBody("");
      }
    } catch {
      setResult({ error: "Gönderim sırasında hata oluştu." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl border border-white/8 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-brand-indigo/20">
          <Bell className="w-5 h-5 text-brand-indigo" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Anlık Bildirim Gönder</h2>
          <p className="text-xs text-muted-foreground">Ziyaretçilerin telefonuna anlık push bildirimi gider</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="push-event">Fuar (opsiyonel)</Label>
          <select
            id="push-event"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
          >
            <option value="">Tüm ziyaretçiler</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="push-title">Başlık *</Label>
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
          <Label htmlFor="push-body">Mesaj *</Label>
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
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg ${
              result.error
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-green-500/10 border border-green-500/20 text-green-400"
            }`}
          >
            {result.error ? (
              result.error
            ) : (
              <>
                <Users className="w-4 h-4" />
                {result.sent} kişiye gönderildi
                {result.failed ? `, ${result.failed} başarısız` : ""}
              </>
            )}
          </div>
        )}

        <Button
          type="submit"
          variant="gradient"
          className="w-full gap-2"
          disabled={loading || !title || !body}
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
