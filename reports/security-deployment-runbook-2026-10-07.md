# CineLists güvenlik değişikliklerini dağıtma

Bu belge kod değişikliklerinin yanında hazırlanmıştır. Üretim veritabanı, Dokploy, GitHub secrets ve sağlayıcı hesaplarında işlem yapılmadı. Aynı adımlar önce üretim verilerinin kişisel bilgilerden arındırılmış bir kopyası üzerinde denenmelidir.

## 1. Anahtarları ve ortamı hazırlama

- Node.js 22.14 veya üstünü kullanın; Docker ve CI Node 22 kullanır.
- `AUTH_SECRET` için özel, rastgele bir değer sağlayın. Eksik, boş ve bilinen geliştirme anahtarıyla başlangıç durur. `NEXTAUTH_SECRET` eski yapılandırmalar için desteklenir; ikisine farklı değerler vermeyin. Yenileme mevcut JWT oturumlarını kapatır.
- Eski kaynak kodundaki TMDB anahtarını sağlayıcı panelinden iptal edip yeni `TMDB_API_KEY` değerini yalnızca çalışma zamanına ekleyin. Önceki loglarda ifşa edilen Google client secret da sağlayıcı panelinden yenilenmelidir. Log ve image geçmişini inceleyerek diğer ifşa edilmiş anahtarları da yenileyin.
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `RESEND_API_KEY`, `DATABASE_URL`, `CRON_SECRET`, `AUTH_URL` ve `NEXT_PUBLIC_APP_URL` değerlerini dağıtım ortamında sağlayın. Sağlayıcı adlarının desteklenen eski karşılıkları uygulamada korunmuştur. Anahtarları repo, image ARG/ENV veya loglara yazmayın.
- Server Actions için ortak anahtar gerekiyorsa **AUTH_SECRET'ten bağımsız** üretin. `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` GitHub secret değeri BuildKit `server_actions_key` mount üzerinden build'e girer; çalışma zamanında bir override tanımlanırsa aynı değer olmalıdır. Sabit değer kullanılmayacaksa override vermeyin ve aynı build image'ını bütün instance'larda çalıştırın. Build çıktısı bu anahtarı içerdiğinden build cache/image erişimini de sınırlandırın. Anahtar yenilenince ilgili build cache'i yeniden kullanmadan image'ı yeniden derleyin; BuildKit secret değişikliği tek başına cache invalidation sağlamaz.
- `TRUSTED_CLIENT_IP_HEADER` yalnızca güvenilir proxy'nin istemciden gelen aynı adlı başlığı **silip yeniden yazdığı**, uygulamanın doğrudan internete açık olmadığı doğrulandıktan sonra tanımlanmalı. Örneğin Cloudflare ile bu koşullar sağlanıyorsa `cf-connecting-ip` kullanılabilir. Varsayılan uygulama sahte `X-Forwarded-For` başlıklarını kabul etmez; IP kotası `unknown` kovasında paylaşılır ve çok sayıda kullanıcıyı kısıtlayabilir. Çoklu proxy zincirinde bu doğrulamayı ayrı yapın.
- Günlük hatırlatma cron isteği `Authorization: Bearer <CRON_SECRET>` kullanmalı; sorgu parametresi üzerinden secret gönderimi kaldırılmıştır.

## 2. Veritabanı geçişini uygulama

1. Yedek alın ve geri yükleme işlemini doğrulayın. Geçiş sırasında eski uygulamadan yazmayı durdurun; SQL tablo değişiklikleri ve veri temizliği kilit alır. Süreyi staging kopyasında ölçün.
2. Aynı sürümün checkout'unda `npm ci --legacy-peer-deps`, `npm run test:migration` ve `npx prisma migrate status` çalıştırın.
3. Hedef `DATABASE_URL` doğrulandıktan sonra **ayrı migration işi** ile `npm run db:migrate:deploy` çalıştırın. Web container her açılışta migration yapmaz; production image Prisma CLI/migration dosyaları taşımaz. `prisma db push` yerine sürümlü migration kullanın.
4. Yeni şemayı gerektiren image'ı geçiş tamamlandıktan sonra dağıtın.

Geçişin veri etkileri:

- Kullanıcı adları küçük harfli ASCII/alt çizgi biçimine getirilir. Çakışan gruptaki her hesap kararlı bir ek alır; eski, harf büyüklüğüne duyarlı profil bağlantıları `UsernameAlias` ile korunur. Eski adlar yeni hesaplar için rezerve edilir. Kullanıcı yeni adını profilinden görür; e-postayla giriş çalışmaya devam eder.
- Bölümsüz `WATCHED`/`RATED` tekrarlarında en yeni aktivite tutulur ve yorumlar ona taşınır. Tekrarlı eski aktivitelerin oy toplamları birleştirilmez; kalan aktivitenin eski toplamı başlangıç değeri olarak korunur. Eski oyların kullanıcı sahipliği bilinmediğinden geçmişe dönük oy kaydı uydurulmaz. Yeni oylar kullanıcı/hedef kaydı üzerinden atomik hesaplanır.
- Favoriler yalnızca türü kesin olarak bilinen kayıtlar için `FavoriteMedia` ilişkisine ve `movie:ID`/`tv:ID` biçimine taşınır. Aynı numarada film ve dizi varsa veya medya kaydı yoksa eski sayısal değer korunur; arayüz tür tahmini yapmaz. Bu kayıtlar aşağıdaki sorguyla listelenip kullanıcı teyidi/veri kaynağıyla çözülmelidir. Yeni favoriler eklemek ve sıralamak bu kayıtları silmez.
- Eski şifre sıfırlama bağlantıları geçersizleştirilir; kullanıcı yeni bağlantı ister. Yeni token'lar digest olarak saklanır. Şifre sıfırlama `sessionVersion` artırarak eski oturumları iptal eder.
- Ülke, varsa geçerli `UserAdminProfile.country` kaydından alınır. Ülkesi bilinmeyen eski hesaplarda önceki TR varsayımı korunur; dil değerinden ülke tahmin edilmez. Yeni hesaplarda ve locale güncellemelerinde algılanan ülke saklanır. Eski hesapların gerçek ülkesini elde ettiğinizde backfill yapın.
- Yapısal payload'ı olmayan eski bildirimler orijinal metnini korur. Yeni bildirimler okunurken seçili dilde oluşturulur.

