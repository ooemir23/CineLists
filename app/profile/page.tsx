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

    // Fetch user stats & data safely
    let user: any = null;
    let stats: any = null;
    let movieGenres: any = { genres: [] };
    let tvGenres: any = { genres: [] };
    let recentWatched: any[] = [];
    let allWatched: any[] = [];
    let toWatch: any[] = [];

    try {
        const [userData, statsData, movieG, tvG, recentW, allW, toW] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                include: {
                    favoritePersons: { take: 8, orderBy: { addedAt: "desc" } },
                    activities: {
                        take: 30,
                        orderBy: { createdAt: "desc" },
                        include: { media: true }
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
            }).catch(() => null),
            getUserStats(session.user.id).catch(() => ({ movieCount: 0, showCount: 0, episodeCount: 0 })),
            tmdb.getGenres("movie").catch(() => ({ genres: [] })),
            tmdb.getGenres("tv").catch(() => ({ genres: [] })),
            prisma.watched.findMany({
                where: { userId: session.user.id },
                take: 6,
                orderBy: { watchedAt: "desc" },
                include: { media: true },
            }).catch(() => []),
            prisma.watched.findMany({
                where: { userId: session.user.id },
                take: 100,
                orderBy: { watchedAt: "desc" },
                include: { media: true },
            }).catch(() => []),
            prisma.toWatch.findMany({
                where: { userId: session.user.id },
                take: 12,
                orderBy: { addedAt: "desc" },
                include: { media: true },
            }).catch(() => []),
        ]);

        user = userData;
        stats = statsData;
        movieGenres = movieG;
        tvGenres = tvG;
        recentWatched = recentW;
        allWatched = allW;
        toWatch = toW;
    } catch (error) {
        console.warn("[ProfilePage] DB fetch error:", error);
    }

    if (!user) {
        // Fallback user from session for local dev or newly created users
        user = {
            id: session.user.id,
            name: session.user.name || "CineUser",
            username: (session.user.name || "user").toLowerCase().replace(/\s+/g, "_"),
            email: session.user.email,
            image: session.user.image,
            bio: "Sinema tutkunu.",
            favoriteGenres: [],
            platforms: [],
            favoritePersons: [],
            activities: [],
            _count: { toWatch: 0, watched: 0, followedBy: 0, following: 0 },
        };
    }

    if (!stats) {
        stats = { movieCount: 0, showCount: 0, episodeCount: 0 };
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
        />
    );
}
