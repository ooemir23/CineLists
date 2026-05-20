# cinelists - Film ve Dizi Takip Uygulaması

cinelists, kullanıcıların film ve dizileri takip edebileceği, arkadaşlarıyla paylaşabileceği, puanlayabileceği modern bir web uygulamasıdır.

## 🚀 Özellikler

- **Film ve Dizi Takibi**: TMDB API'si ile güncel film ve dizi bilgileri
- **Kişiselleştirilmiş Öneriler**: İzleme geçmişine göre akıllı öneriler
- **Sosyal Özellikler**: Arkadaşları takip etme, yorum yapma, öneri paylaşma
- **Çoklu Giriş Yöntemi**: Email/Şifre, Google, Apple ile giriş
- **Responsive Tasarım**: Mobil ve masaüstü için optimize edilmiş
- **PWA Desteği**: Offline kullanım ve mobil uygulama deneyimi

## 🛠️ Teknoloji Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4, Framer Motion
- **Database**: PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js 5
- **API**: TMDB API
- **Deployment**: Docker / Dokploy

## 📦 Kurulum

### Ön Gereksinimler

- Node.js 18+
- PostgreSQL
- TMDB API Key

### Adımlar

1. **Repository'yi klonlayın:**
   ```bash
   git clone <repository-url>
   cd cinelists
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Environment değişkenlerini ayarlayın:**
   ```bash
   cp .env.example .env.local
   ```

   `.env.local` dosyasını düzenleyin:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cinelists"
   AUTH_SECRET="your-secret-key"
   NEXTAUTH_SECRET="your-secret-key"
   AUTH_URL="http://localhost:3000"
   NEXTAUTH_URL="http://localhost:3000"
   TMDB_API_KEY="your-tmdb-api-key"
   AUTH_GOOGLE_ID="your-google-client-id"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   AUTH_APPLE_ID="your-apple-client-id"
   AUTH_APPLE_SECRET="your-apple-client-secret"
   ```

4. **Veritabanını hazırlayın:**
   ```bash
   npm run db:push
   npm run db:migrate
   ```

5. **Development server'ı başlatın:**
   ```bash
   npm run dev
   ```

   [http://localhost:3000](http://localhost:3000) adresinden uygulamaya erişebilirsiniz.

## Dokploy Deploy

GitHub'a `main` branch'i pushlandığında Dokploy deploy'unun otomatik tetiklenmesi ve Docker Swarm service'in yenilenmesi için repository secrets ekleyin:

```text
DOKPLOY_DEPLOY_WEBHOOK=https://.../api/deploy/...
DOKPLOY_SSH_HOST=46.225.94.54
DOKPLOY_SSH_USER=root
DOKPLOY_SSH_PASSWORD=...
```

SSH password yerine key kullanmak isterseniz `DOKPLOY_SSH_PASSWORD` yerine `DOKPLOY_SSH_PRIVATE_KEY` ekleyin.

Varsayılan service ve image isimleri:

```text
DOKPLOY_SERVICE_NAME=cinelistscom-cinelists-xenqhn
DOKPLOY_IMAGE_NAME=cinelistscom-cinelists-xenqhn:latest
PRODUCTION_VERSION_URL=https://cinelists.com/api/version
```

Bunlar farklıysa GitHub repository variables olarak güncelleyin.

Canlıda hangi container'ın servis verdiğini kontrol etmek için:

```text
https://cinelists.com/api/version
```

## 📜 Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint kontrolü
- `npm run lint:fix` - ESLint düzeltmeleri
- `npm run format` - Prettier format
- `npm run test` - Jest testleri
- `npm run analyze` - Bundle analizörü
- `npm run db:studio` - Prisma Studio
- `npm run db:push` - Veritabanı şeması güncelleme

## 🏗️ Proje Yapısı

```
cinelists/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── login/             # Giriş sayfası
│   ├── register/          # Kayıt sayfası
│   └── ...                # Diğer sayfalar
├── components/            # React bileşenleri
│   ├── ui/               # UI bileşenleri
│   ├── layout/           # Layout bileşenleri
│   └── ...               # Özellik bileşenleri
├── lib/                  # Utility fonksiyonları
│   ├── auth.ts           # Authentication
│   ├── prisma.ts         # Database client
│   ├── tmdb.ts           # TMDB API client
│   └── ...               # Diğer utilities
├── prisma/               # Database şeması
│   ├── schema.prisma     # Prisma şeması
│   └── migrations/       # Database migrations
└── public/               # Static assets
```

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm run test

# Testleri watch modunda çalıştır
npm run test:watch

# Coverage raporu
npm run test:coverage
```

## 📊 Performans Analizi

Bundle boyutunu analiz etmek için:

```bash
npm run analyze
```

## 🔒 Güvenlik

- Rate limiting (API istekleri için)
- Input validation (Zod ile)
- Secure headers
- Environment variable validation
- Password hashing (bcryptjs)

## 🚀 Deployment

### Diğer Docker Ortamları

```bash
npm run build
npm run start
```

### Dokploy

1. Application type olarak `Dockerfile` seçin.
2. Dockerfile path olarak repo kökündeki `Dockerfile` dosyasını kullanın.
3. Container portunu `3000` olarak ayarlayın.
4. Dokploy ortam değişkenlerine en az şunları girin:
   - `DATABASE_URL`
   - `TMDB_API_KEY`
   - `AUTH_SECRET` veya `NEXTAUTH_SECRET`
   - `AUTH_URL` ve `NEXTAUTH_URL` (`https://cinelists.com` gibi public domain)
   - `AUTH_GOOGLE_ID`
5. Uygulama container'ını başlatmadan önce migration'ları ayrı bir adım olarak çalıştırın:
   `npm run db:migrate:deploy`
6. Google Cloud Console > OAuth Client > Authorized JavaScript origins alanında prod domainlerini ekleyin:
   `https://cinelists.com` ve `https://www.cinelists.com`
7. Eğer build aşamasında env gerekiyorsa Dokploy’un `build args` veya `build secrets` alanlarını kullanın.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için issue açabilir veya [email] adresinden iletişime geçebilirsiniz.
