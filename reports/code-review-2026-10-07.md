# CineLists ayrıntılı kod incelemesi — 7 Ekim 2026

> Bu rapor ilk inceleme anını kaydeder. Uygulanan düzeltmeler ve güncel doğrulamalar: [7 Ekim uygulama raporu](fixes-2026-10-07.md).

En yüksek öncelik üretim anahtarları, gizlilik kurallarının veri katmanında uygulanması ve güvenlik yamalarıdır. Bu tur bir incelemedir; aşağıdaki sorunlar henüz düzeltilmiş değildir. Önceki turda yapılan değişiklikler incelemeye dahildir.

## Kapsam ve kanıt

Kimlik doğrulama, başlangıç betiği, Docker/CI, Server Actions, topluluk ve profil erişimi, mesajlaşma, puan/favori kimlikleri, TMDB önbelleği, öneriler ve TR/EN desteği incelendi. Mevcut 20 test paketindeki 118 test geçti. Üretim derlemesi yeniden başarıyla tamamlandı. ESLint denetimi 0 hata ve 468 uyarıyla tamamlandı. Altı ek geçici testle sorunlu davranışlar Prisma ve oturum nesneleri taklit edilerek yeniden üretildi; bu testler uygulama testlerinden kaldırıldı. Canlı üretim ortamına, gerçek kullanıcılara ve veritabanına yönelik saldırı veya yük testi yapılmadı. Sorgu planları, gerçek RAM tüketimi ve uçtan uca gecikme ölçülmedi.

`npm audit`: tüm bağımlılıklarda 67 bildirim (4 kritik, 52 yüksek, 9 orta, 2 düşük). `npm audit --omit=dev`: 12 bildirim (4 kritik, 4 yüksek, 4 orta). Bu sayılar etkilenen bağımlılık kayıtlarıdır; benzersiz açıklık veya uygulamada kullanılabilir saldırı yolu sayısı değildir.

## 1. Yüksek öncelik — başlangıç betiği sabit kimlik doğrulama anahtarını geri getiriyor

Kanıt: [start.sh](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/start.sh:9), [Dockerfile](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/Dockerfile:34).

Önceki turda `auth.config.ts` üretim ortamında sabit yedek anahtarı kullanmayacak şekilde değiştirildi. Ancak `start.sh`, AUTH_SECRET ve NEXTAUTH_SECRET eksik olduğunda aynı sabit değeri yeniden atıyor. Böylece Docker üzerinden başlatma, önceki korumayı etkisiz bırakıyor. Gerçek dağıtımda rastgele bir anahtar tanımlıysa bu koşul çalışmaz; dağıtım ayarlarını bu incelemede doğrulamadım.

Tavsiye: Üretim başlatıcısı eksik, boş veya geliştirme anahtarı verilmişse açık bir yapılandırma hatasıyla durmalı. Rastgele üretim anahtarı Dokploy çalışma zamanı secret olarak sağlanmalı. Böyle bir dağıtım daha önce sabit anahtarla çalıştıysa anahtar yenileme ve oturumların geçersizleşmesi planlanmalı.

Kabul testi: Üretim başlangıcı secretsız başarısız olmalı; geçerli anahtarla başarılı olmalı. Test, yalnızca TypeScript yapılandırmasını değil başlatma betiğini de kapsamalı.

## 2. Yüksek öncelik — dağıtım dosyalarında anahtar ve log sorunları var

Kanıt: [Dockerfile](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/Dockerfile:37), [start.sh](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/start.sh:54), [deploy.yml](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/.github/workflows/deploy.yml:63).

Dockerfile içinde düz metin TMDB API anahtarı var. Başlatma betiği Google client secret'ın ilk sekiz karakterini logluyor. Build aşamasında bazı secrets ARG/ENV üzerinden geçiriliyor. Raporda hiçbir anahtar değeri tekrarlanmamıştır.

Tavsiye: Kaynak kodundaki anahtarı kaldır ve geçerli bir anahtarsa yenile. Loglarda secret'ın hiçbir kısmını yazdırma; yalnızca yapılandırmanın mevcut olup olmadığı yeterli. Çalışma zamanı secretlarını build argümanlarından ayır. Build sırasında gerçekten gereken secrets için BuildKit secret mount kullan; derleme çıktısına nasıl taşındıklarını ayrıca kontrol et. [Docker resmî secret rehberi](https://docs.docker.com/build/building/secrets/).

