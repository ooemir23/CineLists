import { prisma } from "@/lib/prisma";

export type PulseReaction = {
  emoji: string;
  reaction: string;
  title: string;
  author: string;
  id: number;
  type: "movie" | "tv";
};

export type PulseComment = {
  author: string;
  avatarInitial: string;
  title: string;
  comment: string;
  id: number;
  type: "movie" | "tv";
};

export type CommunityPulseData = {
  activeUsersCount: number;
  dailyReviewsCount: number;
  activeListsCount: number;
  topContributorName: string | null;
  recentReactions: PulseReaction[];
  recentComments: PulseComment[];
};

const EMPTY_PULSE: CommunityPulseData = {
  activeUsersCount: 0,
  dailyReviewsCount: 0,
  activeListsCount: 0,
  topContributorName: null,
  recentReactions: [],
  recentComments: [],
};

function reactionForRating(rating: number): { emoji: string; reaction: string } {
  if (rating >= 9) return { emoji: "🍿", reaction: "Mükemmel" };
  if (rating >= 7) return { emoji: "🔥", reaction: "Çok iyi" };
  if (rating >= 5) return { emoji: "🙂", reaction: "Fena değil" };
  return { emoji: "😐", reaction: "Beğenmedi" };
}

function toMediaType(type: string): "movie" | "tv" {
  return type === "TV" ? "tv" : "movie";
}

/**
 * Ana sayfadaki "CineLists Nabzı" paneli için gerçek topluluk verileri.
 * Veritabanına ulaşılamazsa panel boş durumlarla çalışır; sahte veri gösterilmez.
 */
export async function getCommunityPulse(): Promise<CommunityPulseData> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const [activeUsers, dailyReviewsCount, listOwners, topContributors, ratedActivities, reviewActivities] =
      await Promise.all([
        prisma.activity.findMany({
          where: { createdAt: { gte: since } },
          distinct: ["userId"],
          select: { userId: true },
        }),
        prisma.activity.count({
          where: {
            createdAt: { gte: since },
            OR: [{ rating: { not: null } }, { review: { not: null } }],
          },
        }),
        prisma.toWatch.findMany({ distinct: ["userId"], select: { userId: true } }),
        prisma.activity.groupBy({
          by: ["userId"],
          where: { createdAt: { gte: since } },
          _count: { userId: true },
          orderBy: { _count: { userId: "desc" } },
          take: 1,
        }),
        prisma.activity.findMany({
          where: { rating: { not: null }, user: { isPrivate: false, isSuspended: false } },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            rating: true,
            user: { select: { name: true, username: true } },
            media: { select: { title: true, tmdbId: true, type: true } },
          },
        }),
        prisma.activity.findMany({
          where: {
            review: { not: null },
            isSpoiler: false,
            user: { isPrivate: false, isSuspended: false },
          },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            review: true,
            user: { select: { name: true, username: true } },
            media: { select: { title: true, tmdbId: true, type: true } },
          },
        }),
      ]);

    let topContributorName: string | null = null;
    if (topContributors[0]) {
      const topUser = await prisma.user.findUnique({
        where: { id: topContributors[0].userId },
        select: { name: true, username: true, isPrivate: true },
      });
      if (topUser && !topUser.isPrivate) topContributorName = topUser.name || topUser.username;
    }

    return {
      activeUsersCount: activeUsers.length,
      dailyReviewsCount,
      activeListsCount: listOwners.length,
      topContributorName,
      recentReactions: ratedActivities
        .filter((a) => a.media.type !== "PERSON")
        .map((a) => ({
          ...reactionForRating(a.rating ?? 0),
          title: a.media.title,
          author: a.user.name || a.user.username,
          id: a.media.tmdbId,
          type: toMediaType(a.media.type),
        })),
      recentComments: reviewActivities
        .filter((a) => a.media.type !== "PERSON" && a.review?.trim())
        .map((a) => {
          const author = a.user.name || a.user.username;
          return {
            author,
            avatarInitial: author.charAt(0).toLocaleUpperCase("tr-TR"),
            title: a.media.title,
            comment: a.review!.trim(),
            id: a.media.tmdbId,
            type: toMediaType(a.media.type),
          };
        }),
    };
  } catch (error) {
    console.error("[community-pulse] veriler alınamadı", error);
    return EMPTY_PULSE;
  }
}
