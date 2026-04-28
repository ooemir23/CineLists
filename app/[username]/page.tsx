import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import { redirect, notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { FavoritePersons } from "@/components/profile/favorite-persons";
import { GenreTags } from "@/components/profile/genre-tags";
import { RecentMedia } from "@/components/profile/recent-media";
import { AchievementsBadges } from "@/components/profile/achievements-badges";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { WatchCountries } from "@/components/profile/watch-countries";
import { PeriodStats } from "@/components/profile/period-stats";
import { CustomListsPreview } from "@/components/profile/custom-lists-preview";
import { PublicProfileShell } from "@/components/profile/public-profile-shell";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await auth();
  const { username } = await params;

  // Fetch user by username
  const user = await prisma.user.findUnique({
    where: { username },
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
  });

  if (!user) {
    notFound();
  }

  // Check if viewing own profile
  const isOwnProfile = session?.user?.id === user.id;

  // If own profile, redirect to /profile
  if (isOwnProfile) {
    redirect("/profile");
  }

  // Fetch stats & genres
  const [stats, movieGenres, tvGenres, recentWatched, allWatched, toWatch, customLists] =
    await Promise.all([
      getUserStats(user.id),
      tmdb.getGenres("movie"),
      tmdb.getGenres("tv"),
      prisma.watched.findMany({
        where: { userId: user.id },
        take: 6,
        orderBy: { watchedAt: "desc" },
        include: { media: true },
      }),
      prisma.watched.findMany({
        where: { userId: user.id },
        take: 100,
        orderBy: { watchedAt: "desc" },
        include: { media: true },
      }),
      prisma.toWatch.findMany({
        where: { userId: user.id },
        take: 12,
        orderBy: { addedAt: "desc" },
        include: { media: true },
      }),
      prisma.customList.findMany({
        where: { userId: user.id },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { items: true } } },
      }),
    ]);

  if (!stats) {
    notFound();
  }

  // Merge genres
  const allGenres = Array.from(
    new Map([...movieGenres.genres, ...tvGenres.genres].map((g: any) => [g.id, g]))
      .values()
  ).sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Format data
  const recentMediaItems = recentWatched.map((w: any) => ({
    id: w.media.id,
    title: w.media.title,
    posterPath: w.media.posterPath,
    rating: w.rating,
    type: w.media.type,
    watchedAt: w.watchedAt,
  }));

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const thisMonthCount = recentWatched.filter(
    (w: any) => w.watchedAt && new Date(w.watchedAt) > oneMonthAgo
  ).length;

  const ratedItems = recentWatched.filter((w: any) => w.rating != null && w.rating > 0);
  const averageRating =
    ratedItems.length > 0
      ? ratedItems.reduce((sum: number, w: any) => sum + (w.rating || 0), 0) / ratedItems.length
      : 0;

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
      user={user as any}
      stats={stats}
      recentMediaItems={recentMediaItems}
      allGenres={allGenres}
      thisMonthCount={thisMonthCount}
      averageRating={averageRating}
      watchedItems={allWatched}
      watchlistItems={toWatch}
      customLists={formattedLists}
      currentUserId={session?.user?.id}
    />
  );
}
