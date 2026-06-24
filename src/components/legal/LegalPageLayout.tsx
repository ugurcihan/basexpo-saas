import Link from "next/link";
import { QrCode, ArrowLeft } from "lucide-react";

interface LegalPageLayoutProps {
  title: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, updatedAt = "24 Haziran 2026", children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Top nav */}
      <nav className="border-b border-white/8 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5 text-brand-indigo-light" />
            </div>
            <span className="font-display font-bold text-white">BasExpo</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ana Sayfa
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Page header */}
        <div className="mb-12">
          <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">Son güncelleme: {updatedAt}</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          {children}
        </div>

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-white/8 flex flex-wrap gap-4 text-xs text-muted-foreground/60">
          <Link href="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Kullanım Şartları</Link>
          <Link href="/kvkk" className="hover:text-white transition-colors">KVKK Aydınlatma</Link>
          <Link href="/contact" className="hover:text-white transition-colors">İletişim</Link>
          <span className="ml-auto">© {new Date().getFullYear()} BasExpo</span>
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
