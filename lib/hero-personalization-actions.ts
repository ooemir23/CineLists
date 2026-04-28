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
}

export interface FriendStats {
    title: string;
    watchedByCount: number;
    posterPath: string | null;
    tmdbId: number;
    mediaType: "movie" | "tv";
    voteAverage: number;
}

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

        for (const person of favoritePersons) {
            try {
                const data = await tmdb.getPersonUpcoming(person.tmdbId);
                const upcomingItems = (data.results || [])
                    .filter((item: any) => item.media_type && (item.media_type === "movie" || item.media_type === "tv"))
                    .slice(0, 2) // Top 2 per actor
                    .map((item: any) => ({
                        id: item.id,
                        title: item.title || item.name,
                        posterPath: item.poster_path,
                        releaseDate: item.release_date || item.first_air_date,
                        voteAverage: item.vote_average || 0,
                        mediaType: item.media_type as "movie" | "tv",
                        actorName: person.name,
                    }));

                projects.push(...upcomingItems);
            } catch (error) {
                console.error(`Error fetching upcoming for actor ${person.tmdbId}:`, error);
            }
        }

        return projects.slice(0, 4); // Limit total to 4
    } catch (error) {
        console.error("Error getting favorite actors upcoming:", error);
        return [];
    }
}

/**
 * Get next episodes for watched TV shows
 */
export async function getWatchedShowsNextEpisodes(): Promise<UpcomingEpisode[]> {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // Get watched shows (TV only)
        const watchedShows = await prisma.watched.findMany({
            where: {
                userId: session.user.id,
                media: { type: "TV" },
            },
            include: { media: true },
            take: 5,
            orderBy: { watchedAt: "desc" },
        });

        if (watchedShows.length === 0) return [];

        const episodes: UpcomingEpisode[] = [];

        for (const watched of watchedShows) {
            try {
                const showData = await tmdb.getTVShow(watched.media.tmdbId.toString());
                if (!showData || !showData.seasons) continue;

                // Get next air date from show data
                const nextEpisodeDate = showData.next_episode_to_air?.air_date;
                const nextEpisodeTitle = showData.next_episode_to_air?.name ?? null;
                const nextEpisodeSeason = showData.next_episode_to_air?.season_number ?? null;
                const nextEpisodeNumber = showData.next_episode_to_air?.episode_number ?? null;
                const networks = (showData.networks || []).map((n: any) => n.name);

                // Get watch providers
                const providers = await tmdb.getWatchProviders("tv", watched.media.tmdbId.toString());
                const platformEntries = (providers?.results?.TR?.flatrate || []).slice(0, 3);
                const platformNames = platformEntries.map((p: any) => p.provider_name);
                const platformLogos = platformEntries.map((p: any) => ({
                    name: p.provider_name,
                    logoPath: p.logo_path || null,
                }));

                if (nextEpisodeDate || platformNames.length > 0) {
                    episodes.push({
                        showId: watched.media.tmdbId,
                        showTitle: watched.media.title,
                        nextEpisodeDate: nextEpisodeDate,
                        nextEpisodeTitle: nextEpisodeTitle,
                        nextEpisodeSeason: nextEpisodeSeason,
                        nextEpisodeNumber: nextEpisodeNumber,
                        platforms: platformNames || networks,
                        platformLogos: platformLogos,
                        posterPath: watched.media.posterPath,
                        voteAverage: watched.media.voteAverage || 0,
                    });
                }
            } catch (error) {
                console.error(`Error fetching episodes for show ${watched.media.tmdbId}:`, error);
            }
        }

        return episodes.slice(0, 3); // Limit to top 3
    } catch (error) {
        console.error("Error getting next episodes:", error);
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
        console.error("Error getting friends viewing stats:", error);
        return [];
    }
}
