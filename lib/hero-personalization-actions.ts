"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

export interface UpcomingActorProject {
    id: number;
    title: string;
    posterPath: string | null;
    releaseDate: string | null;
    voteAverage: number;
    mediaType: "movie" | "tv";
    actorName: string;
    actorProfilePath?: string | null;
}

export interface UpcomingEpisode {
    showId: number;
    showTitle: string;
    nextEpisodeDate: string | null;
    nextEpisodeTitle?: string | null;
    nextEpisodeSeason?: number | null;
    nextEpisodeNumber?: number | null;
    platforms: string[];
    platformLogos?: { name: string; logoPath: string | null }[];
    posterPath: string | null;
    voteAverage: number;
    statusType?: "watching" | "plan_to_watch";
    addedAt?: Date;
    mediaType: "movie" | "tv";
    showStatus?: string;
}

export interface FriendStats {
    title: string;
    watchedByCount: number;
    posterPath: string | null;
    tmdbId: number;
    mediaType: "movie" | "tv";
    voteAverage: number;
}

export interface FollowedHighlight {
    tmdbId: number;
    title: string;
    overview: string;
    backdropPath: string | null;
    posterPath: string | null;
    mediaType: "movie" | "tv";
    voteAverage: number;
    eventLabel: string;
    genreIds?: number[];
    metaLabel?: string;
    platformLogos?: { name: string; logoPath: string | null }[];
}

const PROVIDER_IDS: Record<string, number> = {
    netflix: 8,
    "amazon prime video": 9,
    primevideo: 9,
    "disney plus": 337,
    "disney+": 337,
    "apple tv": 350,
    "apple tv+": 350,
    "hbo max": 384,
    max: 384,
    "paramount+": 531,
    "mubi": 11,
    "blutv": 252,
    "gain": 546,
};

/**
 * Get upcoming projects from favorite actors
 */
export async function getFavoriteActorsUpcoming(): Promise<UpcomingActorProject[]> {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Get favorite persons
        const favoritePersons = await prisma.favoritePerson.findMany({
            where: { userId: session.user.id },
            take: 3, // Limit to top 3
        });

        if (favoritePersons.length === 0) return [];

        // Fetch upcoming projects for each actor
        const projects: UpcomingActorProject[] = [];

        const today = new Date();

        for (const person of favoritePersons) {
            try {
                const data = await tmdb.getPersonCombinedCredits(person.tmdbId.toString());
                const upcomingItems = (data.cast || [])
                    .filter((item: any) => item.media_type && (item.media_type === "movie" || item.media_type === "tv"))
                    .map((item: any) => ({
                        ...item,
                        releaseDate: item.release_date || item.first_air_date || null,
                    }))
                    .filter((item: any) => {
                        if (!item.releaseDate) return false;
                        const date = new Date(item.releaseDate);
                        return date >= today;
                    })
                    .sort((a: any, b: any) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
                    .slice(0, 2)
                    .map((item: any) => ({
                        id: item.id,
                        title: item.title || item.name,
                        posterPath: item.poster_path,
                        releaseDate: item.releaseDate,
                        voteAverage: item.vote_average || 0,
                        mediaType: item.media_type as "movie" | "tv",
                        actorName: person.name,
                        actorProfilePath: person.profilePath || null,
                    }));

                projects.push(...upcomingItems);
            } catch (error) {
                console.error(`Error fetching upcoming for actor ${person.tmdbId}:`, error);
            }
        }

        return projects.slice(0, 4); // Limit total to 4
    } catch (error) {
        console.warn("[HeroPersonalization] Favorite actors skipped in dev:", error);
        return [];
    }
}

/**
 * Get next episodes for watched TV shows + currently watching shows
 */
/**
 * Get next episodes for watched TV shows + currently watching shows
 */
