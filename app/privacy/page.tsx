import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Database, Lock, UserCheck, Trash2, Mail, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Gizlilik Politikası (Privacy Policy)",
  description: "cinelists Gizlilik Politikası ve Kişisel Verilerin Korunması Hakkında Bilgilendirme.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "9 Eylül 2026";

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Üst Başlık & Geri Dönüş */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Ana Sayfaya Dön
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black font-bricolage tracking-tight">
                Gizlilik Politikası
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Son Güncelleme: {lastUpdated}
              </p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            cinelists (&quot;biz&quot;, &quot;bizim&quot; veya &quot;uygulama&quot;) olarak, kullanıcılarımızın gizliliğine ve kişisel verilerinin korunmasına büyük önem veriyoruz. Bu Gizlilik Politikası, web sitemizi ve mobil uygulamamızı kullandığınızda bilgilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklamaktadır.
          </p>
        </div>

        {/* İçerik Bölümleri */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {/* 1. Toplanan Veriler */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              <Database className="w-5 h-5 text-primary" />
              <h2>1. Hangi Bilgileri Topluyoruz?</h2>
            </div>
            <div className="space-y-3">
              <p>Hizmetlerimizi sunabilmek amacıyla aşağıdaki verileri toplayabiliriz:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Hesap Bilgileri:</strong> Kayıt olurken sağladığınız ad, soyad, kullanıcı adı, e-posta adresi ve şifrelenmiş (hash) parola bilgisi.
                </li>
                <li>
                  <strong className="text-foreground">Kullanıcı Aktivitesi ve Tercihleri:</strong> Oluşturduğunuz izleme listeleri (watchlist), izlediğiniz filmler/diziler, puanlamalarınız, yorumlarınız ve favori platform tercihleriniz.
                </li>
                <li>
                  <strong className="text-foreground">Cihaz ve Bağlantı Bilgileri:</strong> Uygulama performansını izlemek ve güvenliği sağlamak amacıyla IP adresi, tarayıcı türü, işletim sistemi bilgileri ve temel hata günlükleri (logs).
                </li>
              </ul>
              <p>Yönetim istatistikleri etkinleştirildiğinde gün, sayfa türü, yaklaşık ülke, cihaz sınıfı ve üye/misafir durumuna göre toplu görüntüleme sayıları tutulur. Bu ölçümler IP adresi, ziyaretçi çerezi, arama metni veya mesaj içeriği saklamaz. Üyeler için kayıt tarihi, son görülme zamanı ve son bilinen ülke tutulabilir. Do Not Track ve Global Privacy Control bildirimleri ölçümde dikkate alınır.</p>
            </div>
          </section>

          {/* 2. Bilgilerin Kullanım Amaçları */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              <UserCheck className="w-5 h-5 text-primary" />
              <h2>2. Bilgilerinizi Nasıl Kullanıyoruz?</h2>
            </div>
            <div className="space-y-3">
              <p>Topladığımız bilgileri aşağıdaki amaçlarla işliyoruz:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Hesabınızı oluşturmak, kimliğinizi doğrulamak ve oturumunuzu güvenle yönetmek,</li>
                <li>Film ve dizi listelerinizi farklı cihazlar arasında senkronize etmek,</li>
                <li>İlgi alanlarınıza göre kişiselleştirilmiş film/dizi tavsiyeleri sunmak,</li>
                <li>Uygulama performansını analiz etmek, hataları tespit etmek ve kullanıcı deneyimini iyileştirmek,</li>
                <li>Şifre sıfırlama veya önemli hesap bildirimleri göndermek.</li>
              </ul>
            </div>
          </section>

          {/* 3. Üçüncü Taraf Servisler */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              <ExternalLink className="w-5 h-5 text-primary" />
              <h2>3. Üçüncü Taraf Hizmetler ve Entegrasyonlar</h2>
            </div>
            <div className="space-y-3">
              <p>
                cinelists, film ve dizi meta verilerini (afişler, özetler, yayın tarihleri, oyuncu kadroları vb.) sağlamak için{" "}
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  TMDB (The Movie Database) API
                </a>
                {" "}kullanmaktadır. Bu ürün TMDB API&apos;sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır.
              </p>
              <p>
                Kullanıcı şifreleriniz veya özel verileriniz üçüncü taraf reklam ağlarıyla veya veri komisyoncularıyla <strong>asla satılmaz veya paylaşılmaz</strong>.
              </p>
            </div>
          </section>

          {/* 4. Veri Güvenliği */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              <Lock className="w-5 h-5 text-primary" />
              <h2>4. Veri Güvenliği ve Saklama</h2>
            </div>
            <div className="space-y-3">
              <p>
                Kişisel verilerinizin güvenliği bizim için esastır. Verileriniz endüstri standardı şifreleme protokolleri (HTTPS / TLS) kullanılarak aktarılır ve güvenli veritabanı sunucularında saklanır. Kullanıcı parolaları tek yönlü güçlü algoritmalarla (bcrypt) hashlenerek korunur ve kimse tarafından okunamaz.
              </p>
            </div>
          </section>

          {/* 5. Hesap ve Veri Silme (Google Play Şartı) */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm border-red-500/20">
            <div className="flex items-center gap-3 text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              <Trash2 className="w-5 h-5 text-red-400" />
              <h2>5. Kullanıcı Hakları ve Hesap Silme (Veri Silme Talebi)</h2>
            </div>
            <div className="space-y-3">
              <p>
                Google Play Store politikaları ve KVKK/GDPR gereğince, verileriniz üzerinde tam kontrole sahipsiniz:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-foreground">Uygulama İçinden Silme:</strong> Giriş yaptıktan sonra <em>Ayarlar &gt; Hesap</em> bölümünden hesabınızı ve bağlantılı tüm verilerinizi kalıcı olarak silebilirsiniz.
                </li>
                <li>
                  <strong className="text-foreground">E-posta ile Talep Etme:</strong> Hesabınıza erişemiyorsanız veya verilerinizin silinmesini istiyorsanız, kayıtlı e-posta adresinizden{" "}
                  <a href="mailto:support@cinelists.com" className="text-primary hover:underline font-medium">
                    support@cinelists.com
                  </a>{" "}
                  adresine hesap silme talebinde bulunabilirsiniz. Talebiniz en geç 7 iş günü içinde işleme alınarak tüm kayıtlarınız veritabanımızdan kalıcı olarak temizlenir.
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Çerezler ve Yerel Depolama */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <h2 className="text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              6. Çerezler (Cookies) ve Yerel Depolama
            </h2>
            <p>
              Oturumunuzun açık kalmasını sağlamak ve tema (açık/koyu mod) gibi kullanıcı tercihlerinizi hatırlamak amacıyla zorunlu çerezler ve tarayıcı yerel depolama (Local Storage) mekanizmaları kullanılmaktadır.
            </p>
          </section>

          {/* 7. Çocukların Gizliliği */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <h2 className="text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              7. Çocukların Gizliliği
            </h2>
            <p>
              Hizmetlerimiz 13 yaşın altındaki çocuklara yönelik değildir. 13 yaşın altındaki bir çocuğun bize kişisel bilgi sağladığını tespit edersek, bu verileri derhal sistemlerimizden sileriz.
            </p>
          </section>

          {/* 8. İletişim */}
          <section className="bg-card/50 border border-border/50 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-foreground font-semibold text-lg sm:text-xl mb-4 font-bricolage">
              <Mail className="w-5 h-5 text-primary" />
              <h2>8. İletişim</h2>
            </div>
            <p>
              Gizlilik Politikamız veya kişisel verilerinizle ilgili her türlü soru, öneri ve talepleriniz için bizimle iletişime geçebilirsiniz:
            </p>
            <div className="mt-3 p-4 rounded-xl bg-background/60 border border-border/50">
              <p className="font-medium text-foreground">cinelists Destek Ekibi</p>
              <p className="text-sm">
                E-posta:{" "}
                <a href="mailto:support@cinelists.com" className="text-primary hover:underline">
                  support@cinelists.com
                </a>
              </p>
              <p className="text-sm">Web: https://cinelists.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
