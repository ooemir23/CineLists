"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

function isPrismaConnectionError(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) return true;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") return true;
    if (error instanceof Error && error.message.includes("Can't reach database server")) return true;
    return false;
}

export async function toggleWatchedStatus(mediaId: number, type: "movie" | "tv", title: string, posterPath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    if ((session.user as any).isGuest) {
        return { success: true, isWatched: true };
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

        // Remove major WATCHED activities (where episodeId is null) to keep feed clean
        await prisma.activity.deleteMany({
            where: {
                userId: session.user.id,
                mediaId: media.id,
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

        const existingActivity = await prisma.activity.findFirst({
            where: {
                userId: session.user.id,
                mediaId: media.id,
                type: "WATCHED",
                episodeId: null
            },
        });

        if (existingActivity) {
            await prisma.activity.update({
                where: { id: existingActivity.id },
                data: {
                    watchedAt: new Date(),
                    createdAt: new Date(),
                }
            });
        } else {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    mediaId: media.id,
                    type: "WATCHED",
                    watchedAt: new Date(),
                },
            });
        }


        revalidatePath("/watchlist");
        revalidatePath("/profile");
        revalidatePath(`/${type}/${mediaId}`);

        return { success: true, isWatched: true };
    }
}

export async function setWatchStatus(mediaId: number, type: "movie" | "tv", title: string, posterPath: string | null, status: "PLAN_TO_WATCH" | "WATCHING" | null) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
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
                runtime: type === "movie" ? details.runtime : null,
            },
        });
    }

    if (status === null) {
        await prisma.toWatch.deleteMany({
            where: {
                userId: session.user.id,
                mediaId: media.id,
            },
        });

        revalidatePath("/watchlist");
        revalidatePath("/profile");
        revalidatePath(`/${type}/${mediaId}`);

        return { success: true };
    }

    // Remove from watched if moving to a to-watch state
    await prisma.watched.deleteMany({
        where: {
            userId: session.user.id,
            mediaId: media.id,
        },
    });

    // Upsert toWatch with specific status
    await prisma.toWatch.upsert({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id,
            },
        },
        update: { status: status as any },
        create: {
            userId: session.user.id,
            mediaId: media.id,
            status: status as any,
        },
    });

    revalidatePath("/watchlist");
    revalidatePath("/profile");
    revalidatePath(`/${type}/${mediaId}`);

    return { success: true };
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

    if (toWatch) return toWatch.status;

    return null;
}