export async function getWatchedShowsNextEpisodes(): Promise<UpcomingEpisode[]> {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Get watched shows (TV only) + Currently watching shows + Plan to watch shows
        const [watchingShows, planToWatchShows, watchedShows] = await Promise.all([
            prisma.toWatch.findMany({
                where: {
                    userId: session.user.id,
                    status: "WATCHING",
                    media: { type: "TV" },
                },
                include: { media: true },
                take: 20,
                orderBy: { addedAt: "desc" },
            }),
            prisma.toWatch.findMany({
                where: {
                    userId: session.user.id,
                    status: "PLAN_TO_WATCH",
                },
                include: { media: true },
                take: 30,
                orderBy: { addedAt: "desc" },
            }),
            prisma.watched.findMany({
                where: {
                    userId: session.user.id,
                    media: { type: "TV" },
                },
                include: { media: true },
                take: 15,
                orderBy: { watchedAt: "desc" },
            }),
        ]);

        const combinedShows = [
            ...watchingShows.map(w => ({ media: w.media, statusType: "watching" as const, addedAt: w.addedAt })),
            ...planToWatchShows.map(w => ({ media: w.media, statusType: "plan_to_watch" as const, addedAt: w.addedAt })),
            ...watchedShows.map(w => ({ media: w.media, statusType: undefined, addedAt: w.watchedAt })),
        ];

        // Dedup by media ID
        const uniqueShows = Array.from(new Map(combinedShows.map(s => [s.media.id, s])).values());
        if (uniqueShows.length === 0) return [];

        const episodes: UpcomingEpisode[] = [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Fetch upcoming episode details in parallel
        await Promise.all(uniqueShows.map(async (item) => {
            if (item.media.type === "TV") {
                try {
                    const [details, providers] = await Promise.all([
                        tmdb.getTVShow(item.media.tmdbId.toString()).catch(() => null),
                        tmdb.getWatchProviders("tv", item.media.tmdbId.toString()).catch(() => null),
                    ]);

                    const nextEpisode = details?.next_episode_to_air;
                    const showStatus = details?.status;

                    // If the show has ended or canceled and has no upcoming episode, do not show in calendar
                    if ((showStatus === "Ended" || showStatus === "Canceled") && !nextEpisode) {
                        return;
                    }

                    // Check if next episode exists and is today or in the future
                    if (nextEpisode?.air_date) {
                        const airDate = new Date(nextEpisode.air_date);
                        const startOfAirDate = new Date(airDate.getFullYear(), airDate.getMonth(), airDate.getDate());

                        // If the episode has already aired in the past, remove/skip from calendar
                        if (startOfAirDate.getTime() < startOfToday.getTime()) {
                            return;
                        }

                        const trFlatrate = providers?.results?.TR?.flatrate || providers?.results?.TR?.buy || [];
                        const platformLogos: { name: string; logoPath: string | null }[] = trFlatrate.map((p: any) => ({
                            name: p.provider_name,
                            logoPath: p.logo_path || null,
                        }));
                        let platforms: string[] = trFlatrate.map((p: any) => p.provider_name as string);

                        if (platforms.length === 0 && details?.networks && Array.isArray(details.networks)) {
                            platforms = details.networks.map((n: any) => n.name);
                            details.networks.forEach((n: any) => {
                                if (n.logo_path) {
                                    platformLogos.push({ name: n.name, logoPath: n.logo_path });
                                }
                            });
                        }

                        episodes.push({
                            showId: item.media.tmdbId,
                            showTitle: item.media.title || details?.name || "Dizi",
                            nextEpisodeDate: nextEpisode.air_date,
                            nextEpisodeTitle: nextEpisode.name || null,
                            nextEpisodeSeason: nextEpisode.season_number ?? null,
                            nextEpisodeNumber: nextEpisode.episode_number ?? null,
                            platforms,
                            platformLogos,
                            posterPath: item.media.posterPath || details?.poster_path || null,
                            voteAverage: item.media.voteAverage || details?.vote_average || 0,
                            statusType: item.statusType,
                            addedAt: item.addedAt,
                            mediaType: "tv",
                            showStatus: showStatus || undefined,
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching TV details for ${item.media.tmdbId}:`, error);
                }
            } else if (item.media.type === "MOVIE") {
                try {
                    let releaseDateStr = item.media.releaseDate ? item.media.releaseDate.toISOString().split("T")[0] : null;
                    let moviePoster = item.media.posterPath;
                    let movieTitle = item.media.title;
                    let movieRating = item.media.voteAverage || 0;

                    if (!releaseDateStr) {
                        const movieDetails = await tmdb.getDetails("movie", item.media.tmdbId.toString()).catch(() => null);
                        releaseDateStr = movieDetails?.release_date || null;
                        moviePoster = moviePoster || movieDetails?.poster_path || null;
                        movieTitle = movieTitle || movieDetails?.title || movieDetails?.name;
                        movieRating = movieRating || movieDetails?.vote_average || 0;
                    }

                    if (releaseDateStr) {
                        const relDate = new Date(releaseDateStr);
                        const startOfRelDate = new Date(relDate.getFullYear(), relDate.getMonth(), relDate.getDate());

                        // If the movie has already released in the past, skip it
                        if (startOfRelDate.getTime() < startOfToday.getTime()) {
                            return;
                        }

                        episodes.push({
                            showId: item.media.tmdbId,
                            showTitle: movieTitle,
                            nextEpisodeDate: releaseDateStr,
                            nextEpisodeTitle: null,
                            nextEpisodeSeason: null,
                            nextEpisodeNumber: null,
                            platforms: [],
                            platformLogos: [],
                            posterPath: moviePoster,
                            voteAverage: movieRating,
                            statusType: item.statusType,
                            addedAt: item.addedAt,
                            mediaType: "movie",
                            showStatus: undefined,
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching movie details for ${item.media.tmdbId}:`, error);
                }
            }
        }));

        // Sort chronologically (closest upcoming date first)
        const sorted = episodes.sort((a, b) => {
            if (!a.nextEpisodeDate || !b.nextEpisodeDate) return 0;
            return new Date(a.nextEpisodeDate).getTime() - new Date(b.nextEpisodeDate).getTime();
        });

        // Take top 20 items with upcoming dates
        return sorted.slice(0, 20);
    } catch (error) {
        console.warn("[HeroPersonalization] Next episodes skipped in dev:", error);
        return [];
    }
}

/**
 * Get most-watched shows among friends this week
 */
export async function getFriendsViewingStats(): Promise<FriendStats[]> {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Get user's followers
        const follows = await prisma.follow.findMany({
            where: { followerId: session.user.id },
            include: { following: true },
        });

        if (follows.length === 0) return [];

        const friendIds = follows.map(f => f.followingId);

        // Get activities from friends in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const friendActivities = await prisma.activity.findMany({
            where: {
                userId: { in: friendIds },
                createdAt: { gte: weekAgo },
            },
            include: { media: true },
        });

        // Count by media and get top items
        const mediaCount = new Map<string, { count: number; media: any }>();

        for (const activity of friendActivities) {
            const key = `${activity.mediaId}`;
            if (mediaCount.has(key)) {
                const current = mediaCount.get(key)!;
                current.count++;
            } else {
                mediaCount.set(key, { count: 1, media: activity.media });
            }
        }

        // Sort by count and get top 4
        const topStats = Array.from(mediaCount.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 4)
            .map(item => ({
                title: item.media.title,
                watchedByCount: item.count,
                posterPath: item.media.posterPath,
                tmdbId: item.media.tmdbId,
                mediaType: (item.media.type === "TV" ? "tv" : "movie") as "movie" | "tv",
                voteAverage: item.media.voteAverage || 0,
            }));

        return topStats;
    } catch (error) {
        console.warn("[HeroPersonalization] Friends viewing stats skipped in dev:", error);
        return [];
    }
}

