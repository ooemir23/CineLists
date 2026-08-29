import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { getFriendsActivity } from "@/lib/feed-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

type DiscoverResult = {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    media_type?: "movie" | "tv";
    vote_average?: number;
    popularity?: number;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    genre_ids?: number[];
    statusLabel?: string;
    statusType?: "watching" | "plan_to_watch";
    addedAt?: string | Date;
    targetDate?: string | null;
    friend?: {
        name?: string | null;
        image?: string | null;
        type?: string | null;
    };
    watch_providers?: {
        flatrate?: {
            provider_id: number;
            provider_name: string;
            logo_path?: string | null;
        }[];
    } | null;
};

function asDiscoverResult(item: Record<string, unknown>, mediaType: "movie" | "tv"): DiscoverResult {
    return {
        id: Number(item.id),
        title: typeof item.title === "string" ? item.title : undefined,
        name: typeof item.name === "string" ? item.name : undefined,
        original_title: typeof item.original_title === "string" ? item.original_title : undefined,
        original_name: typeof item.original_name === "string" ? item.original_name : undefined,
        poster_path: typeof item.poster_path === "string" ? item.poster_path : null,
        backdrop_path: typeof item.backdrop_path === "string" ? item.backdrop_path : null,
        media_type: mediaType,
        vote_average: typeof item.vote_average === "number" ? item.vote_average : 0,
        popularity: typeof item.popularity === "number" ? item.popularity : 0,
        release_date: typeof item.release_date === "string" ? item.release_date : undefined,
        first_air_date: typeof item.first_air_date === "string" ? item.first_air_date : undefined,
        overview: typeof item.overview === "string" ? item.overview : undefined,
        genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids.filter((id): id is number => typeof id === "number") : undefined,
    };
}

async function getWatchedIdsForUser(userId: string): Promise<number[]> {
    try {
        const watched = await prisma.watched.findMany({
            where: { userId },
            select: { media: { select: { tmdbId: true } } },
        });

        return watched.map((entry) => entry.media.tmdbId);
    } catch {
        return [];
    }
}

const cachedGetWatchedIdsForUser = unstable_cache(
    getWatchedIdsForUser,
    ["home-discover-watched-ids"],
    { revalidate: 120 }
);

