import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import { redirect } from "next/navigation";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { FavoritePersons } from "@/components/profile/favorite-persons";
import { GenreTags } from "@/components/profile/genre-tags";
import { RecentMedia } from "@/components/profile/recent-media";
import { ProfileCompletion } from "@/components/profile/profile-completion";
import { InsightsCard } from "@/components/profile/insights-card";
import { ProfileClientShell } from "@/components/profile/profile-client-shell";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const isGuest = (session.user as any).isGuest;

    if (isGuest) {
        redirect("/login");
    }

    // Fetch user stats & data
    const [user, stats, movieGenres, tvGenres, recentWatched, allWatched, toWatch, customLists] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                favoritePersons: { take: 8, orderBy: { addedAt: "desc" } },
                activities: {
                    take: 30,
                    orderBy: { createdAt: "desc" },
                    include: { media: true }
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
        getUserStats(session.user.id),
        tmdb.getGenres("movie"),
        tmdb.getGenres("tv"),
        prisma.watched.findMany({
            where: { userId: session.user.id },
            take: 6,
            orderBy: { watchedAt: "desc" },
            include: { media: true },
        }),
        prisma.watched.findMany({
            where: { userId: session.user.id },
            take: 100,
            orderBy: { watchedAt: "desc" },
            include: { media: true },
        }),
        prisma.toWatch.findMany({
            where: { userId: session.user.id },
            take: 12,
            orderBy: { addedAt: "desc" },
            include: { media: true },
        }),
        prisma.customList.findMany({
            where: { userId: session.user.id },
            take: 4,
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { items: true } } },
        }),
    ]);

    if (!user || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-white">Kullanıcı verileri yüklenemedi.</p>
            </div>
        );
    }

    // Merge and unique genres for preference selection
    const allGenres = Array.from(
        new Map([...movieGenres.genres, ...tvGenres.genres].map((g: any) => [g.id, g])).values()
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
    const averageRating = ratedItems.length > 0
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
        <ProfileClientShell
            user={userData as any}
            stats={stats}
            recentMediaItems={recentMediaItems}
            allGenres={allGenres}
            thisMonthCount={thisMonthCount}
            averageRating={averageRating}
            watchedItems={allWatched}
            watchlistItems={toWatch}
            customLists={formattedLists}
        />
    );
}