const isWithinDays = (dateStr: string | null | undefined, days: number) => {
    if (!dateStr) return false;
    const now = new Date();
    const target = new Date(dateStr);
    const diffMs = now.getTime() - target.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
};

const isWithinNextDays = (dateStr: string | null | undefined, days: number) => {
    if (!dateStr) return false;
    const now = new Date();
    const target = new Date(dateStr);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= days;
};

const matchesPlatforms = (providers: any[] = [], preferred: string[] = []) => {
    if (providers.length === 0) return false;
    if (preferred.length === 0) return true;
    const normalizedPreferred = preferred.map(p => p.toLowerCase());
    return providers.some((p) => normalizedPreferred.includes((p.provider_name || "").toLowerCase()));
};

export async function getFollowedHighlights(): Promise<FollowedHighlight[]> {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const [user, followedItems] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: { platforms: true },
            }),
            prisma.toWatch.findMany({
                where: { userId: session.user.id },
                take: 6,
                orderBy: { addedAt: "desc" },
                include: { media: true },
            }),
        ]);

        if (!followedItems.length) return [];

        const preferredPlatforms = user?.platforms || [];

        const highlights = await Promise.all(
            followedItems.map(async (item) => {
                const mediaType = item.media.type === "TV" ? "tv" : "movie";
                const data = await tmdb.getDetails(mediaType, item.media.tmdbId.toString()).catch(() => null);
                if (!data) return null;

                const providers = await tmdb.getWatchProviders(mediaType, item.media.tmdbId.toString()).catch(() => null);
                const flatrate = providers?.results?.TR?.flatrate || [];

                let eventLabel: string | null = null;

                if (mediaType === "tv") {
                    const lastEpisodeDate = data.last_episode_to_air?.air_date || null;
                    const nextEpisodeDate = data.next_episode_to_air?.air_date || null;
                    if (isWithinDays(lastEpisodeDate, 7)) {
                        eventLabel = "Yeni Bölüm";
                    } else if (isWithinNextDays(nextEpisodeDate, 7)) {
                        eventLabel = "Yeni Bölüm Yakında";
                    }
                }

                if (!eventLabel && mediaType === "movie") {
                    const releaseDate = data.release_date || null;
                    if (isWithinDays(releaseDate, 30)) {
                        eventLabel = "Vizyona Girdi";
                    }
                }

                if (!eventLabel && matchesPlatforms(flatrate, preferredPlatforms)) {
                    eventLabel = "Platformda Yayında";
                }

                if (!eventLabel) return null;

                return {
                    tmdbId: data.id,
                    title: data.title || data.name || item.media.title,
                    overview: data.overview || "",
                    backdropPath: data.backdrop_path || null,
                    posterPath: data.poster_path || null,
                    mediaType,
                    voteAverage: data.vote_average || 0,
                    eventLabel,
                } as FollowedHighlight;
            })
        );

        return highlights.filter((item): item is FollowedHighlight => !!item && !!item.backdropPath).slice(0, 3);
    } catch (error) {
        console.warn("[HeroPersonalization] Followed highlights skipped in dev:", error);
        return [];
    }
}

