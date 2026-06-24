import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Gizlilik Politikası — BasExpo",
  description: "BasExpo platformunda kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğu hakkında bilgi.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Gizlilik Politikası">
      <LegalSection title="1. Veri Sorumlusu">
        <p>
          Bu Gizlilik Politikası, BasExpo Teknoloji (bundan böyle &ldquo;BasExpo&rdquo;, &ldquo;biz&rdquo; veya
          &ldquo;platform&rdquo;) tarafından hazırlanmıştır. 6698 sayılı Kişisel Verilerin Korunması
          Kanunu (&ldquo;KVKK&rdquo;) kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz.
        </p>
        <p>
          <strong className="text-white">İletişim:</strong> info@basexpo.site
        </p>
      </LegalSection>

      <LegalSection title="2. Hangi Veriler Toplanır?">
        <p>Platform kullanımınız sırasında aşağıdaki kişisel veriler işlenebilir:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-white/80">Kimlik ve iletişim:</strong> Ad, soyad, e-posta adresi, telefon numarası</li>
          <li><strong className="text-white/80">Firma bilgisi:</strong> Şirket adı, sektör, ürün/hizmet açıklamaları (katılımcı firmalar için)</li>
          <li><strong className="text-white/80">Fuar verisi:</strong> QR kod tarama kayıtları, stant ziyaret logları, lead kayıtları</li>
          <li><strong className="text-white/80">AI eşleşme verisi:</strong> İlgi alanları, etiketler, algoritmik eşleşme skorları</li>
          <li><strong className="text-white/80">Ödeme verisi:</strong> Abonelik işlemleri Stripe altyapısı üzerinden yürütülür; kart bilgileri BasExpo sunucularında saklanmaz</li>
          <li><strong className="text-white/80">Teknik veri:</strong> IP adresi, tarayıcı tipi, oturum bilgisi, platform kullanım istatistikleri</li>
        </ul>
        <p>
          Kullanıcıların kendi iradesiyle girdikleri verinin doğruluğu kullanıcı sorumluluğundadır.
        </p>
      </LegalSection>

      <LegalSection title="3. İşleme Amaçları">
        <p>Toplanan veriler aşağıdaki amaçlarla işlenmektedir:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Hesap oluşturma ve kimlik doğrulama</li>
          <li>QR tabanlı lead yakalama hizmetinin sunulması</li>
          <li>AI eşleşme algoritmasının çalıştırılması</li>
          <li>Fuar ROI raporlarının otomatik oluşturulması</li>
          <li>Bildirim ve hatırlatıcı gönderimi</li>
          <li>Abonelik yönetimi ve ödeme işlemleri</li>
          <li>Platform güvenliği ve hizmet kalitesinin korunması</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Hukuki Dayanak">
        <p>Kişisel verileriniz aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir (KVKK md. 5-6):</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong className="text-white/80">Sözleşme ifası:</strong> Hizmetin sunulması için zorunlu veriler</li>
          <li><strong className="text-white/80">Açık rıza:</strong> KVKK Aydınlatma Metni onayı ile toplanan veriler</li>
          <li><strong className="text-white/80">Meşru menfaat:</strong> Platform güvenliği ve fraud önleme</li>
          <li><strong className="text-white/80">Yasal yükümlülük:</strong> Vergi, muhasebe ve yasal bildirim gereklilikleri</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Veri Paylaşımı">
        <p>
          Kişisel verileriniz üçüncü taraflara <strong className="text-white/80">satılmaz</strong>.
          Aşağıdaki istisnalar geçerlidir:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong className="text-white/80">Supabase (veri işleyici):</strong> Veritabanı ve kimlik doğrulama
            hizmetleri GDPR uyumlu Supabase altyapısında barındırılmaktadır.
          </li>
          <li>
            <strong className="text-white/80">Stripe (ödeme işleyici):</strong> Abonelik ödemeleri Stripe üzerinden
            gerçekleştirilir; PCI-DSS uyumludur.
          </li>
          <li>
            <strong className="text-white/80">QR lead paylaşımı:</strong> Ziyaretçi, bir firmanın QR kodunu
            taradığında, ad-soyad ve iletişim bilgisi yalnızca ilgili firmaya iletilir; başka
            firmalarla paylaşılmaz.
          </li>
          <li>
            <strong className="text-white/80">Yasal zorunluluk:</strong> Yetkili resmi mercilerin talepleri
            doğrultusunda, kanun kapsamında paylaşım yapılabilir.
          </li>
        </ul>
        <p>
          BasExpo, üçüncü taraf platformların (Supabase, Stripe) veri güvenlik ihlallerinden doğan
          zararlardan, makul teknik önlemler alınmış olması kaydıyla, sorumlu tutulamaz.
        </p>
      </LegalSection>

      <LegalSection title="6. Saklama Süreleri">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Fuar verisi ve lead kayıtları: ilgili fuarın sona ermesinden itibaren 2 yıl</li>
          <li>Hesap silme talebinden sonra: kişisel veriler 30 iş günü içinde anonimleştirilir veya silinir</li>
          <li>Ödeme kayıtları: vergi mevzuatı gereğince 10 yıl</li>
          <li>Teknik log kayıtları: 90 gün</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Haklarınız (KVKK md. 11)">
        <p>Kişisel verilerinizle ilgili olarak aşağıdaki haklara sahipsiniz:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
          <li>İşlenmiş ise buna ilişkin bilgi talep etme</li>
          <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Yurt içi veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme</li>
          <li>Eksik veya yanlış işleme halinde düzeltilmesini isteme</li>
          <li>KVKK&apos;nın 7. maddesindeki şartlar çerçevesinde silinmesini isteme</li>
          <li>Otomatik sistemler vasıtasıyla aleyhinize bir sonucun çıkmasına itiraz etme</li>
          <li>Kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Başvuru Yolu">
        <p>
          Haklarınızı kullanmak için <strong className="text-white/80">info@basexpo.site</strong> adresine
          &ldquo;KVKK Başvurusu&rdquo; konusuyla e-posta gönderebilirsiniz. Başvurular yasal süre
          olan <strong className="text-white/80">30 gün</strong> içinde yanıtlanır.
        </p>
        <p>
          Başvurunuzda kimliğinizi doğrulayacak bilgiler (e-posta, ad-soyad) ve talep konusunun
          açık biçimde belirtilmesi gerekmektedir.
        </p>
      </LegalSection>

      <LegalSection title="9. Politika Değişiklikleri">
        <p>
          Bu politika güncellenebildiğinde kayıtlı e-posta adresinize en az 30 gün öncesinden
          bildirim yapılır. Güncelleme sonrası platformu kullanmaya devam etmek, yeni politikayı
          kabul ettiğiniz anlamına gelir.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
