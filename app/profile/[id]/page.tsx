import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import { notFound } from "next/navigation";
import { PublicProfileShell } from "@/components/profile/public-profile-shell";
import { getFollowStatus } from "@/lib/social-actions";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: userId } = await params;

  // Fetch user data (support lookup by id or username)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: userId },
        { username: userId },
      ],
    },
    select: {
      id: true, name: true, username: true, image: true, bio: true,
      favoriteGenres: true, platforms: true, isPrivate: true,
      showActivities: true, showStats: true, favoriteMediaIds: true,
      favoritePersons: { take: 12, orderBy: { addedAt: "desc" } },
      activities: {
        take: 30,
        orderBy: { createdAt: "desc" },
        include: { media: true },
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

  // Redirect to /profile if viewing own profile
  if (session?.user?.id && (session.user.id === user.id || session.user.id === userId)) {
    const { redirect } = await import("next/navigation");
    redirect("/profile");
  }

  const resolvedUserId = user.id;

  const [stats, movieGenres, tvGenres, recentWatched, allWatched, toWatch, isFollowing] = await Promise.all([
    getUserStats(resolvedUserId),
    tmdb.getGenres("movie"),
    tmdb.getGenres("tv"),
    prisma.watched.findMany({
      where: { userId: resolvedUserId },
      take: 12,
      orderBy: { watchedAt: "desc" },
      include: { media: true },
    }),
    prisma.watched.findMany({
      where: { userId: resolvedUserId },
      take: 100,
      orderBy: { watchedAt: "desc" },
      include: { media: true },
    }),
    prisma.toWatch.findMany({
      where: { userId: resolvedUserId },
      take: 100,
      orderBy: { addedAt: "desc" },
      include: { media: true },
    }),
    session?.user?.id ? getFollowStatus(resolvedUserId) : false,
  ]);

  if (!stats) {
    notFound();
  }

  // Collect favorite backdrops from favoriteMediaIds or top watched/watchlist
  const favoriteIds = (user.favoriteMediaIds || []).map(Number).filter(Boolean);
  let favoriteBackdrops: string[] = [];

  if (favoriteIds.length > 0) {
    try {
      const favoriteMediaItems = await prisma.mediaItem.findMany({
        where: { tmdbId: { in: favoriteIds } },
        select: { tmdbId: true, backdropPath: true, posterPath: true },
      });

      favoriteBackdrops = favoriteMediaItems
        .map(m => m.backdropPath ? `https://image.tmdb.org/t/p/w1280${m.backdropPath}` : null)
        .filter(Boolean) as string[];

      // If some missing from DB, fetch from TMDB
      if (favoriteBackdrops.length < favoriteIds.length) {
        const missingIds = favoriteIds.filter((id: number) => !favoriteMediaItems.some(m => m.tmdbId === id));
        const tmdbResults = await Promise.all(
          missingIds.slice(0, 4).map(async (id: number) => {
            try {
              const m = await tmdb.getDetails("movie", String(id));
              if (m?.backdrop_path) return `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`;
              const s = await tmdb.getDetails("tv", String(id));
              if (s?.backdrop_path) return `https://image.tmdb.org/t/p/w1280${s.backdrop_path}`;
            } catch {
              return null;
            }
            return null;
          })
        );
        favoriteBackdrops.push(...(tmdbResults.filter(Boolean) as string[]));
      }
    } catch (e) {
      console.warn("Error resolving favorite backdrops:", e);
    }
  }

  // If still no backdrops from favoriteMediaIds, use watched items with backdrops
  if (favoriteBackdrops.length === 0) {
    const ratedWithBackdrop = allWatched
      .filter((w: any) => w.media?.backdropPath)
      .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4)
      .map((w: any) => `https://image.tmdb.org/t/p/w1280${w.media.backdropPath}`);

    favoriteBackdrops = ratedWithBackdrop;
  }

  // If still empty, check watchlist
  if (favoriteBackdrops.length === 0) {
    const watchlistWithBackdrop = toWatch
      .filter((item: any) => item.media?.backdropPath)
      .slice(0, 4)
      .map((item: any) => `https://image.tmdb.org/t/p/w1280${item.media.backdropPath}`);

    favoriteBackdrops = watchlistWithBackdrop;
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
    id: w.media.tmdbId,
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
      isFollowing={isFollowing}
      currentUserId={session?.user?.id}
      coverBackdrops={favoriteBackdrops}
    />
  );
}
