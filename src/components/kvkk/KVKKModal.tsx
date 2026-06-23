"use client";

import { X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function KVKKModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-strong rounded-2xl border border-white/15 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 flex items-center justify-center">
              <Shield className="w-4 h-4 text-brand-cyan" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Kişisel Verilerin Korunması
              </h2>
              <p className="text-xs text-muted-foreground">KVKK Aydınlatma Metni</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p className="text-foreground font-medium">
            BasExpo Teknoloji Hizmetleri — KVKK Kapsamında Kişisel Veri İşleme Aydınlatma Metni
          </p>

          <section className="space-y-1.5">
            <h3 className="text-white font-semibold text-sm">1. Veri Sorumlusu</h3>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) uyarınca kişisel verileriniz,
              veri sorumlusu sıfatıyla <strong className="text-foreground">BasExpo Teknoloji A.Ş.</strong>{" "}
              tarafından aşağıda belirtilen amaçlar doğrultusunda işlenmektedir.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-white font-semibold text-sm">2. İşlenen Kişisel Veriler</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Kimlik bilgileri: Ad, soyad</li>
              <li>İletişim bilgileri: E-posta adresi, telefon numarası</li>
              <li>Fuar katılım verileri: Kayıt tarih ve saati, katıldığınız fuarlar</li>
              <li>Dijital davranış verileri: İlgi alanları, QR tarama geçmişi, AI eşleşme skoru</li>
              <li>Cihaz ve bağlantı bilgileri: IP adresi, tarayıcı bilgisi (anonim log)</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-white font-semibold text-sm">3. İşleme Amaçları ve Hukuki Dayanağı</h3>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Fuar kaydının gerçekleştirilmesi ve bilet oluşturulması (Sözleşmenin ifası — Md. 5/2-c)</li>
              <li>AI destekli kişiselleştirilmiş firma ve fuar önerisi sunulması (Açık rıza — Md. 5/1)</li>
              <li>Katılımcı firmalar ile lead eşleştirmesi yapılması (Açık rıza — Md. 5/1)</li>
              <li>Organizatörlere fuar analiz raporu sağlanması (Meşru menfaat — Md. 5/2-f, anonim)</li>
              <li>İlgili mevzuat kapsamında yasal yükümlülüklerin yerine getirilmesi (Md. 5/2-ç)</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-white font-semibold text-sm">4. Kişisel Verilerin Aktarımı</h3>
            <p>
              Kişisel verileriniz; yalnızca ilgili fuarda yer alan{" "}
              <strong className="text-foreground">katılımcı firmalara</strong>, QR kod tarama yoluyla
              gerçekleşen lead işlemi kapsamında aktarılabilir. Bu aktarım, verinin anonimleştirilmesi
              ya da açık rızanıza dayanılarak yapılır. Verileriniz yurt dışına aktarılmaz.
              Teknik altyapı hizmeti kapsamında Supabase (ABD kaynaklı, GDPR uyumlu) kullanılmaktadır.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-white font-semibold text-sm">5. Saklama Süresi</h3>
            <p>
              Kişisel verileriniz, kaydolduğunuz fuarın bitiş tarihinden itibaren{" "}
              <strong className="text-foreground">2 yıl</strong> süreyle saklanır. Hesabınızı
              silmeniz durumunda verileriniz yasal zorunluluk olmaksızın 30 gün içinde silinir.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-white font-semibold text-sm">6. KVKK Kapsamındaki Haklarınız</h3>
            <p>KVKK Madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>Kişisel verilerinize ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde aktarıldığı üçüncü kişileri öğrenme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
              <li>İşlemenin otomatik sistemler aracılığıyla yapılması halinde aleyhine sonucuna itiraz etme</li>
              <li>Kanuna aykırı işlenmesi nedeniyle zarara uğraması halinde zararın tazminini talep etme</li>
            </ul>
            <p className="mt-2">
              Talepleriniz için:{" "}
              <strong className="text-brand-cyan">info@basexpo.site</strong> adresine yazabilirsiniz.
            </p>
          </section>

          <div className="p-3 rounded-xl bg-brand-indigo/8 border border-brand-indigo/15 text-xs">
            Bu metni onaylayarak kişisel verilerinizin yukarıda belirtilen amaçlar doğrultusunda
            işlenmesine açık rızanızı vermiş olursunuz. Rızanızı istediğiniz zaman geri çekebilirsiniz.
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/8 flex-shrink-0">
          <Button onClick={onClose} variant="gradient" className="w-full">
            Okudum ve Anladım
          </Button>
        </div>
      </div>
    </div>
  );
}
