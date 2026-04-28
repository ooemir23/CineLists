import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { FavoritePersons } from "@/components/profile/favorite-persons";
import { GenreTags } from "@/components/profile/genre-tags";
import { RecentMedia } from "@/components/profile/recent-media";
import { AchievementsBadges } from "@/components/profile/achievements-badges";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { RandomSuggestion } from "@/components/profile/random-suggestion";
import { WatchCountries } from "@/components/profile/watch-countries";
import { PeriodStats } from "@/components/profile/period-stats";
import { CustomListsPreview } from "@/components/profile/custom-lists-preview";
import { PublicProfileShell } from "@/components/profile/public-profile-shell";
import { getFollowStatus } from "@/lib/social-actions";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: userId } = await params;

  const isOwnProfile = session?.user?.id === userId;

  // Redirect to /profile if viewing own profile via ID
  if (isOwnProfile) {
    const { redirect } = await import("next/navigation");
    redirect("/profile");
  }

  // Fetch user data
  const [user, stats, movieGenres, tvGenres, recentWatched, allWatched, toWatch, customLists, isFollowing] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          favoritePersons: { take: 8, orderBy: { addedAt: "desc" } },
          activities: {
            take: 30,
            orderBy: { createdAt: "desc" },
            include: { media: true },
          },
          customLists: {
            take: 4,
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { items: true } } },
          },
          _count: {
            select: {
              toWatch: true,
              watched: true,
              followedBy: true,
              following: true,
            },
          },
        },
      }),
      getUserStats(userId),
      tmdb.getGenres("movie"),
      tmdb.getGenres("tv"),
      prisma.watched.findMany({
        where: { userId },
        take: 6,
        orderBy: { watchedAt: "desc" },
        include: { media: true },
      }),
      prisma.watched.findMany({
        where: { userId },
        take: 100,
        orderBy: { watchedAt: "desc" },
        include: { media: true },
      }),
      prisma.toWatch.findMany({
        where: { userId },
        take: 12,
        orderBy: { addedAt: "desc" },
        include: { media: true },
      }),
      prisma.customList.findMany({
        where: { userId },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } } },
      }),
      session?.user?.id ? getFollowStatus(userId) : false,
    ]);

  if (!user || !stats) {
    notFound();
  }

  // Merge and unique genres
  const allGenres = Array.from(
    new Map([...movieGenres.genres, ...tvGenres.genres].map((g: any) => [g.id, g]))
      .values()
  ).sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Prepare data for client component
  const userData = {
    ...user,
    username: user.username || "",
    allGenres,
    favoriteGenres: user.favoriteGenres || [],
    platforms: user.platforms || [],
  };

  // Recent watched for poster grid
  const recentMediaItems = recentWatched.map((w: any) => ({
    id: w.media.id,
    title: w.media.title,
    posterPath: w.media.posterPath,
    rating: w.rating,
    type: w.media.type,
    watchedAt: w.watchedAt,
  }));

  // Calculate this month's count
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const thisMonthCount = recentWatched.filter(
    (w: any) => w.watchedAt && new Date(w.watchedAt) > oneMonthAgo
  ).length;

  // Calculate average rating
  const ratedItems = recentWatched.filter((w: any) => w.rating != null && w.rating > 0);
  const averageRating =
    ratedItems.length > 0
      ? ratedItems.reduce((sum: number, w: any) => sum + (w.rating || 0), 0) / ratedItems.length
      : 0;

  // Format custom lists
  const formattedLists = (customLists || user.customLists || []).map((list: any) => ({
    id: list.id,
    name: list.name,
    description: list.description,
    itemCount: list._count?.items || 0,
    isPublic: list.isPublic,
    createdAt: list.createdAt,
  }));

  return (
    <PublicProfileShell
      user={userData as any}
      stats={stats}
      recentMediaItems={recentMediaItems}
      allGenres={allGenres}
      thisMonthCount={thisMonthCount}
      averageRating={averageRating}
      watchedItems={allWatched}
      watchlistItems={toWatch}
      customLists={formattedLists}
      isFollowing={isFollowing}
      currentUserId={session?.user?.id}
    />
  );
}
