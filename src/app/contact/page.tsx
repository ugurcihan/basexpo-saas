import type { Metadata } from "next";
import { Mail, Clock, Shield, Wrench } from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "İletişim — BasExpo",
  description: "BasExpo ile iletişime geçin. Genel sorular, KVKK başvuruları ve teknik destek.",
};

const CONTACTS = [
  {
    icon: Mail,
    title: "Genel Sorular",
    email: "info@basexpo.site",
    subject: null,
    description: "Platform hakkında her türlü soru için",
    color: "brand-indigo",
  },
  {
    icon: Shield,
    title: "KVKK & Hukuki Başvurular",
    email: "info@basexpo.site",
    subject: "KVKK Başvurusu",
    description: "Kişisel verilerinizle ilgili erişim, düzeltme veya silme talepleri",
    color: "brand-cyan",
  },
  {
    icon: Wrench,
    title: "Teknik Destek",
    email: "info@basexpo.site",
    subject: "Teknik Destek",
    description: "Platform hatası, giriş sorunu veya özellik soruları",
    color: "brand-violet",
  },
];

export default function ContactPage() {
  return (
    <LegalPageLayout title="İletişim">
      <div className="flex items-center gap-2 text-xs text-brand-cyan/80 p-3 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        Tüm başvurulara iş günü içinde <strong className="text-brand-cyan">2 gün</strong> içinde yanıt verilir.
      </div>

      <div className="space-y-4">
        {CONTACTS.map((c) => {
          const Icon = c.icon;
          const mailtoHref = c.subject
            ? `mailto:${c.email}?subject=${encodeURIComponent(c.subject)}`
            : `mailto:${c.email}`;

          const colorMap: Record<string, string> = {
            "brand-indigo": "border-brand-indigo/20 bg-brand-indigo/5",
            "brand-cyan":   "border-brand-cyan/20 bg-brand-cyan/5",
            "brand-violet": "border-brand-violet/20 bg-brand-violet/5",
          };
          const iconColorMap: Record<string, string> = {
            "brand-indigo": "text-brand-indigo-light bg-brand-indigo/15",
            "brand-cyan":   "text-brand-cyan bg-brand-cyan/15",
            "brand-violet": "text-brand-violet-light bg-brand-violet/15",
          };

          return (
            <a
              key={c.title}
              href={mailtoHref}
              className={`flex items-start gap-4 p-5 rounded-xl border ${colorMap[c.color]} hover:opacity-80 transition-opacity block`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColorMap[c.color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm mb-0.5">{c.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
                <p className="text-sm font-medium text-white/80">
                  {c.email}
                  {c.subject && (
                    <span className="ml-2 text-xs text-muted-foreground">· Konu: &ldquo;{c.subject}&rdquo;</span>
                  )}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      <div className="p-5 rounded-xl border border-white/8 bg-white/2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-white/60">Ofis adresi:</strong>{" "}
          Henüz fiziksel bir ofis adresimiz bulunmamaktadır. Platform yalnızca dijital kanallardan
          hizmet vermektedir. KVKK başvuruları yalnızca e-posta yoluyla kabul edilmektedir.
        </p>
      </div>
    </LegalPageLayout>
  );
}
