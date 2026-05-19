# CineLists AI Coding Rules & Performance Guidelines

This project is highly optimized for low-cost cloud deployment (Dokploy or similar Docker-based platforms) with strict RAM, CPU, and network egress limits. All AI assistants MUST adhere to these rules strictly to prevent performance regression or deployment crashes.

---

## 🇹🇷 TÜRKÇE TALİMATLAR (TURKISH)

### 1. Paket Boyutu & Dinamik Yükleme (Bundle Size)
*   **KURAL:** Boyutu büyük (>20KB) kütüphaneleri (örneğin OCR için `tesseract.js`, görsel kırpma için `react-image-crop`, grafikler veya ağır animasyon kütüphaneleri) **kesinlikle** doğrudan (statik) import etme.
*   **YÖNTEM:** Bu kütüphaneleri Next.js `dynamic()` (lazy loading) veya kod bloğu içinde dinamik `await import("paket")` kullanarak yükle. Ana sayfa paket boyutunu (initial bundle size) her zaman tüy gibi hafif tut.

### 2. Görsel Optimizasyonu & Bellek Yönetimi
*   **KURAL:** Projede `next/image` kullanılırken sunucu tarafında ağır resim sıkıştırma işlemleri (sharp) yapılması engellenmiştir. `next.config.ts` dosyasında `images: { unoptimized: true }` ayarı aktiftir. 
*   **YÖNTEM:** Bu yapıyı bozacak şekilde sunucu taraflı resim işlemeye zorlayan kodlar yazma. Görsel optimizasyonunu tarayıcıya bırak.

### 3. Veritabanı ve Prisma Kuralları
*   **İndeksler (Indexes):** Şemaya (`schema.prisma`) eklenen her yeni tabloda, yabancı anahtarlara (foreign keys), sık sorgulanan/filtrelenen alanlara ve sıralama alanlarına (örn: `createdAt DESC`) **mutlaka** `@@index` tanımı ekle. Yavaş veritabanı sorgularından kaçın.
*   **Singleton Client:** Prisma Client her istekte yeniden oluşturulamaz. `lib/prisma.ts` içinde tanımlı global singleton `prisma` örneğini kullan.
*   **Susturulmuş Loglar:** Üretim (production) ortamında veritabanı sorgu logları konsola yazdırılamaz. Logları sadece geliştirme (development) ortamında aktif tut: `log: process.env.NODE_ENV === "development" ? ["query"] : []`.

### 4. Kod Değişikliği Sonrası Doğrulama
*   Kodda değişiklik yaptıktan sonra her zaman `npm run build` komutunun hatasız tamamlandığından emin ol.

---

## 🇺🇸 ENGLISH INSTRUCTIONS (ENGLISH)

### 1. Bundle Size & Dynamic Imports
*   **RULE:** Never statically import heavy packages (>20KB) such as `tesseract.js`, `react-image-crop`, or charts/animation libraries in the initial bundle.
*   **METHOD:** Always use Next.js `dynamic()` or inline `await import("package")` to lazy-load these components on demand.

### 2. Image Optimization & CPU/RAM Control
*   **RULE:** Image server-side optimization is disabled to save CPU and memory, utilizing `images: { unoptimized: true }` in `next.config.ts`.
*   **METHOD:** Do not introduce server-heavy image processing code. Let the client handle image rendering and scaling.

### 3. Database & Prisma Rules
*   **Indexes:** When creating new tables in `schema.prisma`, always add `@@index` annotations for foreign keys, filtered columns, and sort keys (e.g., `createdAt DESC`).
*   **Singleton Client:** Always import and use the global Prisma singleton client from `lib/prisma.ts`. Never instantiate `new PrismaClient()` in standard components.
*   **Production Quiet Logging:** Ensure Prisma query logs are muted in production and only active in development via `process.env.NODE_ENV === "development"`.

### 4. Build Verification
*   Verify that `npm run build` succeeds cleanly after any package or route modification.
