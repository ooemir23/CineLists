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
    include: {
      favoritePersons: { take: 8, orderBy: { addedAt: "desc" } },
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
      take: 6,
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
      take: 12,
      orderBy: { addedAt: "desc" },
      include: { media: true },
    }),
    session?.user?.id ? getFollowStatus(resolvedUserId) : false,
  ]);

  if (!stats) {
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
    />
  );
}
