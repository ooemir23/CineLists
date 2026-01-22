"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markEpisodeAsWatched(
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    title: string,
    overview: string,
    stillPath: string | null,
    airDate: string | null
) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    // 1. Ensure MediaItem exists
    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId },
    });

    if (!media) {
        // If media doesn't exist, we probably need basic details first. 
        // Ideally we should have passed them or fetched them.
        // For now, we assume it exists or we fetch basics? 
        // Let's create with minimal info if missing, but it's risky for title.
        // Better: Client should ensure Media is in DB? Or we fetch from TMDB here?
        // Let's assume the user is on the details page, so media likely exists if they added to watchlist.
        // If not, we create basic entry.
        media = await prisma.mediaItem.create({
            data: {
                tmdbId,
                type: "TV",
                title: "TV Show", // Placeholder should be updated
            }
        });
    }

    // 2. Ensure Episode exists
    // We use the unique constraint on mediaId+season+episode
    let episode = await prisma.episode.findUnique({
        where: {
            mediaId_seasonNumber_episodeNumber: {
                mediaId: media.id,
                seasonNumber,
                episodeNumber,
            },
        },
    });

    if (!episode) {
        episode = await prisma.episode.create({
            data: {
                mediaId: media.id,
                seasonNumber,
                episodeNumber,
                title,
                overview,
                stillPath,
                airDate: airDate ? new Date(airDate) : null,
            },
        });
    }

    // 3. Create WatchedEpisode
    try {
        await prisma.watchedEpisode.create({
            data: {
                userId: session.user.id,
                episodeId: episode.id,
            }
        });
    } catch (e) {
        // Already watched -> Ignore or toggle? 
        // Let's make this function just MARK AS WATCHED.
        // If needed we can make a toggle function.
        return { success: true, message: "Already watched" };
    }

    // 4. Create Activity
    await prisma.activity.create({
        data: {
            userId: session.user.id,
            mediaId: media.id,
            episodeId: episode.id,
            type: "WATCHED",
            watchedAt: new Date(),
        }
    });

    revalidatePath(`/tv/${tmdbId}`);
    revalidatePath("/profile");

    return { success: true };
}

export async function removeEpisodeWatch(tmdbId: number, seasonNumber: number, episodeNumber: number) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    const media = await prisma.mediaItem.findUnique({ where: { tmdbId } });
    if (!media) return { error: "Medya bulunamadı" };

    const episode = await prisma.episode.findUnique({
        where: {
            mediaId_seasonNumber_episodeNumber: {
                mediaId: media.id,
                seasonNumber,
                episodeNumber,
            }
        }
    });

    if (!episode) return { error: "Bölüm kaydı yok" };

    await prisma.watchedEpisode.deleteMany({
        where: {
            userId: session.user.id,
            episodeId: episode.id,
        }
    });

    // Optional: Remove activity? Usually we keep activity history or delete it too.
    // Let's delete the WATCH activity for this episode.
    await prisma.activity.deleteMany({
        where: {
            userId: session.user.id,
            episodeId: episode.id,
            type: "WATCHED"
        }
    });

    revalidatePath(`/tv/${tmdbId}`);
    return { success: true };
}

export async function getWatchedEpisodes(tmdbId: number) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const media = await prisma.mediaItem.findUnique({ where: { tmdbId } });
    if (!media) return [];

    const watched = await prisma.watchedEpisode.findMany({
        where: {
            userId: session.user.id,
            episode: {
                mediaId: media.id
            }
        },
        include: {
            episode: {
                select: { seasonNumber: true, episodeNumber: true }
            }
        }
    });

    return watched.map(w => ({ s: w.episode.seasonNumber, e: w.episode.episodeNumber }));
}
