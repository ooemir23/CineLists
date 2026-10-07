"use server";
import { ensureMediaItem } from "@/lib/media-item";

import { mediaKey } from "@/lib/media-key";
import { withUserTransaction } from "@/lib/user-transaction";
import { setVote } from "@/lib/votes";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { checkAndUnlockAchievements } from "@/lib/achievement-actions";

function isPrismaConnectionError(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) return true;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") return true;
    if (error instanceof Error && error.message.includes("Can't reach database server")) return true;
    return false;
}

export async function toggleWatchedStatus(mediaId: number, type: "movie" | "tv", title: string, posterPath: string | null) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) {
        return { error: dict.common.errorOccurred };
    }

    if ((session.user as any).isGuest) {
        return { success: true, isWatched: true };
    }

    try {
        let dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!dbUser && session.user.email) {
            dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
        }

        if (!dbUser) {
            return { error: dict.common.errorOccurred };
        }

        const currentUserId = dbUser.id;

        let media = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId: mediaId } },
        });

        if (!media) {
            // Fetch genres from TMDB
            const details = await tmdb.getDetails(type, mediaId.toString());
            const genres = details.genres?.map((g: any) => g.name) || [];

            media = await ensureMediaItem({
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

        return await withUserTransaction(currentUserId, async tx => {
        // Check current status
        const existingEntry = await tx.watched.findUnique({
            where: {
                userId_mediaId: {
                    userId: currentUserId,
                    mediaId: media!.id,
                },
            },
        });

        const isCurrentlyWatched = !!existingEntry;

        if (isCurrentlyWatched) {
            // Toggle OFF
            await tx.watched.delete({
                where: {
                    userId_mediaId: {
                        userId: currentUserId,
                        mediaId: media!.id,
                    },
                },
            });

            // Remove major WATCHED activities (where episodeId is null) to keep feed clean
            await tx.activity.deleteMany({
                where: {
                    userId: currentUserId,
                    mediaId: media!.id,
                    type: "WATCHED",
                    episodeId: null
                },
            });

            revalidatePath("/watchlist");
            revalidatePath("/feed");
            revalidatePath("/profile");
            revalidatePath(`/${type}/${mediaId}`);

            return { success: true, isWatched: false };

        } else {
            // Toggle ON (Mark as WATCHED)
            // Remove from toWatch if exists
            const toWatch = await tx.toWatch.findUnique({
                where: {
                    userId_mediaId: {
                        userId: currentUserId,
                        mediaId: media!.id,
                    },
                },
            });

            if (toWatch) {
                await tx.toWatch.delete({
                    where: { id: toWatch.id },
                });
            }

            await tx.watched.create({
                data: {
                    userId: currentUserId,
                    mediaId: media!.id,
                },
            });

            const existingActivity = await tx.activity.findFirst({
                where: {
                    userId: currentUserId,
                    mediaId: media!.id,
                    type: "WATCHED",
                    episodeId: null
                },
            });

            if (existingActivity) {
                await tx.activity.update({
                    where: { id: existingActivity.id },
                    data: {
                        watchedAt: new Date(),
                        createdAt: new Date(),
                    }
                });
            } else {
                await tx.activity.create({
                    data: {
                        userId: currentUserId,
                        mediaId: media!.id,
                        type: "WATCHED",
                        watchedAt: new Date(),
                    },
                });
            }

            checkAndUnlockAchievements(currentUserId).catch(console.error);

            revalidatePath("/watchlist");
            revalidatePath("/profile");
            revalidatePath(`/${type}/${mediaId}`);

            return { success: true, isWatched: true };
        }
        });
    } catch (error: any) {
        if (isPrismaConnectionError(error)) {
            return { error: dict.common.errorOccurred };
        }
        return { error: dict.common.errorOccurred };
    }
}

export async function setWatchStatus(mediaId: number, type: "movie" | "tv", title: string, posterPath: string | null, status: "PLAN_TO_WATCH" | "WATCHING" | null): Promise<{ error?: string; success?: boolean }> {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

    try {
        let dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!dbUser && session.user.email) {
            dbUser = await prisma.user.findUnique({
                where: { email: session.user.email },
            });
        }

        if (!dbUser) {
            return { error: dict.common.errorOccurred };
        }

        const currentUserId = dbUser.id;

        let media = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId: mediaId } },
        });

        if (!media) {
            const details = await tmdb.getDetails(type, mediaId.toString());
            const genres = details.genres?.map((g: any) => g.name) || [];

            media = await ensureMediaItem({
                data: {
                    tmdbId: mediaId,
                    type: type === "movie" ? "MOVIE" : "TV",
                    title: title,
                    posterPath: posterPath,
                    genres: genres,
                    voteAverage: details.vote_average || 0,
                    runtime: type === "movie" ? details.runtime : null,
                },
            });
        }

        return await withUserTransaction(currentUserId, async tx => {
        if (status === null) {
            await tx.toWatch.deleteMany({
                where: {
                    userId: currentUserId,
                    mediaId: media!.id,
                },
            });

            revalidatePath("/watchlist");
            revalidatePath("/profile");
            revalidatePath(`/${type}/${mediaId}`);

            return { success: true };
        }

        // Remove from watched if moving to a to-watch state
        await tx.watched.deleteMany({
            where: {
                userId: currentUserId,
                mediaId: media!.id,
            },
        });

        // Upsert toWatch with specific status
        await tx.toWatch.upsert({
            where: {
                userId_mediaId: {
                    userId: currentUserId,
                    mediaId: media!.id,
                },
            },
            update: { status: status as any },
            create: {
                userId: currentUserId,
                mediaId: media!.id,
                status: status as any,
            },
        });

        revalidatePath("/watchlist");
        revalidatePath("/profile");
        revalidatePath(`/${type}/${mediaId}`);

        return { success: true };
        });
    } catch (error: any) {
        if (isPrismaConnectionError(error)) {
            return { error: dict.common.errorOccurred };
        }
        return { error: dict.common.errorOccurred };
    }
}

