# Yönetim Merkezi

`/admin` mevcut site tasarımıyla çalışan, sunucuda yetkilendirilen yönetim panelidir.

## Bölümler

- **Genel bakış:** 7/30/90 günlük görüntülemeler, aktif üyeler, yeni kayıtlar, ülkeler, cihazlar, üye/misafir dağılımı, popüler sayfalar ve içerik/etkileşim adetleri.
- **Kullanıcılar:** ad/kullanıcı adı/e-posta araması; hesap durumu ve ülke filtresi; kayıt/son görülme sıralaması; 25 kayıtlık sayfalama; filtrelenmiş CSV (en fazla 5000 kayıt).
- **Kullanıcı ayrıntısı:** hesap ve profil bilgileri, son bilinen ülke, kayıt/son görülme zamanları, tercihler, izleme/bölüm/takip/yorum/mesaj adetleri, son aktiviteler ve listeler. Parola özeti, OAuth tokeni ve özel mesaj metni gösterilmez.
- **Moderasyon:** gerekçe girerek yorumu kaldırıldı metniyle değiştirme veya inceleme metnini kaldırma. Yanıtlar/izleme/puan kayıtları korunur.
- **İşlem geçmişi:** hesap askıya alma/etkinleştirme, moderasyon ve CSV indirmeleri.
- **Sistem:** ziyaret ölçümü ve servis yapılandırmalarının varlığı; anahtar değerleri gösterilmez.

## Kurulum

1. Yeni migration'ı normal veritabanı dağıtım sürecinde uygulayın:

   ```sh
   npm run db:migrate:deploy
   npx prisma generate
   ```

   Yeni migration `20260909120000_add_admin_analytics` yalnızca `UserAdminProfile`, `AnalyticsDaily`, `AdminAuditLog` tablolarını, ilişkilerini ve indekslerini ekler. Mevcut veri silmez veya eski kayıt tarihlerini uydurmaz. `migrate deploy` diğer bekleyen migration'ları da uygular; mevcut ortamın migration geçmişi önceden kontrol edilmelidir.

2. Yetkili **mevcut kullanıcıların sabit `User.id` değerlerini** sunucu ortamında tanımlayın:

   ```env
   ADMIN_USER_IDS="yetkili-kullanicinin-id-degeri"
   ANALYTICS_ENABLED="true"
   ANALYTICS_COUNTRY_HEADER=""
   ```

   Birden fazla kimlik virgülle ayrılır. E-posta/kullanıcı adı bu alana yazılmaz. Boş liste hiç kimseye yönetici yetkisi vermez. Yönetici kendi hesabını veya başka yöneticiyi panelden askıya alamaz. Başlangıçta otomatik yönetici ataması veya genel geçer yönetici parolası yoktur.

3. `AUTH_SECRET` (veya `NEXTAUTH_SECRET`) güçlü bir sunucu sırrı olmalı; `AUTH_URL`/`NEXTAUTH_URL` erişilen public URL ile eşleşmeli. Ortam değişikliklerinden sonra uygulamayı yeniden başlatın/build edin. Analitik istemcisi sunucu ayarıyla yüklenir.

4. Reverse proxy/CDN gerçek ülke bilgisini sağlıyorsa `ANALYTICS_COUNTRY_HEADER` seçilebilir: `cf-ip-country`, `x-vercel-ip-country`, `cloudfront-viewer-country` veya `x-country-code`. Edge, istemciden gelen aynı adlı başlığı silip kendi değerini yazmalı; origin sunucu doğrudan dışarıdan erişilebilir olmamalı. Bu garanti yoksa boş bırakın. Ülke “Bilinmiyor” olur; Accept-Language'dan konum türetilmez. Proxy, hız sınırı için `x-forwarded-for` başlığını da güvenilir biçimde yazmalıdır.

5. Yetkili hesapla giriş yapıp `/admin` açın. Mobil ve masaüstü profil menüsünde **Yönetim Merkezi** bağlantısı görünür.

## Ölçümlerin anlamı