const normalizeProvider = (name: string) => name.toLowerCase().replace(/\s+/g, " ").trim();

const mapProvidersToIds = (providers: string[]) => {
    const ids = providers
        .map((p) => PROVIDER_IDS[normalizeProvider(p)])
        .filter((id): id is number => typeof id === "number");
    return Array.from(new Set(ids));
};

const buildHighlight = (data: any, eventLabel: string, metaLabel?: string, platformLogos?: { name: string; logoPath: string | null }[]): FollowedHighlight | null => {
    if (!data?.backdrop_path) return null;
    const genreIds = Array.isArray(data.genre_ids)
        ? data.genre_ids
        : Array.isArray(data.genres)
            ? data.genres.map((g: any) => g.id).filter((id: any) => typeof id === "number")
            : [];
    return {
        tmdbId: data.id,
        title: data.title || data.name || "",
        overview: data.overview || "",
        backdropPath: data.backdrop_path || null,
        posterPath: data.poster_path || null,
        mediaType: data.media_type === "tv" || data.name ? "tv" : "movie",
        voteAverage: data.vote_average || 0,
        eventLabel,
        genreIds,
        metaLabel,
        platformLogos,
    };
};

export async function getPlatformHighlights(): Promise<FollowedHighlight[]> {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { platforms: true },
        });

        const userPlatforms = user?.platforms || [];
        const providerIds = mapProvidersToIds(userPlatforms);
        if (providerIds.length === 0) return [];

        const primaryPlatform = userPlatforms[0] || "";
        const primaryId = mapProvidersToIds(primaryPlatform ? [primaryPlatform] : []);
        const providerParam = (primaryId.length > 0 ? primaryId : providerIds).join("|");

        const [movies, tv] = await Promise.all([
            tmdb.discover("movie", {
                sort_by: "popularity.desc",
                watch_region: "TR",
                with_watch_providers: providerParam,
            }),
            tmdb.discover("tv", {
                sort_by: "popularity.desc",
                watch_region: "TR",
                with_watch_providers: providerParam,
            }),
        ]);

        const rawItems = [
            ...(movies.results || []).map((item: any) => ({ ...item, media_type: "movie" })),
            ...(tv.results || []).map((item: any) => ({ ...item, media_type: "tv" })),
        ].slice(0, 6);

        const itemsWithPlatforms = await Promise.all(rawItems.map(async (item) => {
            const providers = await tmdb.getWatchProviders(item.media_type, item.id.toString()).catch(() => null);
            const flatrate = (providers?.results?.TR?.flatrate || []).slice(0, 3).map((p: any) => ({
                name: p.provider_name,
                logoPath: p.logo_path
            }));
            return buildHighlight(item, "Platformunda Yeni", primaryPlatform || undefined, flatrate);
        }));

        return itemsWithPlatforms.filter((item): item is FollowedHighlight => !!item).slice(0, 3);
    } catch (error) {
        console.error("Error getting platform highlights:", error);
        return [];
    }
}