export async function addComment(mediaId: number, type: "movie" | "tv", content: string, title: string, posterPath: string | null, isSpoiler: boolean = false, parentId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    if ((session.user as any).isGuest) {
        return { success: true };
    }

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        // Fetch details from TMDB to get runtime and genres
        const details = await tmdb.getDetails(type, mediaId.toString()).catch(() => null);
        const genres = details?.genres?.map((g: any) => g.name) || [];
        const runtime = type === "movie"
            ? details?.runtime
            : (details?.episode_run_time?.[0] || null);

        media = await prisma.mediaItem.create({
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

    if (parentId) {
        // This is a reply to an existing activity (review)
        await prisma.comment.create({
            data: {
                userId: session.user.id,
                activityId: parentId,
                content: content,
                isSpoiler: isSpoiler,
            },
        });
    } else {
        // This is a new top-level review
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                mediaId: media.id,
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
}

export async function voteActivity(activityId: string, increment: number) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    await prisma.activity.update({
        where: { id: activityId },
        data: { votes: { increment } }
    });

    return { success: true };
}

export async function voteComment(commentId: string, increment: number) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    await prisma.comment.update({
        where: { id: commentId },
        data: { votes: { increment } }
    });

    return { success: true };
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
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    if ((session.user as any).isGuest) {
        return { success: true };
    }

    const { tmdbId, type, title, posterPath, rating, watchedAt, watchedWith, recommendedById, recommendedByText, review } = params;

    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId },
    });

    if (!media) {
        // Fetch details from TMDB to get runtime and genres
        const details = await tmdb.getDetails(type, tmdbId.toString()).catch(() => null);
        const genres = details?.genres?.map((g: any) => g.name) || [];
        const runtime = type === "movie"
            ? details?.runtime
            : (details?.episode_run_time?.[0] || null);

        media = await prisma.mediaItem.create({
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
    const existingActivity = await prisma.activity.findFirst({
        where: {
            userId: session.user.id,
            mediaId: media.id,
            type: "WATCHED",
            episodeId: null
        },
    });

    if (existingActivity) {
        await prisma.activity.update({
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
        await prisma.activity.create({
            data: {
                userId: session.user.id,
                mediaId: media.id,
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

    // Create notification for the recommender if applicable
    if (recommendedById && recommendedById !== session.user.id) {
        await prisma.indicates.create({
            data: {
                userId: recommendedById,
                type: "NEW_RECOMMENDATION",
                message: `${session.user.name || "Birisi"} tavsiye ettiğin ${title} içeriğini izledi!`,
                link: `/profile/${session.user.id}`,
                image: posterPath,
            }
        });
    }

    revalidatePath("/watchlist");
    revalidatePath("/watched");
    revalidatePath("/profile");
    revalidatePath(`/${type}/${tmdbId}`);

    return { success: true };
}

export async function getMediaMetadataBulk(items: { id: number; type: "movie" | "tv" }[]) {
    if (items.length === 0) return {};

    const tmdbIds = items.map(i => i.id);

    const getRuntimeFromDetails = (details: any, type: "movie" | "tv") => {
        if (type === "movie") {
            return (typeof details.runtime === "number" && details.runtime > 0) ? details.runtime : null;
        }

        const runtime = (details.episode_run_time && details.episode_run_time.length > 0)
            ? details.episode_run_time[0]
            : (details.last_episode_to_air?.runtime || details.next_episode_to_air?.runtime || details.runtime || null);

        return (typeof runtime === "number" && runtime > 0) ? runtime : null;
    };

    const buildMetadataFromTmdb = async (targetItems: { id: number; type: "movie" | "tv" }[]) => {
        const metadataMap: Record<number, { runtime?: number | null }> = {};

        const fetched = await Promise.all(
            targetItems.map(async (item) => {
                try {
                    const details = await tmdb.getDetails(item.type, item.id.toString());
                    return { id: item.id, runtime: getRuntimeFromDetails(details, item.type) };
                } catch {
                    return { id: item.id, runtime: null };
                }
            })
        );

        fetched.forEach((res) => {
            metadataMap[res.id] = { runtime: res.runtime };
        });

        return metadataMap;
    };

    try {
        // 1. Get existing data from DB
        let mediaItems: Array<{ tmdbId: number; runtime: number | null }> = [];

        try {
            mediaItems = await prisma.mediaItem.findMany({
                where: {
                    tmdbId: { in: tmdbIds },
                    runtime: { not: null }
                },
                select: {
                    tmdbId: true,
                    runtime: true
                }
            });
        } catch (error) {
            if (isPrismaConnectionError(error)) {
                return buildMetadataFromTmdb(items);
            }
            throw error;
        }

        const metadataMap: Record<number, { runtime?: number | null }> = {};
        mediaItems.forEach(item => {
            metadataMap[item.tmdbId] = { runtime: item.runtime };
        });

        // 2. Identify missing ones
        const missingItems = items.filter(item => !metadataMap[item.id]);

        if (missingItems.length > 0) {
            // Fetch missing from TMDB in parallel
            const fetchedResults = await Promise.all(
                missingItems.map(async (item) => {
                    try {
                        const details = await tmdb.getDetails(item.type, item.id.toString());

                        const validRuntime = getRuntimeFromDetails(details, item.type);

                        try {
                            // Save/Update in DB for future requests when DB is reachable.
                            await prisma.mediaItem.upsert({
                                where: { tmdbId: item.id },
                                update: { runtime: validRuntime },
                                create: {
                                    tmdbId: item.id,
                                    type: item.type === "movie" ? "MOVIE" : "TV",
                                    title: details.title || details.name || "Tarih Bekleniyor",
                                    posterPath: details.poster_path,
                                    genres: details.genres?.map((g: any) => g.name) || [],
                                    runtime: validRuntime
                                }
                            });
                        } catch (error) {
                            if (!isPrismaConnectionError(error)) {
                                throw error;
                            }
                        }

                        return { id: item.id, runtime: validRuntime };
                    } catch (e) {
                        console.error(`Failed to fetch runtime for ${item.type} ${item.id}:`, e);
                        return { id: item.id, runtime: null };
                    }
                })
            );

            fetchedResults.forEach(res => {
                metadataMap[res.id] = { runtime: res.runtime };
            });
        }

        return metadataMap;
    } catch (error) {
        console.error("Get bulk media metadata error:", error);
        return {};
    }
}

export async function updateComment(activityId: string, content: string, isSpoiler: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { userId: true, mediaId: true, media: { select: { tmdbId: true, type: true } } }
    });

    if (!activity || activity.userId !== session.user.id) {
        return { error: "Bu yorumu düzenleme yetkiniz yok" };
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
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    const activity = await prisma.activity.findUnique({
        where: { id: activityId },
        select: { userId: true, mediaId: true, media: { select: { tmdbId: true, type: true } } }
    });

    if (!activity || activity.userId !== session.user.id) {
        return { error: "Bu yorumu silme yetkiniz yok" };
    }

    await prisma.activity.delete({
        where: { id: activityId }
    });

    const type = activity.media.type.toLowerCase();
    revalidatePath(`/${type}/${activity.media.tmdbId}`);
    revalidatePath("/feed");
    return { success: true };
}
