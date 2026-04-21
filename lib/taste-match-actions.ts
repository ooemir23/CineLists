"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ============================================
// TASTE MATCH / ZEVK UYUMU
// ============================================

interface TasteMatchResult {
  overallScore: number; // 0-100
  movieScore: number;
  tvScore: number;
  genreOverlap: { genre: string; myCount: number; theirCount: number }[];
  commonWatched: {
    mediaId: string;
    title: string;
    posterPath: string | null;
    myRating: number | null;
    theirRating: number | null;
  }[];
  ratingCorrelation: number; // -1 to 1
  totalCommon: number;
  myTotalWatched: number;
  theirTotalWatched: number;
}

export async function calculateTasteMatch(
  userId1: string,
  userId2: string
): Promise<TasteMatchResult | null> {
  // Her iki kullanıcının izlediklerini al
  const [user1Watched, user2Watched] = await Promise.all([
    prisma.watched.findMany({
      where: { userId: userId1 },
      include: { media: true },
    }),
    prisma.watched.findMany({
      where: { userId: userId2 },
      include: { media: true },
    }),
  ]);

  if (user1Watched.length === 0 || user2Watched.length === 0) {
    return null;
  }

  // Ortak izlenenleri bul
  const user2MediaIds = new Set(user2Watched.map((w) => w.mediaId));
  const commonWatched = user1Watched.filter((w) => user2MediaIds.has(w.mediaId));

  // Ortak izlenen detayları
  const commonDetails = commonWatched.map((w1) => {
    const w2 = user2Watched.find((w) => w.mediaId === w1.mediaId)!;
    return {
      mediaId: w1.mediaId,
      title: w1.media.title,
      posterPath: w1.media.posterPath,
      myRating: w1.rating,
      theirRating: w2.rating,
    };
  });

  // Puan korelasyonu hesapla (sadece ikisinin de puanladığı filmler)
  const bothRated = commonDetails.filter(
    (c) => c.myRating !== null && c.theirRating !== null
  );

  let ratingCorrelation = 0;
  if (bothRated.length >= 3) {
    const myRatings = bothRated.map((c) => c.myRating!);
    const theirRatings = bothRated.map((c) => c.theirRating!);
    ratingCorrelation = pearsonCorrelation(myRatings, theirRatings);
  }

  // Tür örtüşmesi hesapla
  const user1Genres = getGenreCounts(user1Watched);
  const user2Genres = getGenreCounts(user2Watched);
  const allGenres = new Set([...Object.keys(user1Genres), ...Object.keys(user2Genres)]);

  const genreOverlap = Array.from(allGenres)
    .filter((genre) => user1Genres[genre] && user2Genres[genre])
    .map((genre) => ({
      genre,
      myCount: user1Genres[genre] || 0,
      theirCount: user2Genres[genre] || 0,
    }))
    .sort((a, b) => Math.min(b.myCount, b.theirCount) - Math.min(a.myCount, a.theirCount));

  // Film ve dizi skorları
  const user1Movies = user1Watched.filter((w) => w.media.type === "MOVIE");
  const user2Movies = user2Watched.filter((w) => w.media.type === "MOVIE");
  const user1TV = user1Watched.filter((w) => w.media.type === "TV");
  const user2TV = user2Watched.filter((w) => w.media.type === "TV");

  const movieScore = calculateCategoryScore(user1Movies, user2Movies);
  const tvScore = calculateCategoryScore(user1TV, user2TV);

  // Genel skor hesapla
  // Ağırlıklar: %30 ortak izlenen, %30 puan korelasyonu, %20 tür örtüşmesi, %20 kategori skorları
  const overlapScore = Math.min(
    (commonWatched.length / Math.min(user1Watched.length, user2Watched.length)) * 100,
    100
  );
  const correlationScore = Math.max(0, (ratingCorrelation + 1) / 2) * 100;
  const genreScore =
    allGenres.size > 0
      ? (genreOverlap.length / allGenres.size) * 100
      : 0;
  const categoryScore = (movieScore + tvScore) / 2;

  const overallScore = Math.round(
    overlapScore * 0.3 +
    correlationScore * 0.3 +
    genreScore * 0.2 +
    categoryScore * 0.2
  );

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    movieScore,
    tvScore,
    genreOverlap: genreOverlap.slice(0, 10),
    commonWatched: commonDetails,
    ratingCorrelation,
    totalCommon: commonWatched.length,
    myTotalWatched: user1Watched.length,
    theirTotalWatched: user2Watched.length,
  };
}

// Pearson korelasyon katsayısı
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

// Tür sayımlarını hesapla
function getGenreCounts(
  watched: { media: { genres: string[] } }[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const w of watched) {
    for (const genre of w.media.genres) {
      counts[genre] = (counts[genre] || 0) + 1;
    }
  }
  return counts;
}

// Kategori skoru hesapla
function calculateCategoryScore(
  user1Items: { mediaId: string }[],
  user2Items: { mediaId: string }[]
): number {
  if (user1Items.length === 0 || user2Items.length === 0) return 0;

  const user2Ids = new Set(user2Items.map((i) => i.mediaId));
  const common = user1Items.filter((i) => user2Ids.has(i.mediaId)).length;

  return Math.min(
    100,
    Math.round((common / Math.min(user1Items.length, user2Items.length)) * 100)
  );
}

// ============================================
// ZEVK UYUMUNA GÖRE ÖNERİLER
// ============================================

export async function getTasteBasedRecommendations(userId: string) {
  // En çok takip edilen kullanıcıların izlediklerini al
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  if (following.length === 0) return [];

  // Kullanıcının izledikleri
  const myWatched = await prisma.watched.findMany({
    where: { userId },
    select: { mediaId: true },
  });
  const myWatchedIds = new Set(myWatched.map((w) => w.mediaId));

  // Takip edilenlerin izlediklerini al (kullanıcının izlemedikleri)
  const friendWatched = await prisma.watched.findMany({
    where: {
      userId: { in: following.map((f) => f.followingId) },
      mediaId: { notIn: Array.from(myWatchedIds) },
      rating: { gte: 7 }, // Sadece yüksek puanlı olanlar
    },
    include: {
      media: true,
      user: {
        select: { name: true, image: true },
      },
    },
    orderBy: { rating: "desc" },
    take: 50,
  });

  // Benzersiz medyaları grupla
  const mediaMap = new Map<string, {
    media: typeof friendWatched[0]["media"];
    recommendedBy: { name: string | null; image: string | null; rating: number | null }[];
    avgRating: number;
  }>();

  for (const w of friendWatched) {
    const existing = mediaMap.get(w.mediaId);
    if (existing) {
      existing.recommendedBy.push({
        name: w.user.name,
        image: w.user.image,
        rating: w.rating,
      });
      // Ortalama puanı güncelle
      const allRatings = existing.recommendedBy
        .map((r) => r.rating)
        .filter((r): r is number => r !== null);
      if (allRatings.length > 0) {
        existing.avgRating =
          allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
      }
    } else {
      mediaMap.set(w.mediaId, {
        media: w.media,
        recommendedBy: [
          { name: w.user.name, image: w.user.image, rating: w.rating },
        ],
        avgRating: w.rating || 0,
      });
    }
  }

  // Skora göre sırala (arkadaş sayısı * ortalama puan)
  return Array.from(mediaMap.values())
    .sort(
      (a, b) =>
        b.recommendedBy.length * b.avgRating -
        a.recommendedBy.length * a.avgRating
    )
    .slice(0, 20);
}