## 3. Yüksek öncelik — bağımlılık güvenlik yamaları geride

Kanıt: [package.json](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/package.json:1), package-lock.json ve npm audit çıktıları.

Kurulu sürümler Next.js 16.1.4, next-auth 5.0.0-beta.30, @auth/core 0.41.0, @auth/prisma-adapter 2.11.1 ve sharp 0.34.5. Audit üretim ağacında kritik bildirimler gösteriyor. Bildirimlerin uygulamaya etkisi koşullara bağlıdır: görüntü optimizasyonu kapalı olduğundan optimizer bulgularını doğrudan uygulanabilir saymadım; Linux Docker dağıtımını Windows açığıyla eşleştirmedim. Auth.js'in çoklu OAuth sağlayıcısı şartı olan bildirimi de mevcut tek Google sağlayıcısında doğrulanmış saldırı değildir.

Tavsiye: Next.js ve eslint-config-next'i uyumlu, desteklenen ve yamalı 16.x sürümüne birlikte yükselt. Resmî 30 Eylül duyurusu 16.3.8 yamalarını bildiriyor; hedef sürüm seçilirken daha yeni duyurular da kontrol edilmeli. next-auth için beta.32 ve @auth/core için 0.41.3 ilgili resmî yamalı sürümlerdir; adapter ve diğer bağımlılıklar da uyumlu şekilde güncellenmeli. `npm audit fix --force` yerine üretim paketlerinden başlayarak kontrollü güncelleme yap.

