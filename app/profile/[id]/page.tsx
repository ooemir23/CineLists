import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import { notFound } from "next/navigation";
import { PublicProfileShell } from "@/components/profile/public-profile-shell";
import { PrivateProfileNotice } from "@/components/profile/private-profile-notice";
import { getFollowStatus } from "@/lib/social-actions";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id: userId } = await params;

  // Light lookup first: only the fields needed to render a public header and to
  // decide access. Watched/toWatch/activities/stats are fetched further below,
  // only once we know the viewer is allowed to see them.
  const user = (await prisma.user.findFirst({
    where: {
      isSuspended: false,
      OR: [
        { id: userId },
        { username: userId },
        { usernameAliases: { some: { username: userId } } },
      ],
    },
    select: {
      id: true, name: true, username: true, image: true, bio: true,
      isPrivate: true, showActivities: true, showStats: true,
      _count: {
        select: {
          followedBy: true,
          following: true,
        },
      },
    },
  })) as any;

  if (!user) {
    notFound();
  }

  // Redirect to /profile if viewing own profile
  if (session?.user?.id && (session.user.id === user.id || session.user.id === userId)) {
    const { redirect } = await import("next/navigation");
    redirect("/profile");
  }

  const resolvedUserId = user.id;
  const isFollowing = session?.user?.id ? await getFollowStatus(resolvedUserId) : false;

  // Private accounts only expose their activity/lists/stats to followers.
  if (user.isPrivate && !isFollowing) {
    return (
      <PrivateProfileNotice
        user={user}
        isFollowing={isFollowing}
        currentUserId={session?.user?.id}
      />
    );
  }

  const [
    stats,
    movieGenres,
    tvGenres,
    recentWatched,
    allWatched,
    toWatch,
    fullUser,
  ] = await Promise.all([
    user.showStats ? getUserStats(resolvedUserId) : Promise.resolve({ movieCount: 0, showCount: 0, episodeCount: 0 }),
    tmdb.getGenres("movie"),
    tmdb.getGenres("tv"),
    user.showActivities ? prisma.watched.findMany({
      where: { userId: resolvedUserId },
      take: 12,
      orderBy: { watchedAt: "desc" },
      include: { media: true },
    }) : Promise.resolve([]),
    user.showActivities ? prisma.watched.findMany({
      where: { userId: resolvedUserId },
      take: 100,
      orderBy: { watchedAt: "desc" },
      include: { media: true },
    }) : Promise.resolve([]),
    user.showActivities ? prisma.toWatch.findMany({
      where: { userId: resolvedUserId },
      take: 100,
      orderBy: { addedAt: "desc" },
      include: { media: true },
    }) : Promise.resolve([]),
    prisma.user.findUnique({
      where: { id: resolvedUserId },
      select: {
        favoriteGenres: true, platforms: true, favoriteMediaIds: true,
        favoritePersons: { take: 12, orderBy: { addedAt: "desc" } },
        activities: user.showActivities ? {
          take: 30,
          orderBy: { createdAt: "desc" },
          include: { media: true },
        } : false,
        _count: {
          select: { toWatch: user.showActivities, watched: user.showStats },
        },
      },
    }),
  ]);

  if (!stats || !fullUser) {
    notFound();
  }

  Object.assign(user, fullUser, {
    _count: { ...user._count, ...fullUser._count },
  });

  const favorites = await prisma.favoriteMedia.findMany({
    where: { userId: user.id }, orderBy: { position: "asc" }, take: 12,
    include: { media: true },
  });
  user.favoriteMedia = favorites;
  let favoriteBackdrops: string[] = favorites.flatMap(f => f.media.backdropPath ? [`https://image.tmdb.org/t/p/w1280${f.media.backdropPath}`] : []);

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

  const startOfMonth = new Date();
  startOfMonth.setHours(0, 0, 0, 0);
  startOfMonth.setDate(1);
  const [thisMonthCount, ratingSummary] = user.showStats ? await Promise.all([
    prisma.watched.count({ where: { userId: resolvedUserId, watchedAt: { gte: startOfMonth } } }),
    prisma.watched.aggregate({ where: { userId: resolvedUserId }, _avg: { rating: true } }),
  ]) : [0, { _avg: { rating: null } }];
  const averageRating = ratingSummary._avg.rating ?? 0;

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