const cachedGetWatchProviders = unstable_cache(
    async (type: "movie" | "tv", id: string) => {
        return tmdb.getWatchProviders(type, id);
    },
    ["tmdb-watch-providers-v2"],
    { revalidate: 86400 }
);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const typeParam = searchParams.get("type");
    const type = typeParam === "tv" ? "tv" : typeParam === "all" ? "all" : "movie";
    const category = searchParams.get("category") || "trending";
    const timeWindow = searchParams.get("timeWindow") || "day";
    const page = searchParams.get("page") || "1";
    const genre = searchParams.get("genre");
    const year = searchParams.get("year");
    const rating = searchParams.get("rating");
    const provider = searchParams.get("provider");
    const language = searchParams.get("language");
    const country = searchParams.get("country");
    const sortBy = searchParams.get("sortBy") || "popularity.desc";
    const upcomingFilter = searchParams.get("upcomingFilter") || "all";
    const limit = Math.max(1, Math.min(Number(searchParams.get("limit") || "12"), 20));

    try {
        const session = await auth();
        const userId = session?.user?.id;
        const watchedIds = userId
            ? await cachedGetWatchedIdsForUser(userId)
            : [];
        const watchedIdSet = new Set(watchedIds);

        const isDiscovering = Boolean(genre || year || rating || provider || language || sortBy !== "popularity.desc");
        const currentCategory = isDiscovering ? "discover" : category;

        if (currentCategory === "friends") {
            const activities = await getFriendsActivity();
            const results: DiscoverResult[] = activities.map((activity) => ({
                id: activity.media.tmdbId,
                title: activity.media.title,
                original_title: activity.media.title,
                poster_path: activity.media.posterPath,
                backdrop_path: activity.media.backdropPath,
                media_type: activity.media.type.toLowerCase() as "movie" | "tv",
                vote_average: activity.rating || 0,
                overview: activity.content || "",
                friend: {
                    name: activity.user.name,
                    image: activity.user.image,
                    type: activity.type,
                },
            }));

            return NextResponse.json(
                { results: results.slice(0, limit), hasMore: results.length > limit },
                {
                    headers: {
                        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
                    },
                }
            );
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30)).toISOString().split("T")[0];
        const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split("T")[0];
        const oneDayAgo = new Date(new Date().setDate(now.getDate() - 1)).toISOString().split("T")[0];

        const getTimeRangeParams = (window: string) => {
            const date = window === "month" ? thirtyDaysAgo : window === "week" ? sevenDaysAgo : oneDayAgo;
            return {
                "primary_release_date.gte": date,
                "first_air_date.gte": date,
            };
        };

        const discoverParams: Record<string, string> = {
            watch_region: "TR",
            sort_by: sortBy,
            page,
        };

        if (timeWindow === "month" && !isDiscovering) discoverParams["primary_release_date.gte"] = thirtyDaysAgo;
        if (genre) discoverParams.with_genres = genre;
        if (year) discoverParams.primary_release_year = year;
        if (rating) discoverParams["vote_average.gte"] = rating;
        if (provider) discoverParams.with_watch_providers = provider;
        if (language) discoverParams.with_original_language = language;
        if (country) discoverParams.with_origin_country = country;

        const fetchTypeResults = async (mediaType: "movie" | "tv") => {
            const timeParams = timeWindow !== "day" ? getTimeRangeParams(timeWindow) : {};

            if (currentCategory === "trending" && timeWindow !== "month") {
                return tmdb.getTrending(mediaType, timeWindow === "week" ? "week" : "day", { page });
            }

            if (currentCategory === "random") {
                const randomPage = Math.floor(Math.random() * 10) + 1;
                const data = await tmdb.discover(mediaType, {
                    sort_by: "vote_average.desc",
                    "vote_count.gte": "100",
                    page: randomPage.toString(),
                });
                return { ...data, results: (data.results || []).sort(() => Math.random() - 0.5) };
            }

            if (currentCategory === "now_playing") {
                return mediaType === "movie" ? tmdb.getNowPlayingMovies({ page }) : tmdb.getAiringTodayTV({ page });
            }

            if (currentCategory === "popular") {
                return timeWindow === "day"
                    ? tmdb.getPopular(mediaType, { page })
                    : tmdb.discover(mediaType, { sort_by: "popularity.desc", page, ...timeParams });
            }

            if (currentCategory === "top_rated") {
                return timeWindow === "day"
                    ? tmdb.getTopRated(mediaType, { page })
                    : tmdb.discover(mediaType, { sort_by: "vote_average.desc", "vote_count.gte": "100", page, ...timeParams });
            }

            if (currentCategory === "upcoming") {
                const userItems: DiscoverResult[] = [];

                if (userId) {
                    const [watching, toWatch] = await Promise.all([
                        prisma.toWatch.findMany({
                            where: {
                                userId,
                                status: "WATCHING",
                                media: { type: mediaType === "movie" ? "MOVIE" : "TV" },
                            },
                            include: { media: true },
                        }),
                        prisma.toWatch.findMany({
                            where: {
                                userId,
                                status: "PLAN_TO_WATCH",
                                media: { type: mediaType === "movie" ? "MOVIE" : "TV" },
                            },
                            include: { media: true },
                        }),
                    ]);

                    const allUserWatchItems = [
                        ...watching.map(item => ({ ...item, statusType: "watching" as const })),
                        ...toWatch.map(item => ({ ...item, statusType: "plan_to_watch" as const })),
                    ];

                    const now = new Date();
                    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    await Promise.all(allUserWatchItems.map(async (item) => {
                        if (item.media.type === "TV") {
                            const details = await tmdb.getTVShow(item.media.tmdbId.toString()).catch(() => null);
                            const nextEpisode = details?.next_episode_to_air;
                            const showStatus = details?.status;

                            // Skip ended / canceled shows without upcoming episodes
                            if ((showStatus === "Ended" || showStatus === "Canceled") && !nextEpisode) {
                                return;
                            }

                            if (nextEpisode?.air_date) {
                                const airDate = new Date(nextEpisode.air_date);
                                const startOfAirDate = new Date(airDate.getFullYear(), airDate.getMonth(), airDate.getDate());
                                if (startOfAirDate.getTime() < startOfToday.getTime()) {
                                    return;
                                }

                                userItems.push({
                                    id: item.media.tmdbId,
                                    title: item.media.title || details?.name || "Dizi",
                                    poster_path: item.media.posterPath || details?.poster_path || null,
                                    media_type: "tv",
                                    vote_average: item.media.voteAverage || details?.vote_average || 0,
                                    statusLabel: `${nextEpisode.season_number}. Sezon ${nextEpisode.episode_number}. Bölüm`,
                                    statusType: item.statusType,
                                    addedAt: item.addedAt,
                                    targetDate: nextEpisode.air_date,
                                });
                            }
                        } else {
                            let releaseDateStr = item.media.releaseDate ? item.media.releaseDate.toISOString().split("T")[0] : null;
                            let poster = item.media.posterPath;
                            let title = item.media.title;
                            let voteAverage = item.media.voteAverage || 0;

                            if (!releaseDateStr) {
                                const movieDetails = await tmdb.getDetails("movie", item.media.tmdbId.toString()).catch(() => null);
                                releaseDateStr = movieDetails?.release_date || null;
                                poster = poster || movieDetails?.poster_path || null;
                                title = title || movieDetails?.title || movieDetails?.name;
                                voteAverage = voteAverage || movieDetails?.vote_average || 0;
                            }

                            if (releaseDateStr) {
                                const relDate = new Date(releaseDateStr);
                                const startOfRelDate = new Date(relDate.getFullYear(), relDate.getMonth(), relDate.getDate());
                                if (startOfRelDate.getTime() < startOfToday.getTime()) {
                                    return;
                                }

                                userItems.push({
                                    id: item.media.tmdbId,
                                    title: title,
                                    poster_path: poster,
                                    media_type: "movie",
                                    vote_average: voteAverage,
                                    statusLabel: "Yakında Vizyonda",
                                    statusType: item.statusType,
                                    addedAt: item.addedAt,
                                    targetDate: releaseDateStr,
                                });
                            }
                        }
                    }));
                }

                const tmdbResults = mediaType === "movie" ? await tmdb.getUpcomingMovies({ page }) : await tmdb.getOnTheAirTV({ page });
                const rawTmdbResults = (tmdbResults?.results || []) as Record<string, unknown>[];
                let filteredTmdbResults: DiscoverResult[] = rawTmdbResults
                    .filter((item) => !watchedIdSet.has(Number(item.id)))
                    .map((item) => asDiscoverResult(item, mediaType));

                if (upcomingFilter !== "all") {
                    const now = new Date();
                    const isToday = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    const isThisWeek = (d: Date) => {
                        const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                        return diff >= -1 && diff <= 7;
                    };

                    const filterFn = upcomingFilter === "today" ? isToday : isThisWeek;

                    filteredTmdbResults = filteredTmdbResults.filter((item) => {
                        const date = item.release_date || item.first_air_date;
                        return date ? filterFn(new Date(date)) : false;
                    });
                }

                const combined = page === "1" ? [...userItems, ...filteredTmdbResults] : filteredTmdbResults;
                return { ...tmdbResults, results: combined };
            }

            return tmdb.discover(mediaType, { ...discoverParams, ...(mediaType === "tv" && year ? { first_air_date_year: year } : {}) });
        };

        let results: DiscoverResult[] = [];

        if (type === "all") {
            const [movieData, tvData] = await Promise.all([fetchTypeResults("movie"), fetchTypeResults("tv")]);
            const movieResults = (movieData?.results || []) as Record<string, unknown>[];
            const tvResults = (tvData?.results || []) as Record<string, unknown>[];
            const combined = [
                ...movieResults.map((item) => asDiscoverResult(item, "movie")),
                ...tvResults.map((item) => asDiscoverResult(item, "tv")),
            ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

            results = combined.filter((item) => !watchedIdSet.has(item.id));
        } else {
            const data = await fetchTypeResults(type as "movie" | "tv");
            const typedResults = (data?.results || []) as Record<string, unknown>[];
            results = typedResults
                .map((item) => asDiscoverResult(item, type as "movie" | "tv"))
                .filter((item) => !watchedIdSet.has(item.id));
        }

        const pagedResults = results.slice(0, limit);

        const resultsWithProviders = await Promise.all(
            pagedResults.map(async (item) => {
                if (!item.media_type || (item.media_type !== "movie" && item.media_type !== "tv")) {
                    return item;
                }

                try {
                    const providerData = await cachedGetWatchProviders(item.media_type, item.id.toString());
                    const trProviders = providerData?.results?.TR?.flatrate;

                    return {
                        ...item,
                        watch_providers: trProviders?.length
                            ? { flatrate: trProviders.slice(0, 5) }
                            : null,
                    };
                } catch {
                    return {
                        ...item,
                        watch_providers: null,
                    };
                }
            })
        );

        return NextResponse.json(
            {
                results: resultsWithProviders,
                hasMore: results.length > limit,
            },
            {
                headers: {
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (error) {
        console.error("Home discover API error:", error);
        return NextResponse.json({ results: [] });
    }
}