Çözümlenmemiş favori kontrolü (salt okunur):

```sql
SELECT u.id, legacy.value AS unresolved_favorite
FROM "User" u
CROSS JOIN LATERAL unnest(u."favoriteMediaIds") AS legacy(value)
WHERE legacy.value ~ '^[0-9]+$';
```

## 3. Dağıtımı doğrulama

CI test, PostgreSQL geçiş testi, lint, üretim dependency audit ve build kontrollerinden sonra container'ı başlatıp `/api/health` kontrolü yapar. Test edilen ve yayımlanan build argümanları aynıdır. Image hem `latest` hem commit SHA etiketi alır; Dokploy'da mümkünse doğrulanmış SHA/digest'i kullanın.

`DEPLOY_HEALTH_URL` GitHub repository variable değerini hedef `/api/health` adresi olarak ayarlayın. Webhook hataları CI'ı başarısız yapar. Sağlık endpoint'i **liveness** kontrolüdür; veritabanı, OAuth, TMDB ve e-posta çalıştığını kanıtlamaz. Dağıtım sonrası şu gerçek akışları staging test hesaplarıyla ayrıca doğrulayın:

- TR/EN kayıt, e-posta ve Google girişi; şifre sıfırlama sonrası eski oturumun reddedilmesi.
- Anonim/yabancı/takipçi/hesap sahibi için gizli aktiviteler ve istatistikler; gizlilik değişince eski görünürlüğün önbellekten dönmemesi.
- Aynı numaralı film ve dizinin bağımsız puan ve favorileri; aynı oy isteğinin tekrarı ve oy geri alma.
- İzleme/listeden çıkarma/bölüm/sezon işlemleri, aynı anda gelen istekler ve hata halinde transaction rollback.
- 50 kayıttan uzun sohbet, eski mesajları yükleme, görünmeyen mesajların okunmuş olmaması.
- Farklı ülke/dilde platformlar, öneriler, tarihler ve test alıcılarına e-postalar.

## 4. Geri dönüş

Son çalışan image'ın SHA/digest'ini ve veritabanı snapshot zamanını kaydedin. Bu geçiş favori dizisini tür içeren anahtarlara dönüştürdüğünden **eski image'a körlemesine dönüş uyumlu değildir**. Öncelik ileri yönde düzeltmedir. Eski sürüme dönmek gerekirse yazmayı durdurun, önce staging'de şema/veri uyumluluğunu doğrulayın ve onaylı geri yükleme planını uygulayın. Snapshot geri yükleme yeni yazılan verileri kaybettirebilir; geçiş sonrası verilerin uzlaştırılması gerekir. Otomatik SQL undo veya otomatik veritabanı geri yükleme eklenmedi.

## 5. İzlenecek kalan ölçümler

Gerçek veri üzerinde sorgu planları, p95 gecikme, RAM/CPU ve kuyruk doluluk oranını ölçün. TMDB başlangıç sınırları 25 aktif + 100 bekleyen iş ve kuyruk dahil 10 saniyedir; ölçüme göre ayarlayın. Cache sınırı 300 kayıt, kayıt başına en fazla 100 KB **serileştirilmiş veri**dir; JavaScript nesnelerinin gerçek RAM maliyeti daha yüksek olabilir. Zevk eşleşmesinde aday sayısı en fazla 40; geçmiş büyüklüğü hâlâ kullanıcı verisine bağlıdır. Çok büyük hesaplarda önceden hesaplanan profiller sonraki performans adımıdır.

Üretim dependency audit temizdir. Geliştirme ağacında `braces` ve `sprintf-js` kaynaklı 24 etkilenen kayıt (5 yüksek, 19 orta) kalır. Bu çalışma sırasında kurulan en yeni uyumlu sürümlerde bu transitif paketlerin yayımlanmış düzeltmesi bulunmadı. Bunlar test/lint araçlarının ağacındadır; üretim dependency sıfır sonucu bütün repo bağımlılıklarının temiz olduğu anlamına gelmez. Güvenilmeyen glob/format girdilerini bu araçlara vermeyin ve upstream yamalarını takip edin. Jest'i eski sürüme düşüren `audit fix --force` önerisi uygulanmadı.
