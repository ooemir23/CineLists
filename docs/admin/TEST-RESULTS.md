# Yönetim paneli test sonuçları — 14 Eylül 2026

Testler ayrı yerel PostgreSQL veritabanında (`cinelists_admin_test`) ve `localhost:3100` üzerinde yapıldı. Gerçek kullanıcı kayıtları veya canlı şema değiştirilmedi. Örnek 32 hesap ve 30 günlük trafik yalnızca test verisidir.

| Kontrol | Sonuç |
| --- | --- |
| Jest: yetki, işlem, CSV, konum, URL ve sayfalama kuralları | 34/34 geçti |
| Gerçek HTTP + PostgreSQL entegrasyonu | 40/40 geçti |
| Prisma schema validate | Geçti |
| Eski şema üzerine yeni migration uygulanması | Geçti |
| Migration sonrası Prisma schema diff | Fark yok |
| Üretim derlemesi | Geçti; /admin, kullanıcı ayrıntısı ve API rotaları üretildi |
| Yeni yönetim/analitik/test dosyalarında ESLint | Hata/uyarı yok |
| Değiştirilen mevcut dosyalarda ESLint | Hata yok; 32 uyarı |
| Git whitespace kontrolü | Geçti |

## HTTP / veritabanı test kapsamı

- Oturumsuz yönetim sayfası girişe yönleniyor; anonim ve normal üye CSV alamıyor.
- Normal üye yetkisiz ekranı görüyor ve yönetici kullanıcı verisini almıyor.
- İstemci session update ile `sub`, email veya role göndererek yöneticiye dönüşemiyor.
- CSV filtreyi uyguluyor, parola verisi içermiyor ve işlem geçmişine yazılıyor.
- Kullanıcı sayfalama, son görülme/kayıt sırası, bilinmeyen ülke filtresi, 7/90 gün grafikleri, sistem, işlem geçmişi ve ayrıntı sayfası render ediliyor.
- Yönetim sayfaları parola hash'i döndürmüyor; bulunmayan kullanıcı için not-found durumu var.
- Sayfa görüntüleme toplamı artıyor; yabancı origin engelleniyor; DNT/GPC, admin ve arama query'si ölçüme alınmıyor.
- Üyenin son bilinen ülkesi güncelleniyor.
- Askıya alınmış hesabın mevcut JWT oturumu veri erişimi sağlamıyor; yeniden etkinleştirilince erişim açılıyor.

## Tarayıcıda doğrulananlar

- Test yöneticisiyle gerçek giriş ve `/admin` callback'i.
- Genel bakışta beklenen 32 hesap, örnek ülke/cihaz/günlük trafik değerleri.
- Kullanıcı aramasında `test_uye_02` ile yalnızca ilgili hesabın listelenmesi.
- Kullanıcı ayrıntılarının açılması; gerekçeli modal üzerinden askıya alma ve yeniden etkinleştirme.
- Örnek yorumun gerekçeli moderasyonla değiştirilmesi ve işlem geçmişinde görünmesi.
- Masaüstü ve 390×844 mobil görünümün ekran görüntüsüyle incelenmesi.
- Mobil genel bakışta belge genişliği ve kaydırma genişliği eşit (383 px); sekmeler kendi alanlarında yatay kayıyor.

## Son tamamlama kontrolleri

- Yinelenen URL filtreleri paneli bozmuyor.
- Hatalı JSON 400, büyük analitik isteği 413 ile reddediliyor; boyut sınırı parçalı isteklerde de uygulanıyor.
- Mobilde örnek inceleme kaldırıldı; veritabanında puanın 9 olarak korunduğu ve denetim kaydı yazıldığı doğrulandı.
- 14 Eylül ek modal ekran görüntüsü denemesi araç zaman aşımı nedeniyle tamamlanmadı; modal işlevi DOM ve veritabanı üzerinden doğrulandı.
- Mobil kullanıcı dizininde ülke seçimi ve filtre uygulama doğrulandı; belge yatay taşmıyor.

## Dağıtımda kalan yapılandırma

Gerçek yönetici hesabı henüz belirtilmedi. `ADMIN_USER_IDS`, migration ve analitik/geo ortam ayarları canlı dağıtımda tanımlanmalıdır. Canlı ülkelerden gelen trafik, gerçek Google hesabıyla giriş veya e-posta gönderimi bu testlerin kapsamında değildir. Yapılandırma adımları aynı klasördeki README'dedir.
