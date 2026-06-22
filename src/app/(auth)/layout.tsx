import Link from "next/link";
import { QrCode } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center px-6 h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center group-hover:bg-brand-indigo/30 transition-colors">
            <QrCode className="w-4 h-4 text-brand-indigo-light" />
          </div>
          <span className="font-display font-bold text-lg text-white">
            BasExpo
          </span>
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