- Görüntüleme, ölçüm etkin bir tarayıcıda kaydedilen sayfa geçişidir; tekil kişi veya oturum sayısı değildir. Bot ve engelleyici tespiti kusursuz değildir.
- Günlük grafikler UTC günlerine göre gruplanır; kullanıcı tarihleri Europe/Istanbul ile gösterilir.
- Aktif üye, seçili dönemde sayfa görüntülemesi ölçülen farklı hesaptır. Askıya alınmadan önce dönem içinde aktif olmuş hesap da bu sayıya dahil olabilir.
- Üye ülkesi son bilinen bağlantı ülkesidir; kayıt ülkesi veya vatandaşlık değildir. Güvenilir ülke değeri olmayan bir ziyaret önceki bilinen ülkeyi silmez.
- Geçmişte ülke/ziyaret/kayıt tarihi tutulmuyordu. Eski kullanıcılar için tarih null kalır; yeni kayıtlar hem e-posta kaydında hem OAuth createUser olayında kaydedilir.
- IP ve tam user-agent veritabanına yazılmaz. IP'nin hash'i yalnızca kısa ömürlü, süreç içi hız sınırı anahtarıdır. Çoklu sunucuda hız sınırları instance başınadır; gerekiyorsa edge'de ortak sınır konulmalıdır.
- Arama metni, kişisel rota kimlikleri, parola sıfırlama/giriş/kayıt/yönetim sayfaları ölçüme alınmaz. Kişisel rotalar şablona çevrilir. Yeni sayfa türleri `analyticsPath` izin listesine eklenmelidir.
- Do Not Track ve Global Privacy Control istekleri ölçülmez. Analitik hatası kullanıcı gezinmesini engellemez. Analytics kapalıysa son görülme/ülke ölçümü de güncellenmez.

## Doğrulama

```sh
npm test -- --runInBand
npx prisma validate
npm run build
```

`tests/admin-*.test.ts` yetki, istemci girdisi, CSV, ülke doğruluğu ve işlem kayıtlarını doğrular. `jest.config.cjs` Next/TypeScript dönüşümünü etkinleştirir ve `.next` çıktılarını test taramasından çıkarır.

Ek olarak gerçek PostgreSQL üzerinde HTTP testleri için yalnızca yerel `cinelists_admin_test` adlı ayrı veritabanı kullanılabilir. `scripts/admin-test-seed.mjs` ve `scripts/admin-http-test.mjs` uzak/başka adlı veritabanlarında çalışmayı reddeder. Önce mevcut şemayı ve yeni migration'ı bu test veritabanına uygulayın, sonra:

```sh
DATABASE_URL="postgresql://...@127.0.0.1:55441/cinelists_admin_test" node scripts/admin-test-seed.mjs
# Test sunucusu: aynı DATABASE_URL, ADMIN_USER_IDS=admin-test,
# AUTH_URL/NEXTAUTH_URL=http://localhost:3100, yalnızca test için ayrı AUTH_SECRET,
# ANALYTICS_ENABLED=true ve ANALYTICS_COUNTRY_HEADER=x-country-code
npm run dev -- --port 3100
DATABASE_URL="postgresql://...@127.0.0.1:55441/cinelists_admin_test" node scripts/admin-http-test.mjs
```

Örnek test hesabı: `admin_test`, parola `AdminTest-2026!`. **Bu yalnızca fixture hesabıdır; gerçek ortama oluşturulmaz.** Test verileri ve fixture parolası canlı ortam için kullanılmamalıdır.

## Erişim güvenliğiyle birlikte yapılan düzeltmeler

- İstemci session update verisi JWT kimliğiyle birleştirilmez; `sub` değiştirilerek yönetici kimliğine geçiş engellenir.
- Askıya alınmış hesaplar girişte ve her oturum doğrulamasında reddedilir. DB doğrulanamazsa eski token üzerinden erişim verilmez.
- Public profil sorgusu yalnızca gerekli alanları seçer; parola/e-posta tüm kullanıcı nesnesi üzerinden istemciye taşınmaz.
- Giriş callback URL'si yalnızca güvenli uygulama içi yol olabilir.

Kodun GitHub’a gönderilmesi canlı veritabanı migration’ını uygulamaz. Canlıda migration çalıştırılmalı ve gerçek yönetici kimliği ayrıca tanımlanmalıdır.