export async function getWatchStatus(mediaId: number, type: "movie" | "tv" = "movie") {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const media = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId: mediaId } },
        });

        if (!media) return null;

        const watched = await prisma.watched.findUnique({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media!.id,
                },
            },
        });

        if (watched) return "COMPLETED";

        const toWatch = await prisma.toWatch.findUnique({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media!.id,
                },
            },
        });

        if (toWatch) return toWatch.status;

        return null;
    } catch {
        return null;
    }
}


export async function addComment(mediaId: number, type: "movie" | "tv", content: string, title: string, posterPath: string | null, isSpoiler: boolean = false, parentId?: string) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) {
        return { error: dict.common.errorOccurred };
    }

    if ((session.user as any).isGuest) {
        return { success: true };
    }

    try {
        let media = await prisma.mediaItem.findUnique({
            where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId: mediaId } },
        });

        if (!media) {
            // Fetch details from TMDB to get runtime and genres
            const details = await tmdb.getDetails(type, mediaId.toString()).catch(() => null);
            const genres = details?.genres?.map((g: any) => g.name) || [];
            const runtime = type === "movie"
                ? details?.runtime
                : (details?.episode_run_time?.[0] || null);

            media = await ensureMediaItem({
                data: {
                    tmdbId: mediaId,
                    type: type === "movie" ? "MOVIE" : "TV",
                    title: title,
                    posterPath: posterPath,
                    genres: genres,
                    runtime: runtime,
                },
            });
        }

        let currentUserId = session.user.id;
        const userExists = await prisma.user.findUnique({ where: { id: currentUserId }, select: { id: true } });
        if (!userExists && (session.user as any).email) {
            const dbUser = await prisma.user.findUnique({ where: { email: (session.user as any).email }, select: { id: true } });
            if (dbUser) currentUserId = dbUser.id;
        }

        if (parentId) {
            // This is a reply to an existing activity (review)
            const comment = await prisma.comment.create({
                data: {
                    userId: currentUserId,
                    activityId: parentId,
                    content: content,
                    isSpoiler: isSpoiler,
                },
                include: {
                    activity: { select: { userId: true } },
                },
            });

            if (comment.activity && comment.activity.userId !== currentUserId) {
                try {
                    const preview = content.length > 60 ? `${content.slice(0, 60)}...` : content;
                    await prisma.indicates.create({
                        data: {
                            userId: comment.activity.userId,
                            type: "NEW_COMMENT",
                        payload: { kind: "comment", name: session.user.name || "", title, preview: content.slice(0, 60) },
                            message: `${session.user.name || "Birisi"} ${title} hakkındaki incelemene yorum yaptı: "${preview}"`,
                            link: `/${type}/${mediaId}?tab=comments`,
                            image: posterPath,
                        },
                    });
                } catch (notifErr) {
                    console.warn("[Activity] Comment notification warning:", notifErr);
                }
            }
        } else {
            // This is a new top-level review
            await prisma.activity.create({
                data: {
                    userId: currentUserId,
                    mediaId: media!.id,
                    type: "REVIEWED",
                    review: content,
                    isSpoiler: isSpoiler,
                },
            });
        }

        revalidatePath(`/${type}/${mediaId}`);
        revalidatePath("/feed");
        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        if (isPrismaConnectionError(error)) {
            return { error: dict.common.errorOccurred };
        }
        return { error: dict.common.errorOccurred };
    }
}

