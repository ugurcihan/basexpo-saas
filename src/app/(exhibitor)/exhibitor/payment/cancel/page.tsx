import Link from "next/link";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="glass rounded-2xl border border-red-500/15 p-10 max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Ödeme İptal Edildi</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Ödeme işlemi tamamlanmadı. Stand aktivasyonun için istediğin zaman tekrar deneyebilirsin.
          </p>
        </div>
        <Link
          href="/exhibitor/profile"
          className="block w-full py-2.5 px-4 rounded-xl bg-brand-indigo/20 border border-brand-indigo/30 text-white text-sm font-medium hover:bg-brand-indigo/30 transition-colors"
        >
          Profile Dön
        </Link>
      </div>
    </div>
  );
}
