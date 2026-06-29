import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Hakkımızda — BasExpo",
  description: "BasExpo, Türkiye'nin fuar yönetim platformu. QR lead yakalama, AI eşleşme ve ROI belgesiyle fuarı dijital omurgaya kavuşturuyoruz.",
};

export default function AboutPage() {
  return (
    <LegalPageLayout title="Hakkımızda" updatedAt="2026">
      <LegalSection title="Misyonumuz">
        <p>
          Türkiye&apos;de her yıl binlerce B2B fuarı düzenleniyor. Ancak katılımcı firmalar lead'lerini kağıt formla topluyor, fuar sonrası veri kayboluyor, ROI hiçbir zaman belgelenemiyor.
        </p>
        <p>
          BasExpo bu kaosu bitirir. QR ile her ziyaretçiyi lead&apos;e dönüştürür, AI ile doğru alıcıyı doğru firmayla eşleştirir, fuar ROI raporunu tek tıkla üretir.
        </p>
      </LegalSection>

      <LegalSection title="Ne Yapıyoruz?">
        <p>
          BasExpo; organizatörler, katılımcı firmalar ve ziyaretçiler için uçtan uca dijital fuar altyapısı sunar:
        </p>
        <ul>
          <li><strong>Organizatörler</strong> — Stant satış öncesi ön kayıt datası, canlı ısı haritası, kapı check-in, ödül ve sadakat yönetimi.</li>
          <li><strong>Katılımcı Firmalar</strong> — KVKK uyumlu QR lead toplama, AI destekli ziyaretçi eşleşmesi, dijital kartvizit ve otomatik ROI raporu.</li>
          <li><strong>Ziyaretçiler</strong> — Kişiselleştirilmiş AI firma önerileri, sadakat puanı, ödül kazanma ve networking.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Teknoloji">
        <p>
          Platform; Next.js 16, Supabase PostgreSQL ve pgvector tabanlı AI embedding ile geliştirilmiştir. Tüm veriler Türkiye mevzuatına uygun şekilde işlenir; KVKK onay akışı her kayıt ve lead formuna entegre edilmiştir.
        </p>
      </LegalSection>

      <LegalSection title="İletişim">
        <p>
          Sorularınız, iş birliği teklifleriniz ve kurumsal demo talepleriniz için{" "}
          <a href="/contact" className="text-brand-cyan hover:underline">İletişim</a>{" "}
          sayfamızı ziyaret edin.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