export async function voteActivity(activityId: string, value: number) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.onboarding.signInRequired };
    try {
        const votes = await setVote(session.user.id, activityId, value, "activity");
        return votes === null ? { error: dict.common.errorOccurred } : { success: true, votes };
    } catch { return { error: dict.common.errorOccurred }; }
}

export async function voteComment(commentId: string, value: number) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.onboarding.signInRequired };
    try {
        const votes = await setVote(session.user.id, commentId, value, "comment");
        return votes === null ? { error: dict.common.errorOccurred } : { success: true, votes };
    } catch { return { error: dict.common.errorOccurred }; }
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
    review?: string;
}) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) {
        return { error: dict.common.errorOccurred };
    }

    if ((session.user as any).isGuest) {
        return { success: true };
    }

    const { tmdbId, type, title, posterPath, rating, watchedAt, watchedWith, recommendedById, recommendedByText, review } = params;

    let media = await prisma.mediaItem.findUnique({
        where: { type_tmdbId: { type: type === "movie" ? "MOVIE" : "TV", tmdbId } },
    });

    if (!media) {
        // Fetch details from TMDB to get runtime and genres
        const details = await tmdb.getDetails(type, tmdbId.toString()).catch(() => null);
        const genres = details?.genres?.map((g: any) => g.name) || [];
        const runtime = type === "movie"
            ? details?.runtime
            : (details?.episode_run_time?.[0] || null);

        media = await ensureMediaItem({
            data: {
                tmdbId,
                type: type === "movie" ? "MOVIE" : "TV",
                title,
                posterPath,
                genres: genres,
                runtime: runtime,
            },
        });
    }

    let currentUserId = session.user.id;
    let dbUser = await prisma.user.findUnique({
        where: { id: currentUserId },
    });

    if (!dbUser && (session.user as any).email) {
        dbUser = await prisma.user.findUnique({
            where: { email: (session.user as any).email },
        });
        if (dbUser) currentUserId = dbUser.id;
    }

    await withUserTransaction(currentUserId, async tx => {
    await tx.toWatch.deleteMany({ where: { userId: currentUserId, mediaId: media!.id } });
    // Update Watched entry
    await tx.watched.upsert({
        where: {
            userId_mediaId: {
                userId: currentUserId,
                mediaId: media!.id,
            },
        },
        update: {
            rating: rating !== undefined ? rating : undefined,
            watchedAt: watchedAt || new Date(),
            recommendedById: recommendedById || null,
            recommendedByText: recommendedByText || null,
        },
        create: {
            userId: currentUserId,
            mediaId: media!.id,
            rating: rating || null,
            watchedAt: watchedAt || new Date(),
            recommendedById: recommendedById || null,
            recommendedByText: recommendedByText || null,
        },
    });

    // Update Activity
    const existingActivity = await tx.activity.findFirst({
        where: {
            userId: currentUserId,
            mediaId: media!.id,
            type: "WATCHED",
            episodeId: null
        },
    });

    if (existingActivity) {
        await tx.activity.update({
            where: { id: existingActivity.id },
            data: {
                rating: rating !== undefined ? rating : undefined,
                watchedAt: watchedAt || new Date(),
                watchedWith: watchedWith ? JSON.stringify(watchedWith) : undefined,
                recommendedById: recommendedById || null,
                recommendedByText: recommendedByText || null,
                review: review !== undefined ? review : undefined,
                createdAt: new Date(),
            }
        });
    } else {
        await tx.activity.create({
            data: {
                userId: currentUserId,
                mediaId: media!.id,
                type: "WATCHED",
                rating: rating || null,
                watchedAt: watchedAt || new Date(),
                watchedWith: watchedWith ? JSON.stringify(watchedWith) : null,
                recommendedById: recommendedById || null,
                recommendedByText: recommendedByText || null,
                review: review || null,
            }
        });
    }

    });

    // Create notification for the recommender if applicable
    if (recommendedById && recommendedById !== currentUserId) {
        try {
            await prisma.indicates.create({
                data: {
                    userId: recommendedById,
                    type: "NEW_RECOMMENDATION",
                        payload: { kind: "watchThanks", name: session.user.name || "", title },
                    message: `${session.user.name || "Birisi"} tavsiye ettiğin ${title} içeriğini izledi!`,
                    link: `/profile/${currentUserId}`,
                    image: posterPath,
                }
            });
        } catch {
            // Recommender might not exist or connection hiccup
        }
    }

    revalidatePath("/watchlist");
    revalidatePath("/watched");
    revalidatePath("/profile");
    revalidatePath(`/${type}/${tmdbId}`);

    return { success: true };
}

