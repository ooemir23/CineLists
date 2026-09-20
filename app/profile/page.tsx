import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import { redirect } from "next/navigation";
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
                    favoritePersons: { take: 12, orderBy: { addedAt: "desc" } },
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
                take: 12,
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
                take: 100,
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
    const averageRating = ratedItems.length > 0
        ? ratedItems.reduce((sum: number, w: any) => sum + (w.rating || 0), 0) / ratedItems.length
        : 0;

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

    // If still empty, check watched
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
            coverBackdrops={favoriteBackdrops}
        />
    );
}
