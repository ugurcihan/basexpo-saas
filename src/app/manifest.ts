import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BasExpo — Fuar Platformu",
    short_name: "BasExpo",
    description:
      "Organizatörler için ücretsiz, firmalar için güçlü fuar yönetim platformu.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0F1E",
    theme_color: "#6366F1",
    orientation: "portrait",
    categories: ["business", "productivity"],
    lang: "tr",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Giriş Yap",
        url: "/login",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Kayıt Ol",
        url: "/register",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
