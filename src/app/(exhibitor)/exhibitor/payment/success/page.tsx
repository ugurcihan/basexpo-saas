import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="glass rounded-2xl border border-green-500/20 p-10 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Ödeme Başarılı!</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Stand aktivasyonun tamamlandı. Artık QR kodunla ziyaretçilerden lead toplayabilir,
            AI eşleşmelerinde görünebilirsin.
          </p>
        </div>
        <div className="space-y-2">
          <Link
            href="/exhibitor/qr"
            className="block w-full py-2.5 px-4 rounded-xl bg-brand-indigo/20 border border-brand-indigo/30 text-white text-sm font-medium hover:bg-brand-indigo/30 transition-colors"
          >
            QR Kodumu Gör
          </Link>
          <Link
            href="/exhibitor"
            className="block w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-muted-foreground text-sm hover:text-white transition-colors"
          >
            Dashboard&apos;a Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
