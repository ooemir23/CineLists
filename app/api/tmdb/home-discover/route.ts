import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { getFriendsActivity } from "@/lib/feed-actions";

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

    try {
        let results: any[] = [];

        // If any discovery filters are present, force category to discover
        const isDiscovering = genre || year || rating || provider || language || (sortBy !== "popularity.desc");
        const currentCategory = isDiscovering ? "discover" : category;

        if (currentCategory === "friends") {
            const activities = await getFriendsActivity();
            const results = activities.map(activity => ({
                id: activity.media.tmdbId,
                title: activity.media.title,
                original_title: activity.media.title, // Activities might not store original title, using title as fallback
                poster_path: activity.media.posterPath,
                media_type: activity.media.type.toLowerCase(),
                vote_average: activity.rating || 0,
                // Add friend info to result
                friend: {
                    name: activity.user.name,
                    image: activity.user.image,
                    type: activity.type
                }
            }));

            // Enrichment for friends too (runtime, providers)
            const enrichedResults = await Promise.all(results.map(async (item) => {
                try {
                    const details = await tmdb.getDetails(item.media_type as "movie" | "tv", item.id.toString());
                    const providers = await tmdb.getWatchProviders(item.media_type as "movie" | "tv", item.id.toString());
                    return {
                        ...item,
                        original_title: item.media_type === "movie" ? details.original_title : details.original_name,
                        runtime: item.media_type === "movie" ? details.runtime : (details.episode_run_time?.[0] || null),
                        overview: details.overview,
                        watch_providers: providers.results?.TR || null
                    };
                } catch {
                    return item;
                }
            }));

            const finalResults = enrichedResults.map((item: any) => ({
                ...item,
                original_title: item.media_type === "movie" ? item.original_title : item.original_name
            }));

            return NextResponse.json({ results: finalResults });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30)).toISOString().split("T")[0];
        const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split("T")[0];
        const oneDayAgo = new Date(new Date().setDate(now.getDate() - 1)).toISOString().split("T")[0];

        const getTimeRangeParams = (window: string) => {
            const date = window === "month" ? thirtyDaysAgo : window === "week" ? sevenDaysAgo : oneDayAgo;
            return {
                "primary_release_date.gte": date,
                "first_air_date.gte": date
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
                return tmdb.getTrending(mediaType, timeWindow as any, { page });
            }

            if (currentCategory === "random") {
                const randomPage = Math.floor(Math.random() * 10) + 1;
                const data = await tmdb.discover(mediaType, { 
                    sort_by: "vote_average.desc", 
                    "vote_count.gte": "100",
                    page: randomPage.toString()
                });
                return { ...data, results: (data.results || []).sort(() => Math.random() - 0.5) };
            }

            if (currentCategory === "now_playing") {
                return mediaType === "movie" ? tmdb.getNowPlayingMovies({ page }) : tmdb.getAiringTodayTV({ page });
            }

            if (currentCategory === "popular") {
                return timeWindow === "day" ? tmdb.getPopular(mediaType, { page }) : tmdb.discover(mediaType, { sort_by: "popularity.desc", page, ...timeParams });
            }

            if (currentCategory === "top_rated") {
                return timeWindow === "day" ? tmdb.getTopRated(mediaType, { page }) : tmdb.discover(mediaType, { sort_by: "vote_average.desc", "vote_count.gte": "100", page, ...timeParams });
            }

            if (currentCategory === "upcoming") {
                return mediaType === "movie" ? tmdb.getUpcomingMovies({ page }) : tmdb.getOnTheAirTV({ page });
            }

            return tmdb.discover(mediaType, { ...discoverParams, ...(mediaType === "tv" && year ? { first_air_date_year: year } : {}) });
        };

        const enrichResults = async (items: any[]) => {
            return Promise.all((items || []).map(async (item) => {
                try {
                    const mediaType = item.media_type || (type === "all" ? "movie" : type);
                    const [details, providers] = await Promise.all([
                        tmdb.getDetails(mediaType, item.id),
                        tmdb.getWatchProviders(mediaType, item.id)
                    ]);
                    return {
                        ...item,
                        media_type: mediaType,
                        original_title: details.original_title || details.original_name,
                        runtime: details.runtime || (details.episode_run_time ? details.episode_run_time[0] : null),
                        watch_providers: providers.results?.TR || null
                    };
                } catch {
                    return item;
                }
            }));
        };

        if (type === "all") {
            const [movieData, tvData] = await Promise.all([
                fetchTypeResults("movie"),
                fetchTypeResults("tv")
            ]);

            const combined = [
                ...(movieData?.results || []).map((item: any) => ({ ...item, media_type: "movie" })),
                ...(tvData?.results || []).map((item: any) => ({ ...item, media_type: "tv" })),
            ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

            results = await enrichResults(combined);
        } else {
            const data = await fetchTypeResults(type as "movie" | "tv");
            results = await enrichResults((data?.results || []).map((item: any) => ({ ...item, media_type: type })));
        }

        return NextResponse.json({ results });
    } catch (error) {
        console.error("Home discover API error:", error);
        return NextResponse.json({ results: [] });
    }
}