Kaynaklar: [Next.js güvenlik sürümü](https://nextjs.org/blog/september-2026-security-release), [Server Actions DoS duyurusu](https://github.com/vercel/next.js/security/advisories/GHSA-m99w-x7hq-7vfj), [Auth.js etkilenen/yamalı sürümler](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-x445-f3h2-j279).

Kabul testi: Kayıt, e-posta/Google girişi, şifre sıfırlama, eski oturumlar, server actions, test, lint ve Docker başlangıcı doğrulanmalı. Her kalan audit bildiriminin uygulanabilirlik gerekçesi kaydedilmeli.

## 4. Yüksek öncelik — gizli aktiviteler topluluk akışına girebiliyor

Kanıt: [feed-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/feed-actions.ts:266), [gizlilik ayarı açıklaması](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/components/profile/settings-content.tsx:341).

Ana sayfayı dolduran topluluk sorgusunda `isPrivate`, `showActivities` veya `isSuspended` koşulu yok. Arkadaş akışı sorguları da `showActivities` ayarını filtrelemiyor. Kullanıcının profil ekranında gizlenmesi, aynı verinin akış sorgusunda korunmasını sağlamıyor. Geçici testte oturumsuz çağrının gizlilik filtresi olmayan sorgu kurduğu ve mock üzerinden dönen kaydı çıktıya taşıdığı doğrulandı; gerçek özel hesap verisi okunmadı.

Tavsiye: Topluluk ve takipçi görünürlüğünü ayrı tanımlayan ortak bir erişim politikası kur. İzin verilmeyen kayıtları sorguda ele; istemciye gönderip görünümde saklama. Gizlilik veya takip ilişkisi değiştiğinde ilgili önbellekleri de geçersizleştir.

Kabul testi: Anonim, yabancı kullanıcı, takipçi, hesap sahibi ve askıya alınmış kullanıcı kombinasyonlarını isPrivate/showActivities için doğrula.

## 5. Yüksek öncelik — açık Server Actions üzerinden istatistik/gizlilik kontrolü atlanabiliyor

Kanıt: [stats-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/stats-actions.ts:6), [detailed-stats-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/detailed-stats-actions.ts:129), [taste-match-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/taste-match-actions.ts:110).

`getUserStats(userId)` açıkça hedef ID verilince auth çağırmıyor. Detaylı istatistik ve zevk eşleşmesi işlevleri de hedefin gizlilik ayarını kontrol etmiyor. `use server` dosyasındaki dışa açık işlevler, sadece bir sayfanın erişim kontrolüne güvenmemeli. Geçici testte başka hedefin istatistikleri oturumsuz mock çağrıda döndü ve auth hiç çağrılmadı.

Tavsiye: Dışa açık her action, oturumu ve hedef veriye erişimi kendisi doğrulamalı. Sadece sunucu içinden kullanılacak veri yardımcılarını `server-only` modüllere taşı; istemci action'larında kullanıcı kimliğini oturumdan türet. Sayfa kontrolü ile veri kontrolü aynı politikayı kullanmalı. [Next.js veri güvenliği rehberi](https://nextjs.org/docs/app/guides/data-security).

## 6. Yüksek öncelik — oy toplamı kullanıcı başına kayıt tutulmadan değiştiriliyor

Kanıt: [activity-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/activity-actions.ts:407).

`voteActivity` ve `voteComment`, istemcinin `increment` parametresini doğrudan Prisma increment'e geçiriyor. Tek oy kaydı, sınır ve tekrar kontrolü yok. Geçici testte +1.000.000 ve -1.000.000 değerleri doğrudan persistence çağrısına ulaştı. UI'nin yalnızca +1 göndermesi sunucu koruması değildir.

Tavsiye: Kullanıcı/hedef çifti için benzersiz oy kaydı oluştur; sunucuya “oy ver / geri al” niyeti gönder. Oy kaydı ve toplam değişikliği transaction içinde yapılmalı. Yalnızca increment'i 1 ile sınırlamak tekrarlı istek sorununu çözmez.

Kabul testi: Aynı kullanıcının tekrarı, eşzamanlı iki isteği, oy geri alma ve başka kullanıcının bağımsız oyu doğrulanmalı.

## 7. Yüksek öncelik — girişte rate limit gerçek kimlik doğrulama katmanını kapsamıyor

Kanıt: [auth-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/auth-actions.ts:30), [auth.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/auth.ts:61), [Auth route](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/api/auth/[...nextauth]/route.ts:1), [ratelimit.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/ratelimit.ts:5).

Limit yalnızca `loginUser` action'ında; Credentials authorize içinde yok. Auth.js callback akışı bu action'ı kullanmadan çalışabilir. Ayrıca IP+identifier tek birleşik anahtardır: aynı IP'de her yeni hesap adı yeni kota alır. Koddaki “password spraying'i engeller” yorumu bu uygulamayı doğru tarif etmiyor. Store süreç belleğinde olduğundan restart ve çoklu container davranışı da sınırlıdır.

Tavsiye: Limiti authorize veya güvenilir giriş sınırında uygula. IP, hesap ve IP+hesap için ayrı kotalar değerlendir. Proxy başlıklarının hangi katmanda güvenilir hale geldiğini doğrula. Tek container için sınırlı bellekli çözüm yeterli olabilir; çoklu instance varsa ortak store kullan. [Auth.js Credentials rehberi](https://authjs.dev/getting-started/authentication/credentials).

## 8. Orta/yüksek öncelik — şifre sıfırlama atomik değil ve eski oturumlar sürüyor

Kanıt: [auth-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/auth-actions.ts:264), [auth.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/auth.ts:130).

Token okuma, şifre güncelleme ve token silme ayrı işlemler. Eşzamanlı iki istek aynı token'ı geçerli görebilir; güncellemeden sonra silme başarısız olursa token kalabilir. Oturum kontrolü kullanıcı mevcudiyeti/askıya alma durumuna bakıyor; şifre değişikliğinde mevcut JWT'leri geri çağıran bir sürüm veya tarih denetimi yok. Bu bulgu kod akışından çıkarımdır; gerçek oturumla denenmedi.

Tavsiye: Tek kullanımlık token tüketimini ve şifre güncellemesini transaction ve yarışa dayanıklı koşulla bağla. Token'ı veritabanında hash olarak saklamayı değerlendir. Kullanıcıda sessionVersion veya passwordChangedAt ile eski oturumları iptal et.

## 9. Orta öncelik — film ve dizi kimlikleri bazı akışlarda hâlâ karışıyor

Kanıt: [favorite-media-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/favorite-media-actions.ts:22), [rating-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/rating-actions.ts:234), [home-discover route](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/api/tmdb/home-discover/route.ts:72), [recommendations.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/recommendations.ts:70).

MediaItem şeması type+tmdbId ayrımını doğru yapıyor. Ancak favoriler yalnızca sayısal ID saklıyor; bulk puan haritaları yalnızca tmdbId ile anahtarlanıyor; izlenenler/önerilerdeki dışlama kümeleri de türü kaybediyor. Böylece `movie:42` ile `tv:42` aynı favori sanılabilir, yanlış puan gösterilebilir veya biri izlendiğinde diğeri önerilerden çıkarılabilir. Testte farklı iki türün 2 ve 10 puanı aynı anahtarda 6 olarak birleşti.

Tavsiye: Kalıcı favori ilişkisinde MediaItem ID kullan; TMDB cevaplarıyla eşleştirmede `${type}:${tmdbId}` kullan. Mevcut sayısal favorilerin taşınması için belirsiz kayıtları ayrıca ele alan migration planı yap.

## 10. Orta öncelik — kullanıcı adı kuralları kayıt/kurulum/ayarlar arasında farklı

Kanıt: [profile-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/profile-actions.ts:7), [onboarding-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/onboarding-actions.ts:26), [settings-content.tsx](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/components/profile/settings-content.tsx:75).

Kurulum 1–30 ASCII harf/rakam/alt çizgiyi kabul ediyor. Ayarlardaki müsaitlik kontrolü en az üç karakter diyor; updateProfile sunucuda biçim/uzunluk kontrolü yapmıyor ve case-sensitive sorguluyor. Testte `invalid/name` doğrudan veritabanı update'ine ulaştı. Müsaitlik isteklerinde geciktirme ve eski cevabı eleme olmadığı için hızlı yazarken eski sonuç yeni adı yanlış işaretleyebilir.

Tavsiye: Tek normalizasyon/validasyon şeması belirle ve tüm yazma yollarında uygula. Benzersizliği veritabanında da aynı normalizasyonla garanti et. Müsaitlik kontrolünü debounce et ve yalnızca son sorgunun sonucunu göster.

## 11. Orta öncelik — e-postalarda kullanıcı metni HTML içine kaçışsız ekleniyor

Kanıt: [mail.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/mail.ts:375), [mail.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/mail.ts:407), [profile-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/profile-actions.ts:30).

İsimler, kullanıcı adı ve bazı yorum alanları HTML string şablonlarına doğrudan yerleştiriliyor. Kullanıcı kontrollü bir isim e-postanın işaretlemesini/bağlantılarını değiştirebilir. Bu bir HTML içerik enjeksiyonu bulgusudur; e-posta istemcisinde script çalıştırıldığına dair kanıt değildir.

Tavsiye: Metin/attribute bağlamına uygun escape uygula; URL alanlarında izin verilen protokol ve hostları doğrula. Otomatik kaçış yapan e-posta şablonlarına geçiş değerlendir. Testte özel karakterler ve eklenen bağlantı işaretlemesi güvenli metin olarak kalmalı.

## 12. Orta öncelik — cache anahtarlarında dil ve bölge eksik

Kanıt: [recommendations.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/recommendations.ts:265), [tmdb.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/tmdb.ts:104), [i18n/server.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/i18n/server.ts:12).

Kişiselleştirilmiş öneri cache'i userId ile çalışıyor; içeride TMDB çağrısı dil için cookies/headers okumaya gidiyor. Next.js bu dinamik okumaları unstable_cache kapsamında desteklemiyor. getServerLocale hatayı yakalayıp Türkçeye döndüğünden sorun sessizleşebilir. Aynı kullanıcı için locale/country değişimi cache anahtarını değiştirmiyor. [Resmî unstable_cache kısıtı](https://nextjs.org/docs/app/api-reference/functions/unstable_cache).

Tavsiye: Locale/country'yi cache dışından çöz, cached işleve açık argüman olarak geçir. Dil bağımsız provider çağrılarına gereksiz locale okuması yaptırma. TR/EN ve iki ülke kombinasyonunda cache isabet/kaçırma davranışını test et.

## 13. Orta öncelik — global kullanıcıya rağmen bazı bölge ve dil değerleri sabit

Kanıt: [recommendations.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/recommendations.ts:173), [home-discover route](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/api/tmdb/home-discover/route.ts:181), [settings-content.tsx](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/components/profile/settings-content.tsx:95), [message-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/message-actions.ts:38), [daily-reminders route](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/api/cron/daily-reminders/route.ts:49).

Platform listesi ülkeye göre düzeltilmiş olsa da öneri/discover filtreleri hâlâ TR kullanıyor. Ayar toast'ları, bazı Server Action hataları ve kalıcı bildirimler yalnızca Türkçe. Günlük e-postada metin çevriliyor fakat TMDB başlığı/platform listesi alıcının diline ve ülkesine göre çözülmüyor. Sözlük eşitliği testi hardcoded metinleri yakalayamaz.

Tavsiye: request locale, içerik dili, izleme ülkesi ve alıcının kayıtlı e-posta dilini açıkça ayır. Tüm mesajları typed sözlüklere taşı. Bildirimde hazır cümle yerine tür+parametre saklayıp görünümde çevir. Yeni ülke verisi gerekiyorsa migration ve kullanıcı tercihi tasarla.

## 14. Orta öncelik — profil ortalaması ve aylık sayı yalnızca son 100 kayıttan hesaplanıyor

Kanıt: [profil sorgusu](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/profile/[id]/page.tsx:82), [istatistik hesabı](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/profile/[id]/page.tsx:203).

allWatched sorgusunda take:100 var; sonra bu liste “tüm geçmiş” gibi ortalama ve aylık sayıda kullanılıyor. 100'den fazla kaydı olan kullanıcıda ortalama yanlış olabilir; tek ayda 100'den fazla kayıt varsa aylık sayı da eksik çıkar. Gerçek kalabalık hesapla denenmedi; hesaplama ve sınır kodda açık.

Tavsiye: Sayaç/ortalama için ayrı DB count/aggregate sorgusu kullan. Görüntüleme listesi sayfalı kalabilir. 150 kayıt ve aynı ayda 120 kayıt içeren verilerle sonuçları doğrula.

## 15. Orta öncelik — izleme durumunda kısmi güncelleme ve eşzamanlı kayıt riski

Kanıt: [activity-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/activity-actions.ts:107), [schema.prisma](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/prisma/schema.prisma:244).

Watchlist'ten silme, watched ekleme ve activity oluşturma tek transaction değil. Arada hata oluşursa durumlar ayrışabilir. Ayrıca activity unique kuralında nullable episodeId var; PostgreSQL'in varsayılan unique davranışı NULL içeren satırları birbirinin eşiti saymaz. Bu yüzden episodeId=null olan ana film/dizi aktivitelerindeki findFirst→create akışı eşzamanlı çağrıda çoğalabilir. [PostgreSQL unique/NULL davranışı](https://www.postgresql.org/docs/current/ddl-constraints.html).

Tavsiye: Durum değişimini transaction içine al; tekrarlı istekte aynı sonucu veren işlemler tasarla. Bölümlü/bölümsüz aktiviteler için uygun partial unique indeksler veya NULL eşitliği sağlayan migration değerlendir. Mevcut tekrarları migration öncesinde temizle.

## 16. Performans — TMDB bekleme kuyruğu sınırsız

Kanıt: [tmdb.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/tmdb.ts:44), [providers-batch route](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/api/tmdb/providers-batch/route.ts:24).

25 eşzamanlı fetch sınırı var; bekleyen requestQueue için kapasite veya bekleme süresi yok. 10 saniyelik timeout ancak slot alındıktan sonra kuruluyor. Açık API'lerde yeni ID/sorgularla oluşturulan farklı işler kuyruk ve inFlight haritasını büyütebilir. Gerçek yük/RAM ölçümü yapılmadı.

Tavsiye: Sınırlı bekleme kuyruğu, toplam istek deadline'ı ve uygun 429/503 ekle. Açık API'lere endpoint bazında rate limit ve parametre sınırı uygula. Kapasiteyi deployment RAM/CPU ölçümüne göre belirle; yalnızca concurrency sayısını artırma.

## 17. Performans — zevk eşleşmesi ve mesaj geçmişi büyüdükçe pahalılaşıyor

Kanıt: [taste-match-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/taste-match-actions.ts:242), [taste-match route](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/app/api/taste-match/route.ts:22), [message-actions.ts](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/lib/message-actions.ts:123).

Her eşleşme adayında tam izleme ve puan listeleri yeniden okunuyor; hedefler sırayla işleniyor. API limit'i sayısal olarak üst sınırla doğrulamıyor. Mesaj geçmişi de take/cursor olmadan tüm konuşmayı çekiyor ve okuma sırasında kayıtları okunmuş işaretliyor. Uzun konuşmalar daha büyük response ve render maliyeti getirir.

Tavsiye: Limit'i sonlu tamsayı ve makul aralıkta doğrula; mevcut kullanıcının verisini bir kez oku, adayları toplu sorgula. Küçük, sınırlı paralellik veya önceden hesaplanan profil kullan. Mesajlarda son 30–50 kayıt + cursor önerilir; okunmuş işaretlemeyi görünür konuşma için ayrı action yap. Sorgu planıyla uygun composite indeksleri ölç: Message sender/receiver/createdAt; Watched userId/watchedAt; ToWatch userId/addedAt. Her önerilen indeks yazma maliyetiyle birlikte değerlendirilmeli.

## 18. Performans ve kalite — polling, animasyon ve CI

Kanıt: [notification bell](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/components/portal/portal-notification-bell.tsx:85), [genre-tags.tsx](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/components/profile/genre-tags.tsx:3), [profile-activity.tsx](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/components/profile/profile-activity.tsx:8), [deploy.yml](/home/ooemir/Masaüstü/Projeler/Cinelists.com/Cinelists2/.github/workflows/deploy.yml:1).

Bildirim sayısı 20 saniyede bir çekiliyor; interval gizli sekmede durmuyor. Örneğin 1000 açık oturum için yalnızca bu polling yaklaşık 50 istek/saniyedir; her istekte auth ve sayım sorguları çalışır. Bu hesap gerçek ölçüm değildir. Bazı client bileşenlerinde framer-motion hâlâ statik import ediliyor. CI image build/push/deploy yapıyor; ayrı test/lint/audit kapısı yok. Webhook çağrısı HTTP hata yanıtını başarısız deploy olarak ele almıyor.

Tavsiye: Görünürlük kontrollü polling, focus yenilemesi, hata durumunda aralığı büyütme ve aynı sekmede tek polling kaynağı kullan. SSE'yi ancak bağlantı maliyetini ölçerek değerlendir. Basit animasyonları CSS'e taşı; ihtiyaç duyulan ağır parçaları dinamik yükle ve bundle ölç. CI sırası: test → lint → üretim audit politikası → build → geçici container smoke test → publish/deploy. Healthcheck ve rollback koşullarını ekle.

## Önerilen çalışma sırası

1. Üretim başlangıç secret kontrolü, loglardan secret temizliği, gömülü anahtarın kaldırılması ve gerekiyorsa yenilenmesi.
2. Üretim bağımlılık güvenlik güncellemeleri ve Docker/login smoke testleri.
3. Ortak gizlilik/erişim politikası; feed, stats, taste-match ve dışa açık actions.
4. Kullanıcı başına oy modeli, gerçek giriş rate limit'i, güvenli şifre sıfırlama ve e-posta escape.
5. Media kimliği migration'ı, transaction/unique kuralları ve tek kullanıcı adı şeması.
6. Dil/ülke cache anahtarları, global içerik tutarlılığı ve doğru aggregate istatistikler.
7. Kuyruk sınırları, cursor pagination, sorgu/bundle ölçümü, görünürlük kontrollü polling ve CI kapıları.

İlk dört işlevsel güvenlik grubunu ayrı, küçük değişiklikler halinde ele almak inceleme ve geri dönüşü kolaylaştırır. Genel yeniden yazım yerine mevcut yapının güvenlik sınırlarını ve veri kimliklerini düzeltmek daha uygun görünüyor.

## Güçlü kalan noktalar

Prisma global singleton kullanılıyor; sorgu metinleri ham string birleştirmesiyle kurulmamış. Mesaj okuma sorgusu sender/receiver çiftini doğru sınırlandırıyor. Bildirim okuma işaretleme kullanıcı ID'siyle kısıtlanıyor. Yönetici erişiminde DB doğrulaması mevcut. Birçok ilişkide indeks ve cascade tanımı var. MediaItem type+tmdbId uniqueness'i doğru. OCR ve crop paketleri dinamik yükleniyor; sunucu görsel optimizasyonu kapalı tutulmuş. TR/EN sözlük anahtar eşitliği ve önemli akışlar için test altyapısı mevcut.
