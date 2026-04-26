import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

const PLATFORM_MAP: Record<string, string> = {
    "netflix": "8",
    "disney": "337",
    "prime": "119",
    "blutv": "301",
    "mubi": "11",
    "apple": "2",
};

export async function getPersonalizedRecommendations(userId: string) {
    // 1. Fetch user profile
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            favoriteGenres: true,
            platforms: true,
        },
    });

    if (!user) return null;

    // 2. Fetch watched and watchlist IDs to exclude them
    const [watchedItems, watchlistItems] = await Promise.all([
        prisma.watched.findMany({
            where: { userId },
            select: { media: { select: { tmdbId: true } } }
        }),
        prisma.toWatch.findMany({
            where: { userId },
            select: { media: { select: { tmdbId: true } } }
        })
    ]);

    const excludeIds = new Set([
        ...watchedItems.map(item => item.media.tmdbId),
        ...watchlistItems.map(item => item.media.tmdbId)
    ]);

    // 3. Fetch high ratings (>= 8) to find preferred genres organically
    const highRatings = await prisma.watched.findMany({
        where: {
            userId,
            rating: { gte: 8 },
        },
        include: {
            media: true,
        },
        take: 10,
    });

    const ratedGenres = new Set<string>();
    highRatings.forEach((rating) => {
        rating.media.genres.forEach((genre) => ratedGenres.add(genre));
    });

    // 4. Social Signal: What are friends watching?
    const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    let friendsPopularItems: any[] = [];
    if (followingIds.length > 0) {
        const friendsWatched = await prisma.watched.findMany({
            where: {
                userId: { in: followingIds },
                watchedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            },
            include: { media: true },
            take: 20
        });

        // Count occurrences
        const counts: Record<number, { count: number, media: any }> = {};
        friendsWatched.forEach(w => {
            if (!excludeIds.has(w.media.tmdbId)) {
                if (!counts[w.media.tmdbId]) {
                    counts[w.media.tmdbId] = { count: 0, media: w.media };
                }
                counts[w.media.tmdbId].count++;
            }
        });

        friendsPopularItems = Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(item => ({
                ...item.media,
                id: item.media.tmdbId,
                mediaType: item.media.type.toLowerCase(),
                isSocial: true,
                socialCount: item.count
            }));
    }

    // 6. Fetch genres to map names to IDs if necessary
    const [movieGenres, tvGenres] = await Promise.all([
        tmdb.getGenres("movie"),
        tmdb.getGenres("tv"),
    ]);

    const genreNameToId: Record<string, number> = {};
    const genreIdToName: Record<number, string> = {};

    [...movieGenres.genres, ...tvGenres.genres].forEach((g: any) => {
        genreNameToId[g.name.toLowerCase()] = g.id;
        genreIdToName[g.id] = g.name;
    });

    // 3. Combine explicit favorite genres and organic rated genres
    // Ensure everything is a valid TMDB genre ID
    const validGenreIds = new Set<number>();

    // Explicit favorites (already IDs from onboarding)
    (user.favoriteGenres || []).forEach(id => validGenreIds.add(Number(id)));

    // Rated genres (might be names or IDs)
    ratedGenres.forEach(genre => {
        const id = genreNameToId[genre.toLowerCase()] || (isNaN(Number(genre)) ? null : Number(genre));
        if (id) validGenreIds.add(id);
    });

    const finalGenreIds = Array.from(validGenreIds);

    // 4. Map platforms to provider IDs
    const providerIds = (user.platforms || [])
        .map(p => PLATFORM_MAP[p])
        .filter(Boolean);

    // 5. Prepare discover params
    const params: Record<string, string> = {
        sort_by: "popularity.desc",
        watch_region: "TR",
        "vote_count.gte": "100",
    };

    if (finalGenreIds.length > 0) {
        params["with_genres"] = finalGenreIds.join("|");
    }

    if (providerIds.length > 0) {
        params["with_watch_providers"] = providerIds.join("|");
    }

    console.log("RECOMMENDATION_PARAMS (FIXED):", params);

    // 7. Fetch results from TMDB
    const [movies, tv] = await Promise.all([
        tmdb.discover("movie", params),
        tmdb.discover("tv", params),
    ]);

    // 8. Combine, filter out already watched, and shuffle/sort
    const combinedResults = [
        ...friendsPopularItems,
        ...movies.results.map((m: any) => ({ ...m, mediaType: "movie" })),
        ...tv.results.map((t: any) => ({ ...t, mediaType: "tv" })),
    ]
        .filter((m: any) => !excludeIds.has(m.id))
        .sort((a, b) => {
            if (a.isSocial && !b.isSocial) return -1;
            if (!a.isSocial && b.isSocial) return 1;
            return b.popularity - a.popularity;
        });

    const ID_TO_PLATFORM_NAME: Record<string, string> = {
        "8": "Netflix",
        "337": "Disney+",
        "119": "Prime Video",
        "301": "BluTV",
        "11": "MUBI",
        "2": "Apple TV+",
    };

    const favoriteGenreList = (user.favoriteGenres || []).map(id => ({
        id: Number(id),
        name: genreIdToName[Number(id)] || "Bilinmiyor"
    }));

    const organicGenreList = Array.from(ratedGenres).map(genre => {
        const id = genreNameToId[genre.toLowerCase()] || (isNaN(Number(genre)) ? null : Number(genre));
        return id ? { id, name: genreIdToName[id] || genre } : null;
    }).filter(Boolean);

    return {
        results: combinedResults.slice(0, 12),
        reasons: {
            favorites: favoriteGenreList,
            organic: organicGenreList as { id: number; name: string }[],
            platforms: providerIds.map(id => ID_TO_PLATFORM_NAME[id] || "Bilinmiyor"),
            friendsCount: friendsPopularItems.length
        }
    };
}