export async function getTodayHighlights(): Promise<FollowedHighlight[]> {
    try {
        const [movies, tv] = await Promise.all([
            tmdb.getNowPlayingMovies(),
            tmdb.getAiringTodayTV(),
        ]);

        const rawItems = [
            ...(movies.results || []).map((item: any) => ({ ...item, media_type: "movie" })),
            ...(tv.results || []).map((item: any) => ({ ...item, media_type: "tv" })),
        ].slice(0, 6);

        const itemsWithPlatforms = await Promise.all(rawItems.map(async (item) => {
            const providers = await tmdb.getWatchProviders(item.media_type, item.id.toString()).catch(() => null);
            const flatrate = (providers?.results?.TR?.flatrate || []).slice(0, 3).map((p: any) => ({
                name: p.provider_name,
                logoPath: p.logo_path
            }));
            return buildHighlight(item, "Bugun Yayinda", undefined, flatrate);
        }));

        return itemsWithPlatforms.filter((item): item is FollowedHighlight => !!item).slice(0, 3);
    } catch (error) {
        console.error("Error getting today highlights:", error);
        return [];
    }
}

export async function getContinueWatchingHighlights(): Promise<FollowedHighlight[]> {
    try {
        const upcomingEpisodes = await getWatchedShowsNextEpisodes();
        if (upcomingEpisodes.length === 0) return [];

        const items = await Promise.all(
            upcomingEpisodes.map(async (episode) => {
                const data = await tmdb.getDetails("tv", episode.showId.toString()).catch(() => null);
                const metaLabel = episode.nextEpisodeSeason && episode.nextEpisodeNumber
                    ? `S${episode.nextEpisodeSeason} B${episode.nextEpisodeNumber}`
                    : episode.nextEpisodeSeason
                        ? `S${episode.nextEpisodeSeason}`
                        : undefined;
                return buildHighlight(data, "Devam Et", metaLabel);
            })
        );

        return items.filter((item): item is FollowedHighlight => !!item).slice(0, 3);
    } catch (error) {
        console.error("Error getting continue watching highlights:", error);
        return [];
    }
}

export async function getFriendsTrendingHighlights(): Promise<FollowedHighlight[]> {
    try {
        const stats = await getFriendsViewingStats();
        if (stats.length === 0) return [];

        const items = await Promise.all(
            stats.map(async (item) => {
                const data = await tmdb.getDetails(item.mediaType, item.tmdbId.toString()).catch(() => null);
                return buildHighlight(data, "Arkadaslarinda Yukseldi");
            })
        );

        return items.filter((item): item is FollowedHighlight => !!item).slice(0, 3);
    } catch (error) {
        console.error("Error getting friends trending highlights:", error);
        return [];
    }
}
