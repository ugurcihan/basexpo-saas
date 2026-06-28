import type { Metadata } from "next";

export const dynamic = "force-static";
import Link from "next/link";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — BasExpo",
  description: "6698 sayılı KVKK kapsamında kişisel veri işleme aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <LegalPageLayout title="KVKK Aydınlatma Metni">
      <p className="p-4 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 text-brand-cyan/90 text-xs">
        6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) md. 10 kapsamında
        hazırlanmış aydınlatma metnidir. Bu metin, platformumuzu kullanmadan önce okumanız
        için sunulmaktadır.
      </p>

      <LegalSection title="1. Veri Sorumlusu">
        <p>
          Kişisel verileriniz, KVKK kapsamında veri sorumlusu sıfatıyla{" "}
          <strong className="text-white/80">BasExpo Teknoloji</strong> tarafından aşağıda
          açıklanan amaçlar doğrultusunda işlenmektedir.
        </p>
        <p>
          <strong className="text-white/80">İletişim:</strong> info@basexpo.site
        </p>
      </LegalSection>

      <LegalSection title="2. İşlenen Kişisel Veri Kategorileri">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-white/80">Kimlik verisi:</strong> Ad, soyad</li>
          <li><strong className="text-white/80">İletişim verisi:</strong> E-posta adresi, telefon numarası</li>
          <li><strong className="text-white/80">Mesleki veri:</strong> Şirket adı, sektör, ürün/hizmet bilgileri (katılımcı firmalar için)</li>
          <li><strong className="text-white/80">Davranışsal veri:</strong> QR tarama logları, stant ziyaret geçmişi, eşleşme skoru, platform kullanım istatistikleri</li>
          <li><strong className="text-white/80">Teknik veri:</strong> IP adresi, cihaz bilgisi, tarayıcı tipi, oturum bilgisi</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. İşleme Amaçları ve Hukuki Dayanaklar">
        <div className="space-y-4">
          <div>
            <p className="text-white/80 font-medium mb-1">Sözleşme ifası (KVKK md. 5/2-c):</p>
            <p>Hesap oluşturma, QR lead yakalama, AI eşleşme, ROI raporlama ve abonelik yönetimi</p>
          </div>
          <div>
            <p className="text-white/80 font-medium mb-1">Açık rıza (KVKK md. 5/1):</p>
            <p>Pazarlama bildirimleri ve opsiyonel veri paylaşımları (rıza vermek zorunlu değildir)</p>
          </div>
          <div>
            <p className="text-white/80 font-medium mb-1">Meşru menfaat (KVKK md. 5/2-f):</p>
            <p>Platform güvenliği, fraud tespiti ve hizmet kalitesinin iyileştirilmesi</p>
          </div>
          <div>
            <p className="text-white/80 font-medium mb-1">Yasal yükümlülük (KVKK md. 5/2-ç):</p>
            <p>Vergi, muhasebe ve yetkili mercilerin yasal talepleri</p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="4. Kişisel Verilerin Aktarımı">
        <p>Verileriniz aşağıdaki üçüncü taraflarla paylaşılabilir:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white/80">Supabase Inc. (veri işleyici):</strong> Veritabanı ve
            kimlik doğrulama altyapısı GDPR uyumludur; yurt dışı aktarım GDPR Madde 46 kapsamındaki
            standart sözleşme hükümleri ile güvence altındadır.
          </li>
          <li>
            <strong className="text-white/80">Stripe Inc. (ödeme işleyici):</strong> PCI-DSS uyumlu
            ödeme altyapısı; kart bilgileri BasExpo&apos;ya iletilmez.
          </li>
          <li>
            <strong className="text-white/80">Katılımcı firmalar (QR taraması):</strong> Bir ziyaretçi
            firma QR kodunu taradığında, ad-soyad ve iletişim bilgisi yalnızca ilgili firmaya iletilir.
            Diğer firmalarla ve üçüncü kişilerle paylaşılmaz.
          </li>
          <li>
            <strong className="text-white/80">Yetkili merciler:</strong> Yasal zorunluluk halinde
            ve ilgili kanunlar kapsamında paylaşım yapılabilir.
          </li>
        </ul>
        <p>Kişisel verileriniz <strong className="text-white/80">satılmaz</strong>.</p>
      </LegalSection>

      <LegalSection title="5. Saklama Süresi">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Fuar verileri: fuarın sona ermesinden itibaren 2 yıl</li>
          <li>Hesap silme talebinden sonra: 30 iş günü içinde anonimleştirme veya silme</li>
          <li>Ödeme kayıtları: vergi mevzuatı gereği 10 yıl</li>
          <li>Teknik log kayıtları: 90 gün</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. KVKK Kapsamındaki Haklarınız (md. 11)">
        <p>
          Veri sorumlusu olarak BasExpo&apos;ya başvurarak aşağıdaki haklarınızı
          kullanabilirsiniz:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işlenmiş verinin düzeltilmesini isteme</li>
          <li>KVKK md. 7 kapsamındaki şartların oluşması halinde silinmesini veya yok edilmesini isteme</li>
          <li>Düzeltme/silme işlemlerinin üçüncü kişilere bildirilmesini isteme</li>
          <li>Münhasıran otomatik sistemler vasıtasıyla aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle zararın giderilmesini talep etme</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Başvuru Yöntemi">
        <p>
          Haklarınızı kullanmak için{" "}
          <strong className="text-white/80">info@basexpo.site</strong> adresine konu satırına
          &ldquo;KVKK Başvurusu&rdquo; yazarak e-posta gönderebilirsiniz. Başvurular yasal
          süre olan <strong className="text-white/80">30 gün</strong> içinde yanıtlanır.
          Kimliğinizi doğrulayan bilgileri (kayıtlı e-posta ve ad-soyad) başvurunuza
          eklemeniz gerekmektedir.
        </p>
        <p>
          Kapsamlı gizlilik politikamız için:{" "}
          <Link href="/privacy" className="text-brand-cyan hover:text-white underline-offset-2 hover:underline transition-colors">
            Gizlilik Politikası →
          </Link>
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
