"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";

export async function toggleWatchedStatus(mediaId: number, type: "movie" | "tv", title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!dbUser) {
        return { error: "Oturum geçersiz, lütfen tekrar giriş yapın." };
    }

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        // Fetch genres from TMDB
        const details = await tmdb.getDetails(type, mediaId.toString());
        const genres = details.genres?.map((g: any) => g.name) || [];

        media = await prisma.mediaItem.create({
            data: {
                tmdbId: mediaId,
                type: type === "movie" ? "MOVIE" : "TV",
                title: title,
                posterPath: posterPath,
                genres: genres,
                voteAverage: details.vote_average || 0,
                runtime: type === "movie" ? details.runtime : null, // Only save runtime for movies
            },
        });
    }

    // Check current status
    const existingEntry = await prisma.watched.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    const isCurrentlyWatched = !!existingEntry;

    if (isCurrentlyWatched) {
        // Toggle OFF
        await prisma.watched.delete({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media.id,
                },
            },
        });

        // Optional: Remove the last 'WATCHED' activity to keep feed clean
        const lastActivity = await prisma.activity.findFirst({
            where: {
                userId: session.user.id,
                mediaId: media.id,
                type: "WATCHED",
            },
            orderBy: { createdAt: "desc" },
        });

        if (lastActivity) {
            await prisma.activity.delete({
                where: { id: lastActivity.id },
            });
        }

        revalidatePath("/watchlist");
        revalidatePath("/profile");
        revalidatePath(`/${type}/${mediaId}`);

        return { success: true, isWatched: false };

    } else {
        // Toggle ON (Mark as WATCHED)
        // Remove from toWatch if exists
        const toWatch = await prisma.toWatch.findUnique({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media.id,
                },
            },
        });

        if (toWatch) {
            await prisma.toWatch.delete({
                where: { id: toWatch.id },
            });
        }

        await prisma.watched.create({
            data: {
                userId: session.user.id,
                mediaId: media.id,
            },
        });

        await prisma.activity.upsert({
            where: {
                userId_mediaId_type: {
                    userId: session.user.id,
                    mediaId: media.id,
                    type: "WATCHED",
                },
            },
            update: {
                watchedAt: new Date(),
                createdAt: new Date(), // Reset creation time to show at top of feed
            },
            create: {
                userId: session.user.id,
                mediaId: media.id,
                type: "WATCHED",
                watchedAt: new Date(),
            },
        });


        revalidatePath("/watchlist");
        revalidatePath("/profile");
        revalidatePath(`/${type}/${mediaId}`);

        return { success: true, isWatched: true };
    }
}

export async function getWatchStatus(mediaId: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) return null;

    const watched = await prisma.watched.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    if (watched) return "COMPLETED";

    const toWatch = await prisma.toWatch.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
    });

    if (toWatch) return "PLAN_TO_WATCH";

    return null;
}


export async function addComment(mediaId: number, type: "movie" | "tv", content: string, title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        media = await prisma.mediaItem.create({
            data: {
                tmdbId: mediaId,
                type: type === "movie" ? "MOVIE" : "TV",
                title: title,
                posterPath: posterPath,
            },
        });
    }

    const activity = await prisma.activity.create({
        data: {
            userId: session.user.id,
            mediaId: media.id,
            type: "REVIEWED",
            review: content,
        },
    });

    revalidatePath(`/${type}/${mediaId}`);
    return { success: true, activity };
}

export async function saveWatchDetails(params: {
    tmdbId: number;
    type: "movie" | "tv";
    title: string;
    posterPath: string | null;
    rating?: number;
    watchedAt?: Date;
    watchedWith?: string[]; // Array of user IDs or names
    recommendedById?: string;
    recommendedByText?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    const { tmdbId, type, title, posterPath, rating, watchedAt, watchedWith, recommendedById, recommendedByText } = params;

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId },
    });

    if (!media) {
        media = await prisma.mediaItem.create({
            data: {
                tmdbId,
                type: type === "movie" ? "MOVIE" : "TV",
                title,
                posterPath,
            },
        });
    }

    // Update Watched entry
    await prisma.watched.upsert({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
        update: {
            rating: rating !== undefined ? rating : undefined,
            watchedAt: watchedAt || new Date(),
            recommendedById: recommendedById || null,
            recommendedByText: recommendedByText || null,
        },
        create: {
            userId: session.user.id,
            mediaId: media.id,
            rating: rating || null,
            watchedAt: watchedAt || new Date(),
            recommendedById: recommendedById || null,
            recommendedByText: recommendedByText || null,
        },
    });

    // Update Activity
    await prisma.activity.upsert({
        where: {
            userId_mediaId_type: {
                userId: session.user.id,
                mediaId: media.id,
                type: "WATCHED",
            },
        },
        update: {
            rating: rating !== undefined ? rating : undefined,
            watchedAt: watchedAt || new Date(),
            watchedWith: watchedWith ? JSON.stringify(watchedWith) : undefined,
            recommendedById: recommendedById || null,
            recommendedByText: recommendedByText || null,
            createdAt: new Date(),
        },
        create: {
            userId: session.user.id,
            mediaId: media.id,
            type: "WATCHED",
            rating: rating || null,
            watchedAt: watchedAt || new Date(),
            watchedWith: watchedWith ? JSON.stringify(watchedWith) : null,
            recommendedById: recommendedById || null,
            recommendedByText: recommendedByText || null,
        },
    });

    // Remove from toWatch if exists
    await prisma.toWatch.deleteMany({
        where: {
            userId: session.user.id,
            mediaId: media.id,
        },
    });

    revalidatePath("/watchlist");
    revalidatePath("/watched");
    revalidatePath("/profile");
    revalidatePath(`/${type}/${tmdbId}`);

    return { success: true };
}
