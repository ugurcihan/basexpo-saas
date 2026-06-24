import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
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
  metadataBase: new URL("https://basexpo.site"),
  title: "BasExpo — AI Destekli Fuar İşletim Sistemi",
  description:
    "Ziyaretçileri doğru firmalarla buluşturan, QR ile lead toplayan ve ROI gösteren akıllı fuar platformu.",
  keywords: ["fuar", "expo", "AI matchmaking", "lead generation", "networking", "BasExpo"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BasExpo",
    startupImage: "/icons/apple-touch-icon.png",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "BasExpo — AI Destekli Fuar İşletim Sistemi",
    description: "Ziyaretçileri doğru firmalarla buluşturan akıllı fuar platformu.",
    type: "website",
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#6366F1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="font-sans antialiased">
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
