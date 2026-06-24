import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Kullanım Şartları — BasExpo",
  description: "BasExpo platformunu kullanım koşulları, ödeme şartları ve sorumluluk sınırlamaları.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Kullanım Şartları">
      <LegalSection title="1. Hizmetin Tanımı">
        <p>
          BasExpo, fuar organizatörlerine ve katılımcı firmalara yönelik B2B fuar yönetim
          platformudur. Hizmetler; QR tabanlı lead yakalama, AI destekli ziyaretçi eşleşmesi,
          fuar ROI raporlama, networking ve fuar sonrası takip araçlarını kapsar.
        </p>
        <p>
          Platform, organizatörlere ücretsiz sunulur. Katılımcı firmalar için aylık abonelik
          ücreti geçerlidir. Hizmet kapsamı ve fiyatlandırma önceden bildirimde bulunmak
          kaydıyla değiştirilebilir.
        </p>
      </LegalSection>

      <LegalSection title="2. Hesap ve Kullanıcı Yükümlülükleri">
        <p>Platforma kayıt olarak aşağıdaki yükümlülükleri kabul etmiş sayılırsınız:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Kayıt formunda doğru ve güncel bilgi sağlamak</li>
          <li>Hesap güvenliğini korumak; şifrenizi üçüncü kişilerle paylaşmamak</li>
          <li>Platformu yalnızca yasal amaçlarla kullanmak</li>
          <li>Başka kullanıcılara zarar verecek, yanıltıcı veya spam niteliğinde içerik paylaşmamak</li>
          <li>Platformu yeniden satmamak, lisanssız kopyalamamak veya rakip ürün geliştirmek amacıyla kullanmamak</li>
          <li>BasExpo altyapısını otomatik araçlarla (bot, scraper vb.) taramak veya aşırı yük oluşturmamak</li>
        </ul>
        <p>
          Kullanıcı kaynaklı ihlaller nedeniyle oluşan zararlardan BasExpo sorumlu tutulamaz.
        </p>
      </LegalSection>

      <LegalSection title="3. Ödeme ve İptal">
        <p>
          Katılımcı firma abonelikleri aylık olarak Stripe üzerinden tahsil edilir. Ödeme
          başarısızlıkları durumunda hesap erişimi askıya alınabilir.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white/80">İptal:</strong> Bir sonraki fatura dönemi başlamadan
            önce iptal edilebilir; iptal tarihi itibarıyla yeni ücret tahakkuk etmez.
          </li>
          <li>
            <strong className="text-white/80">Cari dönem iadesi:</strong> Başlamış bir fatura dönemi
            için kısmi iade yapılmaz.
          </li>
          <li>
            <strong className="text-white/80">Fiyat değişikliği:</strong> Fiyat değişikliklerinde
            en az 30 gün önceden e-posta bildirimi yapılır.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Hizmet Düzeyi">
        <p>
          BasExpo hizmetleri &ldquo;makul çaba&rdquo; esasıyla sunulur. Belirli bir çalışma
          süresi (%uptime) garantisi verilmez. Planlı bakım çalışmaları önceden duyurulur;
          acil güvenlik güncellemeleri önceden bildirim yapılmaksızın uygulanabilir.
        </p>
        <p>
          AI eşleşme ve ROI hesaplama araçları tahmine dayalıdır; sonuçların doğruluğu veya
          ticarî başarı için garanti verilmez.
        </p>
      </LegalSection>

      <LegalSection title="5. Fikri Mülkiyet">
        <p>
          Platform yazılımı, tasarımı ve içeriği BasExpo&apos;ya aittir. Kullanıcılar platforma
          yükledikleri veri ve içeriklerin (firma profili, ürün görselleri, lead bilgileri vb.)
          sahibi olmaya devam eder. BasExpo, bu içerikleri yalnızca hizmet sunumu amacıyla kullanır.
        </p>
      </LegalSection>

      <LegalSection title="6. Sorumluluk Sınırlaması">
        <p>
          BasExpo&apos;nun herhangi bir hizmet aksaklığı, veri kaybı, sistem hatası veya
          doğrudan ya da dolaylı zarardan sorumluluğu; zararın oluştuğu fatura döneminde
          kullanıcının ödediği abonelik ücretiyle sınırlıdır.
        </p>
        <p>
          Kaçırılan iş fırsatı, beklenen gelir kaybı, itibar zararı veya dolaylı ticari
          kayıplar için BasExpo hiçbir koşulda sorumluluk kabul etmez.
        </p>
        <p>
          Üçüncü taraf hizmetlerin (Supabase, Stripe, OpenAI vb.) kesintileri veya güvenlik
          ihlallerinden kaynaklanan zararlar için, BasExpo tarafında makul teknik önlemler
          alınmış olması kaydıyla sorumluluk doğmaz.
        </p>
      </LegalSection>

      <LegalSection title="7. Hesap Askıya Alma ve Sonlandırma">
        <p>
          Aşağıdaki durumlarda hesabınız önceden bildirimde bulunulmaksızın askıya alınabilir
          veya sonlandırılabilir:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Bu Kullanım Şartlarının ağır ihlali</li>
          <li>Başka kullanıcılara zarar veren davranışlar</li>
          <li>Ödeme dolandırıcılığı veya yetkisiz erişim girişimi</li>
          <li>Yasal mercilerin kararı veya talebi</li>
        </ul>
        <p>
          Ödeme gecikmesi gibi teknik ihlallerde, önce e-posta bildirimi yapılır ve 7 gün
          içinde giderilmesi beklenir.
        </p>
      </LegalSection>

      <LegalSection title="8. Şartlarda Değişiklik">
        <p>
          Bu şartlar güncellendiğinde kayıtlı e-posta adresinize en az <strong className="text-white/80">30 gün</strong> önceden
          bildirim yapılır. Güncelleme yürürlüğe girdikten sonra platformu kullanmaya devam
          etmek, yeni şartları kabul ettiğiniz anlamına gelir. Şartları kabul etmiyorsanız
          hesabınızı kapatabilirsiniz.
        </p>
      </LegalSection>

      <LegalSection title="9. Geçerli Hukuk ve Uyuşmazlık">
        <p>
          Bu Kullanım Şartları Türkiye Cumhuriyeti hukuku kapsamında yorumlanır. Taraflar
          arasında doğabilecek uyuşmazlıklarda <strong className="text-white/80">İstanbul (Çağlayan) Mahkemeleri
          ve İcra Daireleri</strong> yetkilidir.
        </p>
      </LegalSection>

      <LegalSection title="10. İletişim">
        <p>
          Kullanım Şartları hakkındaki sorularınız için:{" "}
          <strong className="text-white/80">info@basexpo.site</strong>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
