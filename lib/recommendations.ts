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

    // 2. Fetch high ratings (>= 8) to find preferred genres organically
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

    // 8. Combine and shuffle/sort
    const combinedResults = [
        ...movies.results.map((m: any) => ({ ...m, mediaType: "movie" })),
        ...tv.results.map((t: any) => ({ ...t, mediaType: "tv" })),
    ].sort((a, b) => b.popularity - a.popularity);

    return {
        results: combinedResults.slice(0, 12),
        reasons: {
            genres: finalGenreIds.map(id => ({ id, name: genreIdToName[id] || "Bilinmiyor" })),
            providers: providerIds,
        }
    };
}
