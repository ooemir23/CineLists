# Mobil geçiş performansı — 16 Eylül 2026

## Uygulanan değişiklikler

- Ortak `loading.tsx`: dinamik gezinmede mevcut koyu tasarımla uyumlu yükleme iskeleti.
- Detay sayfasında temel bilgiler ile ek veri bölümleri Suspense sınırlarıyla ayrıldı. Benzer içerikler yalnızca sekme açıldığında istenir; sekme değişimi gereksiz sunucu navigasyonu oluşturmaz.
- Aramada altı sekme yerine yalnızca seçili dönem/türün 15 içeriği hazırlanır. Seçim URL'de tutulur.
- Liste metadata okuması TMDB tamamlama/yazma işlemini beklemez. Eksikler yanıt sonrasında, sınırlı ve tek sıra halinde tamamlanır; bulunamayan süreler de altı saat önbelleğe alınır. Movie/TV kimlik çakışmalarında yanlış tür güncellenmez.
- Ana sayfa kahraman alanı, kişisel öneriler, yaklaşan bölümler ve akış birbirinden bağımsız aktarılır.
- Keşif kartları platform sorgularını beklemez; platformlar ayrı, en fazla 20 içeriklik doğrulanan istekle tamamlanır. Henüz sorgulanmamış platform için yanlış “yok” etiketi gösterilmez.
- Genel keşif sonuçlarında hesap kimliğiyle ayrılmış, 60 saniyelik ve 40 kayıtla sınırlı bellek önbelleği. Arkadaşlar/takvim/rastgele sonuçları bu önbelleğe alınmaz.
- TMDB görselleri yerel `srcSet` ile CDN boyutlarını kullanır. Diğer kaynakların global görüntü ayarları korunur; sunucuda yeniden kodlama yükü oluşturulmaz.
- Benzer içerikler efektinin yükleme durumu değişince kendi isteğini iptal etmesi düzeltildi.

## Doğrulama

- Üretim derlemesi başarılı.
- TypeScript kontrolü başarılı.
- 7 test paketi / 48 test başarılı: ertelenen önerilerin istek yaşam döngüsü, tekrar sekme açılışı, platform batch doğrulaması/tür ayrımı/kısmi hata ve gerçek duyarlı görsel çıktısı dahil.
- 390×844 tarayıcı görünümünde arama film/dizi sekmeleri, film detayı, benzer içerikler ve ana sayfaya dönüş kontrol edildi.
- Detayda başlık/afiş görünürken ek alanların yükleme durumunda kaldığı, sonrasında eylemler/oyuncular/platformların geldiği gözlendi.
- Görsel `srcSet` çıktısı ve afiş yüklenmesi tarayıcıda doğrulandı.
- Testler ayrı geçici veritabanında yapıldı. Projenin mevcut migration zinciri temiz veritabanında `parentId` eksikliğiyle takıldığı için test şeması `prisma db push` ile hazırlandı; canlı şemaya işlem uygulanmadı.

Yerel, önbelleği ısınmış bir detay isteğinde başlık 62 ms, tamamlanan yanıt 101 ms ölçüldü. Bu ölçüm fiziksel telefon/4G testi değildir ve önceki canlı ölçümle doğrudan hızlanma oranı hesaplamak için kullanılamaz.

## Aynı oturumdaki canlı giriş onarımı

Canlı uygulamanın ortam değişkenlerinde DATABASE_URL ve oturum anahtarları dahil eksikler bulundu. Değişiklik öncesi ayarlar sunucuda yedeklendi; eksikler önceki yedekten kurtarıldı, Dokploy kaydı ve çalışan servis güncellendi. Kullanıcının mevcut hesabıyla kimlik doğrulama ve oturum kontrolü başarılı oldu. Bu işlem performans kodunun yayınlanmasından ayrıdır.
