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
    const watched = await prisma.watched.findMany({
        where: { userId },
        select: { media: { select: { tmdbId: true } } },
    });

    return watched.map((entry) => entry.media.tmdbId);
}

const cachedGetWatchedIdsForUser = unstable_cache(
    getWatchedIdsForUser,
    ["home-discover-watched-ids"],
    { revalidate: 120 }
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
        const watchedIds = session?.user?.id
            ? await cachedGetWatchedIdsForUser(session.user.id)
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
                const session = await auth();
                const userItems: DiscoverResult[] = [];

                if (session?.user?.id) {
                    const [watching, toWatch] = await Promise.all([
                        prisma.toWatch.findMany({
                            where: {
                                userId: session.user.id,
                                status: "WATCHING",
                                media: { type: mediaType === "movie" ? "MOVIE" : "TV" },
                            },
                            include: { media: true },
                        }),
                        prisma.toWatch.findMany({
                            where: {
                                userId: session.user.id,
                                status: "PLAN_TO_WATCH",
                                media: { type: mediaType === "movie" ? "MOVIE" : "TV" },
                            },
                            include: { media: true },
                        }),
                    ]);

                    for (const item of watching) {
                        userItems.push({
                            id: item.media.tmdbId,
                            title: item.media.title,
                            poster_path: item.media.posterPath,
                            media_type: item.media.type.toLowerCase() as "movie" | "tv",
                            vote_average: item.media.voteAverage || 0,
                            statusLabel: item.media.type === "TV" ? "Şu An İzleniyor" : "Vizyon Tarihi Belirsiz",
                            statusType: "watching",
                            addedAt: item.addedAt,
                            targetDate: null,
                        });
                    }

                    for (const item of toWatch) {
                        userItems.push({
                            id: item.media.tmdbId,
                            title: item.media.title,
                            poster_path: item.media.posterPath,
                            media_type: mediaType,
                            vote_average: item.media.voteAverage || 0,
                            statusLabel: mediaType === "tv" ? "Yeni Sezon Açıklanmadı" : "Vizyon Tarihi Belirsiz",
                            statusType: "plan_to_watch",
                            addedAt: item.addedAt,
                            targetDate: null,
                        });
                    }
                }

                const tmdbResults = mediaType === "movie" ? await tmdb.getUpcomingMovies({ page }) : await tmdb.getOnTheAirTV({ page });
                let filteredTmdbResults = (tmdbResults?.results || [])
                .filter((item: Record<string, unknown>) => !watchedIdSet.has(Number(item.id)))
                    .map((item: Record<string, unknown>) => asDiscoverResult(item, mediaType));

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
            const combined = [
                ...(movieData?.results || []).map((item: Record<string, unknown>) => asDiscoverResult(item, "movie")),
                ...(tvData?.results || []).map((item: Record<string, unknown>) => asDiscoverResult(item, "tv")),
            ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

            results = combined.filter((item) => !watchedIdSet.has(item.id));
        } else {
            const data = await fetchTypeResults(type as "movie" | "tv");
            results = (data?.results || [])
                .map((item: Record<string, unknown>) => asDiscoverResult(item, type as "movie" | "tv"))
                .filter((item) => !watchedIdSet.has(item.id));
        }

        const pagedResults = results.slice(0, limit);

        return NextResponse.json(
            {
                results: pagedResults,
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
