import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BasExpo — AI Destekli Fuar İşletim Sistemi",
  description:
    "Ziyaretçileri doğru firmalarla buluşturan, QR ile lead toplayan ve ROI gösteren akıllı fuar platformu.",
  keywords: [
    "fuar",
    "expo",
    "AI matchmaking",
    "lead generation",
    "networking",
    "BasExpo",
  ],
  openGraph: {
    title: "BasExpo — AI Destekli Fuar İşletim Sistemi",
    description:
      "Ziyaretçileri doğru firmalarla buluşturan akıllı fuar platformu.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
