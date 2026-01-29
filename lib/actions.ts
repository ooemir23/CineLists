"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";

export async function toggleToWatch(mediaId: number, type: "movie" | "tv" | "person", title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    if ((session.user as any).isGuest) {
        return { success: true, inWatchlist: true };
    }

    // Verify user exists in DB
    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!dbUser) {
        return { error: "Oturum geçersiz, lütfen tekrar giriş yapın." };
    }

    // Ensure media exists in our DB
    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        let genres: string[] = [];
        let details: any = null;
        if (type !== "person") {
            // Fetch genres from TMDB
            details = await tmdb.getDetails(type, mediaId.toString());
            genres = details.genres?.map((g: any) => g.name) || [];
        }

        media = await prisma.mediaItem.create({
            data: {
                tmdbId: mediaId,
                type: type === "movie" ? "MOVIE" : type === "tv" ? "TV" : "PERSON",
                title: title,
                posterPath: posterPath,
                genres: genres,
                voteAverage: type !== "person" ? details?.vote_average || 0 : 0,
                runtime: type === "movie" ? details?.runtime : null, // Only save runtime for movies
            },
        });
    }

    // Check if already in toWatch
    const existing = await prisma.toWatch.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    if (existing) {
        await prisma.toWatch.delete({
            where: { id: existing.id },
        });

        // Remove the ADDED_TO_LIST activity to keep feed clean
        const lastActivity = await prisma.activity.findFirst({
            where: {
                userId: session.user.id,
                mediaId: media.id,
                type: "ADDED_TO_LIST",
            },
            orderBy: { createdAt: "desc" },
        });

        if (lastActivity) {
            await prisma.activity.delete({
                where: { id: lastActivity.id },
            });
        }

        revalidatePath("/watchlist");
        revalidatePath("/feed");
        revalidatePath(`/movie/${mediaId}`);
        revalidatePath(`/tv/${mediaId}`);
        return { added: false };
    } else {
        // Remove from watched if it exists there (exclusive)
        const watched = await prisma.watched.findUnique({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media.id,
                },
            },
        });

        if (watched) {
            await prisma.watched.delete({
                where: { id: watched.id },
            });

            // Also remove WATCHED activities for this show/movie
            await prisma.activity.deleteMany({
                where: {
                    userId: session.user.id,
                    mediaId: media.id,
                    type: "WATCHED",
                    episodeId: null
                }
            });
        }

        await prisma.toWatch.create({
            data: {
                userId: session.user.id,
                mediaId: media.id,
            },
        });
        revalidatePath("/watchlist");
        revalidatePath(`/movie/${mediaId}`);
        revalidatePath(`/tv/${mediaId}`);
        return { added: true };
    }
}

export async function getToWatchStatus(mediaId: number) {
    const session = await auth();
    if (!session?.user?.id) return false;

    const media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) return false;

    const item = await prisma.toWatch.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    return !!item;
}


