"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { tmdb } from "@/lib/tmdb";
import { Prisma } from "@prisma/client";

function isPrismaConnectionError(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) return true;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") return true;
    if (error instanceof Error && error.message.includes("Can't reach database server")) return true;
    return false;
}

export async function rateMedia(tmdbId: number, type: "movie" | "tv", rating: number, title?: string, posterPath?: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Giriş yapmalısınız" };
    }

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { success: false, error: "Puanlama yapmak için giriş yapmalısınız" };
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!dbUser) {
        return { success: false, error: "Oturum geçersiz, lütfen tekrar giriş yapın." };
    }

    if (rating < 0 || rating > 10) {
        return { success: false, error: "Puan 0 ile 10 arasında olmalıdır." };
    }

    try {
        // Find or create MediaItem
        let mediaItem = await prisma.mediaItem.findUnique({
            where: { tmdbId },
        });

        if (!mediaItem) {
            // If movie/tv title wasn't provided, fetch it
            let finalTitle = title;
            let finalPoster = posterPath;
            let genres: string[] = [];
            let runtime: number | null = null;

            if (!finalTitle) {
                const details = await tmdb.getDetails(type, tmdbId.toString()).catch(() => null);
                if (details) {
                    finalTitle = details.title || details.name;
                    finalPoster = details.poster_path;
                    genres = details.genres?.map((g: any) => g.name) || [];
                    runtime = type === "movie" ? details.runtime : (details.episode_run_time?.[0] || null);
                }
            }

            if (!finalTitle) {
                return { success: false, error: "Medya bilgileri alınamadı." };
            }

            mediaItem = await prisma.mediaItem.create({
                data: {
                    tmdbId,
                    type: type === "movie" ? "MOVIE" : "TV",
                    title: finalTitle,
                    posterPath: finalPoster,
                    genres: genres,
                    runtime: runtime,
                },
            });
        }

        // Update/Create Watched entry with rating
        await prisma.watched.upsert({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: mediaItem.id,
                },
            },
            update: {
                rating: rating,
            },
            create: {
                userId: session.user.id,
                mediaId: mediaItem.id,
                rating: rating,
            },
        });

        // Also create/update Activity for social feed
        const existingActivity = await prisma.activity.findFirst({
            where: {
                userId: session.user.id,
                mediaId: mediaItem.id,
                type: "RATED",
                episodeId: null
            },
        });

        if (existingActivity) {
            await prisma.activity.update({
                where: { id: existingActivity.id },
                data: {
                    rating,
                    createdAt: new Date(),
                }
            });
        } else {
            await prisma.activity.create({
                data: {
                    userId: session.user.id,
                    mediaId: mediaItem.id,
                    type: "RATED",
                    rating,
                }
            });
        }

        revalidatePath(`/${type}/${tmdbId}`);
        revalidatePath("/profile");
        revalidatePath("/stats");

        return { success: true };
    } catch (error) {
        console.error("Rate media error:", error);
        return { success: false, error: "Puanlama işlemi başarısız oldu." };
    }
}

export async function getUserRating(tmdbId: number, type: "movie" | "tv") {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { tmdbId },
            include: {
                watchedBy: {
                    where: { userId: session.user.id },
                    select: { rating: true },
                },
            },
        });

        return mediaItem?.watchedBy[0]?.rating ?? null;
    } catch (error) {
        console.error("Get user rating error:", error);
        return null;
    }
}

export async function getFriendsRatings(tmdbId: number, type: "movie" | "tv") {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { tmdbId },
        });

        if (!mediaItem) return [];

        // Get friends (people I follow)
        const following = await prisma.follow.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        });

        const friendIds = following.map((f: { followingId: string }) => f.followingId);

        // Get ratings from friends (Now from Watched table)
        const ratings = await prisma.watched.findMany({
            where: {
                mediaId: mediaItem.id,
                userId: { in: friendIds },
                rating: { not: null },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: {
                rating: "desc",
            },
        });

        return ratings.map((r: any) => ({
            userId: r.user.id,
            userName: r.user.name,
            userImage: r.user.image,
            rating: r.rating,
        }));
    } catch (error) {
        console.error("Get friends ratings error:", error);
        return [];
    }
}

export async function getUserRatingsBulk(tmdbIds: number[]) {
    const session = await auth();
    if (!session?.user?.id || tmdbIds.length === 0) {
        return {};
    }

    try {
        const ratings = await prisma.watched.findMany({
            where: {
                userId: session.user.id,
                media: {
                    tmdbId: { in: tmdbIds }
                },
                rating: { not: null }
            },
            select: {
                rating: true,
                media: {
                    select: { tmdbId: true }
                }
            }
        });

        const ratingsMap: Record<number, number> = {};
        ratings.forEach(r => {
            ratingsMap[r.media.tmdbId] = r.rating!;
        });

        return ratingsMap;
    } catch (error) {
        if (isPrismaConnectionError(error)) {
            return {};
        }
        console.error("Get bulk user ratings error:", error);
        return {};
    }
}

export async function getCommunityRatingsBulk(tmdbIds: number[]) {
    if (tmdbIds.length === 0) return {};

    try {
        const ratings = await prisma.watched.findMany({
            where: {
                media: { tmdbId: { in: tmdbIds } },
                rating: { not: null }
            },
            select: {
                rating: true,
                media: { select: { tmdbId: true } }
            }
        });

        const statsMap: Record<number, { average: number; count: number }> = {};

        ratings.forEach(r => {
            const id = r.media.tmdbId;
            if (!statsMap[id]) {
                statsMap[id] = { average: 0, count: 0 };
            }
            statsMap[id].count++;
            statsMap[id].average += r.rating!;
        });

        Object.keys(statsMap).forEach(key => {
            const id = Number(key);
            statsMap[id].average = Number((statsMap[id].average / statsMap[id].count).toFixed(1));
        });

        return statsMap;
    } catch (error) {
        if (isPrismaConnectionError(error)) {
            return {};
        }
        console.error("Get bulk community ratings error:", error);
        return {};
    }
}

export async function getAllMediaRatings(tmdbId: number) {
    try {
        const mediaItem = await prisma.mediaItem.findUnique({
            where: { tmdbId },
        });

        if (!mediaItem) return [];

        const ratings = await prisma.watched.findMany({
            where: {
                mediaId: mediaItem.id,
                rating: { not: null },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    },
                },
            },
            orderBy: {
                rating: "desc",
            },
        });

        return ratings.map(r => ({
            userId: r.user.id,
            userName: r.user.name,
            username: r.user.username,
            userImage: r.user.image,
            rating: r.rating,
        }));
    } catch (error) {
        console.error("Get all media ratings error:", error);
        return [];
    }
}
