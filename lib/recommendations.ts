import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { unstable_cache } from "next/cache";

const PLATFORM_MAP: Record<string, string> = {
    "netflix": "8",
    "disney": "337",
    "prime": "119",
    "blutv": "301",
    "mubi": "11",
    "apple": "2",
};

type TmdbGenre = {
    id: number;
    name: string;
};

type DiscoverItem = {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    poster_path?: string | null;
    vote_average?: number;
    popularity?: number;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    mediaType?: "movie" | "tv";
    isSocial?: boolean;
    socialCount?: number;
};

type SocialMediaRecord = {
    tmdbId: number;
    type: string;
    title: string;
    posterPath: string | null;
    backdropPath: string | null;
    genres: string[];
};

async function getPersonalizedRecommendationsForUser(userId: string) {
    try {
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

        let friendsPopularItems: DiscoverItem[] = [];
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
            const counts: Record<number, { count: number; media: SocialMediaRecord }> = {};
            friendsWatched.forEach(w => {
                if (!excludeIds.has(w.media.tmdbId)) {
                    if (!counts[w.media.tmdbId]) {
                        counts[w.media.tmdbId] = {
                            count: 0,
                            media: w.media as SocialMediaRecord,
                        };
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
                    mediaType: item.media.type.toLowerCase() as "movie" | "tv",
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

        [...movieGenres.genres, ...tvGenres.genres].forEach((g: TmdbGenre) => {
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

        // 7. Fetch results from TMDB
        const [movies, tv] = await Promise.all([
            tmdb.discover("movie", params),
            tmdb.discover("tv", params),
        ]);

        // 8. Combine, filter out already watched, and shuffle/sort
        const normalizeDiscoverItem = (item: Record<string, unknown>, mediaType: "movie" | "tv"): DiscoverItem => ({
            id: Number(item.id),
            title: typeof item.title === "string" ? item.title : undefined,
            name: typeof item.name === "string" ? item.name : undefined,
            original_title: typeof item.original_title === "string" ? item.original_title : undefined,
            original_name: typeof item.original_name === "string" ? item.original_name : undefined,
            poster_path: typeof item.poster_path === "string" ? item.poster_path : null,
            vote_average: typeof item.vote_average === "number" ? item.vote_average : 0,
            popularity: typeof item.popularity === "number" ? item.popularity : 0,
            release_date: typeof item.release_date === "string" ? item.release_date : undefined,
            first_air_date: typeof item.first_air_date === "string" ? item.first_air_date : undefined,
            overview: typeof item.overview === "string" ? item.overview : undefined,
            mediaType,
        });

        const movieResults = (movies.results || []) as Record<string, unknown>[];
        const tvResults = (tv.results || []) as Record<string, unknown>[];

        const combinedResults: DiscoverItem[] = [
            ...friendsPopularItems,
            ...movieResults.map((m) => normalizeDiscoverItem(m, "movie")),
            ...tvResults.map((t) => normalizeDiscoverItem(t, "tv")),
        ]
            .filter((m) => !excludeIds.has(m.id))
            .sort((a, b) => {
                if (a.isSocial && !b.isSocial) return -1;
                if (!a.isSocial && b.isSocial) return 1;
                return (b.popularity || 0) - (a.popularity || 0);
            });

        const fallbackResults: DiscoverItem[] =
            combinedResults.length > 0
                ? combinedResults
                : [
                    ...movieResults.map((m) => normalizeDiscoverItem(m, "movie")),
                    ...tvResults.map((t) => normalizeDiscoverItem(t, "tv")),
                ]
                    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

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
            name: genreIdToName[Number(id)] || "Tarih Bekleniyor"
        }));

        const organicGenreList = Array.from(ratedGenres).map(genre => {
            const id = genreNameToId[genre.toLowerCase()] || (isNaN(Number(genre)) ? null : Number(genre));
            return id ? { id, name: genreIdToName[id] || genre } : null;
        }).filter(Boolean);

        return {
            results: fallbackResults.slice(0, 12),
            reasons: {
                favorites: favoriteGenreList,
                organic: organicGenreList as { id: number; name: string }[],
                platforms: providerIds.map(id => ID_TO_PLATFORM_NAME[id] || "Tarih Bekleniyor"),
                friendsCount: friendsPopularItems.length
            }
        };
    } catch (error) {
        console.warn("[Recommendations] DB lookup skipped or failed in dev:", error);
        return null;
    }
}

const cachedGetPersonalizedRecommendations = unstable_cache(
    getPersonalizedRecommendationsForUser,
    ["personalized-recommendations"],
    { revalidate: 300 }
);

export async function getPersonalizedRecommendations(userId: string) {
    return cachedGetPersonalizedRecommendations(userId);
}
