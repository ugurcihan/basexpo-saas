"use client";

import { useState, useTransition } from "react";
import { X, CalendarClock, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMeetingWithFirm } from "@/features/connections/actions";

interface Props {
  exhibitorId: string;
  exhibitorName: string;
  isOpen: boolean;
  onClose: () => void;
}

const SUBJECTS = [
  "İş Birliği",
  "Ürün Demosu",
  "Satın Alma Görüşmesi",
  "Teknik Destek",
  "Diğer",
];

export function RequestMeetingModal({ exhibitorId, exhibitorName, isOpen, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [note, setNote] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const minDateTime = new Date(Date.now() + 30 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!proposedAt) { setError("Lütfen tarih ve saat seçin"); return; }

    startTransition(async () => {
      const result = await requestMeetingWithFirm({
        exhibitorId,
        subject,
        note: note.trim() || undefined,
        proposedAt: new Date(proposedAt).toISOString(),
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setNote("");
          setProposedAt("");
          setSubject(SUBJECTS[0]);
          onClose();
        }, 1800);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose(); }}
    >
      <div className="glass-strong rounded-2xl border border-white/15 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-indigo/15 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-brand-indigo-light" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white">Randevu Talep Et</h2>
              <p className="text-xs text-muted-foreground">{exhibitorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-green-400" />
            </div>
            <p className="font-semibold text-white">Randevu talebiniz gönderildi!</p>
            <p className="text-sm text-muted-foreground mt-1">Firma yanıtladığında bildirim alacaksınız.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Subject */}
            <div className="space-y-2">
              <Label>Görüşme Konusu</Label>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                      subject === s
                        ? "bg-brand-indigo/20 border border-brand-indigo/40 text-brand-indigo-light"
                        : "bg-white/4 border border-white/8 text-muted-foreground hover:border-white/15"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Time */}
            <div className="space-y-2">
              <Label htmlFor="proposedAt">Tarih & Saat</Label>
              <Input
                id="proposedAt"
                type="datetime-local"
                value={proposedAt}
                min={minDateTime}
                onChange={(e) => setProposedAt(e.target.value)}
                required
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="note">
                Açıklama{" "}
                <span className="text-muted-foreground font-normal">(isteğe bağlı)</span>
              </Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Görüşmek istediğiniz konuyu kısaca açıklayın..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-indigo/50 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{note.length}/300</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isPending}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-1"
                disabled={isPending || !proposedAt}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Gönderiliyor...
                  </span>
                ) : (
                  "Randevu Talep Et"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