export async function getMediaMetadataBulk(items: { id: number; type: "movie" | "tv" }[]) {
    if (!Array.isArray(items) || !items.length || items.length > 100) return {};
    try {
        const mediaItems = await prisma.mediaItem.findMany({
            where: { tmdbId: { in: items.map(item => item.id) } },
            select: { tmdbId: true, type: true, runtime: true }
        });
        const metadataMap: Record<string, { runtime: number | null }> = {};
        for (const item of items) {
            const stored = mediaItems.find(row => row.tmdbId === item.id && row.type === item.type.toUpperCase());
            if (stored) metadataMap[mediaKey(item.id, item.type)] = { runtime: stored.runtime };
        }
        const missing = items.filter(item => !metadataMap[mediaKey(item.id, item.type)]?.runtime);
        if (missing.length) {
            after(async () => {
                const { refreshMediaRuntime } = await import("@/lib/media-runtime");
                await Promise.all(missing.map(item => refreshMediaRuntime(item)));
            });
        }
        return metadataMap;
    } catch (error) {
        console.error("Get bulk media metadata error:", error);
        return {};
    }
}

export async function updateComment(activityId: string, content: string, isSpoiler: boolean) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { userId: true, mediaId: true, media: { select: { tmdbId: true, type: true } } }
    });

    if (!activity || activity.userId !== session.user.id) {
        return { error: dict.common.errorOccurred };
    }

    await prisma.activity.update({
        where: { id: activityId },
        data: { 
            review: content,
            isSpoiler: isSpoiler,
            createdAt: new Date()
        }
    });

    const type = activity.media.type.toLowerCase();
    revalidatePath(`/${type}/${activity.media.tmdbId}`);
    revalidatePath("/feed");
    return { success: true };
}

export async function deleteComment(activityId: string) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { userId: true, mediaId: true, media: { select: { tmdbId: true, type: true } } }
    });

    if (!activity || activity.userId !== session.user.id) {
        return { error: dict.common.errorOccurred };
    }

    await prisma.activity.delete({
        where: { id: activityId }
    });

    const type = activity.media.type.toLowerCase();
    revalidatePath(`/${type}/${activity.media.tmdbId}`);
    revalidatePath("/feed");
    return { success: true };
}
