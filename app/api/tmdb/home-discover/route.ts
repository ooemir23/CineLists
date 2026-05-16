import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { getFriendsActivity } from "@/lib/feed-actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    try {
        let results: any[] = [];

        // If any discovery filters are present, force category to discover
        const isDiscovering = genre || year || rating || provider || language || (sortBy !== "popularity.desc");
        const currentCategory = isDiscovering ? "discover" : category;

        const session = await auth();
        let watchedIds: Set<number> = new Set();
        if (session?.user?.id) {
            const watched = await prisma.watched.findMany({
                where: { userId: session.user.id },
                select: { media: { select: { tmdbId: true } } }
            });
            watchedIds = new Set(watched.map(w => w.media.tmdbId));
        }

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

            return NextResponse.json(
                { results: finalResults },
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
                const session = await auth();
                let userItems: any[] = [];
                
                if (session?.user?.id) {
                    const [watching, toWatch] = await Promise.all([
                        prisma.toWatch.findMany({
                            where: { 
                                userId: session.user.id, 
                                status: "WATCHING",
                                media: { type: mediaType === "movie" ? "MOVIE" : "TV" }
                            },
                            include: { media: true },
                        }),
                        prisma.toWatch.findMany({
                            where: { 
                                userId: session.user.id, 
                                status: "PLAN_TO_WATCH",
                                media: { type: mediaType === "movie" ? "MOVIE" : "TV" }
                            },
                            include: { media: true },
                        }),
                    ]);

                    userItems = [
                        ...(await Promise.all(watching.map(async (item) => {
                            let statusLabel = "Şu An İzleniyor";
                            let targetDate = null;
                            if (item.media.type === "TV") {
                                try {
                                    const details = await tmdb.getTVShow(item.media.tmdbId.toString());
                                    const nextEp = details.next_episode_to_air;
                                    const lastEp = details.last_episode_to_air;
                                    
                                    if (nextEp) {
                                        targetDate = nextEp.air_date;
                                        const airDate = new Date(nextEp.air_date);
                                        const formattedDate = airDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
                                        statusLabel = `Yeni Bölüm: ${formattedDate} (S${nextEp.season_number} B${nextEp.episode_number})`;
                                    } else if (lastEp) {
                                        targetDate = lastEp.air_date;
                                        const airDate = new Date(lastEp.air_date);
                                        const now = new Date();
                                        const diffDays = (now.getTime() - airDate.getTime()) / (1000 * 60 * 60 * 24);
                                        
                                        if (diffDays >= 0 && diffDays <= 7) {
                                            const formattedDate = airDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
                                            statusLabel = `Yeni Bölüm Yayında: ${formattedDate} (S${lastEp.season_number} B${lastEp.episode_number})`;
                                        } else {
                                            // Fallback to show status if last episode was long ago
                                            if (details.status === "Ended" || details.status === "Canceled") {
                                                statusLabel = "Final Yaptı";
                                            } else {
                                                statusLabel = "Yeni Sezon Açıklanmadı";
                                            }
                                        }
                                    } else {
                                        // No next or last episode info
                                        if (details.status === "Ended" || details.status === "Canceled") {
                                            statusLabel = "Final Yaptı";
                                        } else {
                                            statusLabel = "Yeni Sezon Açıklanmadı";
                                        }
                                    }
                                } catch (e) {
                                    console.error("Error fetching next episode for", item.media.title, e);
                                }
                            } else if (item.media.type === "MOVIE") {
                                statusLabel = "Vizyon Tarihi Belirsiz";
                            }
                            return {
                                id: item.media.tmdbId,
                                title: item.media.title,
                                poster_path: item.media.posterPath,
                                media_type: item.media.type.toLowerCase(),
                                vote_average: item.media.voteAverage || 0,
                                statusLabel,
                                statusType: "watching",
                                addedAt: item.addedAt,
                                targetDate
                            };
                        }))),
                        ...(await Promise.all(toWatch.map(async (item) => {
                            const displayDate = null;
                            let showStatus = "";
                            if (!displayDate && mediaType === "tv") {
                                try {
                                    const details = await tmdb.getTVShow(item.media.tmdbId.toString());
                                    showStatus = details.status;
                                } catch (e) {}
                            }

                            let statusLabel = "Tarih Bekleniyor";
                            if (displayDate) {
                                statusLabel = new Date(displayDate).toLocaleDateString("tr-TR");
                            } else if (mediaType === "tv") {
                                if (showStatus === "Ended" || showStatus === "Canceled") {
                                    statusLabel = "Final Yaptı";
                                } else {
                                    statusLabel = "Yeni Sezon Açıklanmadı";
                                }
                            } else if (mediaType === "movie") {
                                statusLabel = "Vizyon Tarihi Belirsiz";
                            }

                            return {
                                id: item.media.tmdbId,
                                title: item.media.title,
                                poster_path: item.media.posterPath,
                                media_type: mediaType,
                                vote_average: item.media.voteAverage || 0,
                                statusLabel,
                                statusType: "plan_to_watch",
                                addedAt: item.addedAt,
                                targetDate: displayDate
                            };
                        })))
                    ].sort(() => Math.random() - 0.5);
                }

                const tmdbResults = mediaType === "movie" ? await tmdb.getUpcomingMovies({ page }) : await tmdb.getOnTheAirTV({ page });
                
                let filteredTmdbResults = (tmdbResults?.results || []).filter((item: any) => !watchedIds.has(item.id));

                if (upcomingFilter !== "all") {
                    const now = new Date();
                    const isToday = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    const isThisWeek = (d: Date) => {
                        const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                        return diff >= -1 && diff <= 7;
                    };

                    const filterFn = upcomingFilter === "today" ? isToday : isThisWeek;

                    userItems = userItems.filter(item => {
                        return (item as any).targetDate ? filterFn(new Date((item as any).targetDate)) : (upcomingFilter === "all");
                    });

                    filteredTmdbResults = filteredTmdbResults.filter((item: any) => {
                        const date = item.release_date || item.first_air_date;
                        return date ? filterFn(new Date(date)) : false;
                    });
                }

                if (userItems.length > 0 && page === "1") {
                    const combined = [...userItems, ...filteredTmdbResults];
                    return { ...tmdbResults, results: combined };
                }

                return { ...tmdbResults, results: filteredTmdbResults };
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

            const filtered = combined.filter((item: any) => !watchedIds.has(item.id));
            results = await enrichResults(filtered);
        } else {
            const data = await fetchTypeResults(type as "movie" | "tv");
            const combined = (data?.results || []).map((item: any) => ({ ...item, media_type: type }));
            
            const filtered = combined.filter((item: any) => !watchedIds.has(item.id));
            results = await enrichResults(filtered);
        }

        return NextResponse.json(
            { results },
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
