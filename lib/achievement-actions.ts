"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/achievement-definitions";

// ============================================
// ACHIEVEMENT KONTROL VE VERME
// ============================================

export async function checkAndUnlockAchievements(userId: string) {
  const newAchievements: string[] = [];

  // Mevcut rozetleri al
  const existingAchievements = await prisma.achievement.findMany({
    where: { userId },
    select: { type: true },
  });
  const existingTypes = new Set(existingAchievements.map((a: any) => a.type));

  // Kullanıcı istatistiklerini topla
  const [
    watchedMovies,
    watchedTVShows,
    watchedEpisodes,
    ratings,
    reviews,
    comments,
    following,
    followers,
    recommendations,
    lists,
    listItems,
    genres,
  ] = await Promise.all([
    prisma.watched.count({
      where: { userId, media: { type: "MOVIE" } },
    }),
    prisma.watched.count({
      where: { userId, media: { type: "TV" } },
    }),
    prisma.watchedEpisode.count({ where: { userId } }),
    prisma.watched.count({ where: { userId, rating: { not: null } } }),
    prisma.activity.count({ where: { userId, type: "REVIEWED" } }),
    prisma.comment.count({ where: { userId } }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.follow.count({ where: { followingId: userId } }),
    prisma.recommendation.count({ where: { senderId: userId } }),
    prisma.customList.count({ where: { userId } }),
    prisma.customListItem.groupBy({
      by: ["listId"],
      where: { list: { userId } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    prisma.watched.findMany({
      where: { userId },
      include: { media: { select: { genres: true } } },
    }),
  ]);

  // Benzersiz türleri hesapla
  const uniqueGenres = new Set<string>();
  const genreCounts: Record<string, number> = {};
  for (const w of genres) {
    for (const g of w.media.genres) {
      uniqueGenres.add(g);
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
  }
  const hasGenreMaster = Object.values(genreCounts).some((c) => c >= 20);

  const totalWatched = watchedMovies + watchedTVShows;
  const maxListItems = listItems[0]?._count?.id || 0;

  // Rozet kontrolleri
  const checks: [string, boolean][] = [
    ["FIRST_WATCH", totalWatched >= 1],
    ["MOVIE_BUFF_10", watchedMovies >= 10],
    ["MOVIE_BUFF_50", watchedMovies >= 50],
    ["MOVIE_BUFF_100", watchedMovies >= 100],
    ["MOVIE_BUFF_250", watchedMovies >= 250],
    ["MOVIE_BUFF_500", watchedMovies >= 500],
    ["TV_BINGER_5", watchedTVShows >= 5],
    ["TV_BINGER_20", watchedTVShows >= 20],
    ["TV_BINGER_50", watchedTVShows >= 50],
    ["EPISODE_MASTER_50", watchedEpisodes >= 50],
    ["EPISODE_MASTER_200", watchedEpisodes >= 200],
    ["EPISODE_MASTER_500", watchedEpisodes >= 500],
    ["CRITIC_10", ratings >= 10],
    ["CRITIC_50", ratings >= 50],
    ["CRITIC_100", ratings >= 100],
    ["REVIEWER_5", reviews >= 5],
    ["REVIEWER_25", reviews >= 25],
    ["GENRE_EXPLORER", uniqueGenres.size >= 5],
    ["GENRE_MASTER", hasGenreMaster],
    ["ALL_ROUNDER", uniqueGenres.size >= 10],
    ["SOCIAL_5", following >= 5],
    ["SOCIAL_25", following >= 25],
    ["INFLUENCER_10", followers >= 10],
    ["INFLUENCER_50", followers >= 50],
    ["RECOMMENDER", recommendations >= 5],
    ["COMMENTER_10", comments >= 10],
    ["COMMENTER_50", comments >= 50],
    ["LIST_CREATOR", lists >= 1],
    ["LIST_MASTER", lists >= 5],
    ["CURATOR", maxListItems >= 25],
  ];

  // Gece kuşu kontrolü
  const nightWatch = await prisma.activity.findFirst({
    where: { userId, type: "WATCHED" },
    orderBy: { createdAt: "desc" },
  });
  if (nightWatch) {
    const hour = new Date(nightWatch.createdAt).getHours();
    if (hour >= 0 && hour < 5) {
      checks.push(["NIGHT_OWL", true]);
    }
  }

  // Maraton kontrolü - aynı gün 3+ film
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWatched = await prisma.watched.count({
    where: {
      userId,
      watchedAt: { gte: today },
      media: { type: "MOVIE" },
    },
  });
  checks.push(["MARATHON_RUNNER", todayWatched >= 3]);

  // Yeni rozetleri kilidi aç
  for (const [type, condition] of checks) {
    if (condition && !existingTypes.has(type)) {
      await prisma.achievement.create({
        data: { userId, type: type as any },
      });
      newAchievements.push(type);
    }
  }

  return newAchievements;
}

// ============================================
// ACHIEVEMENT SORGULAMA
// ============================================

export async function getUserAchievements(userId: string) {
  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "desc" },
  });

  const unlockedTypes = new Set(achievements.map((a: any) => a.type));

  // Tüm rozetleri döndür (kilitli/kilitsiz)
  const allAchievements = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const unlocked = achievements.find((a: any) => a.type === def.type);
    return {
      ...def,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt || null,
    };
  });

  return {
    achievements: allAchievements,
    totalUnlocked: achievements.length,
    totalPossible: ACHIEVEMENT_DEFINITIONS.length,
  };
}

export async function getAchievementStats(userId: string) {
  const count = await prisma.achievement.count({
    where: { userId },
  });

  return {
    unlocked: count,
    total: ACHIEVEMENT_DEFINITIONS.length,
    percentage: Math.round((count / ACHIEVEMENT_DEFINITIONS.length) * 100),
  };
}
