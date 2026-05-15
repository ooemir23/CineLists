"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";
import { sendRecommendationEmail } from "@/lib/mail";

export async function recommendMedia(params: {
    receiverId: string;
    mediaId: number;
    mediaType: "movie" | "tv";
    title: string;
    posterPath: string | null;
    message?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: "Tavsiye göndermek için giriş yapmalısınız" };
    }

    const { receiverId, mediaId, mediaType, title, posterPath, message } = params;

    const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { email: true, name: true }
    });

    // 0.1 Get sender info
    const sender = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true }
    });

    // 1. Ensure MediaItem exists in DB
    let media = await prisma.mediaItem.findUnique({
        where: { tmdbId: mediaId },
    });

    if (!media) {
        media = await prisma.mediaItem.create({
            data: {
                tmdbId: mediaId,
                type: mediaType === "movie" ? "MOVIE" : "TV",
                title: title,
                posterPath: posterPath,
                genres: [],
                voteAverage: 0,
            },
        });
    }

    // 2. Create Recommendation
    const recommendation = await prisma.recommendation.create({
        data: {
            senderId: session.user.id,
            receiverId,
            mediaId: media.id,
            message: message || null,
        },
    });

    // 2.1 Get sender's rating for this media (if any)
    const senderWatched = await prisma.watched.findUnique({
        where: {
            userId_mediaId: {
                userId: session.user.id,
                mediaId: media.id
            }
        },
        select: { rating: true }
    });

    // 3. Create Notification
    await prisma.indicates.create({
        data: {
            userId: receiverId,
            type: "NEW_RECOMMENDATION",
            message: `${session.user.name || "Birisi"} sana bir ${mediaType === "movie" ? "film" : "dizi"} tavsiye etti: ${title}`,
            link: `/${mediaType}/${mediaId}`,
        },
    });

    // 4. Send Email Notification
    if (receiver?.email) {
        // Fetch extra details for a richer email
        const [details, providers] = await Promise.all([
            tmdb.getDetails(mediaType, mediaId.toString()).catch(() => null),
            tmdb.getWatchProviders(mediaType, mediaId.toString()).catch(() => null)
        ]);

        const trProviders = providers?.results?.TR?.flatrate?.map((p: any) => ({
            name: p.provider_name,
            logo: p.logo_path
        })) || [];

        // Await email to ensure it's sent before the function finishes (important for serverless)
        try {
            await sendRecommendationEmail({
                email: receiver.email,
                senderName: session.user.name || "Bir arkadaşın",
                senderImage: sender?.image,
                mediaTitle: title,
                mediaType,
                mediaId,
                posterPath,
                message,
                overview: details?.overview,
                runtime: mediaType === "movie" ? details?.runtime : (details?.episode_run_time?.[0] || null),
                platforms: trProviders,
                senderRating: senderWatched?.rating,
                globalRating: details?.vote_average,
                backdropPath: details?.backdrop_path
            });
        } catch (error: any) {
            console.error("Recommendation email error details:", {
                error: error.message,
                stack: error.stack,
                email: receiver.email,
                mediaTitle: title
            });
        }
    }

    revalidatePath("/feed");
    return { success: true, recommendation };
}

export async function getReceivedRecommendation(tmdbId: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const recommendation = await prisma.recommendation.findFirst({
        where: {
            receiverId: session.user.id,
            media: {
                tmdbId: tmdbId
            }
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return recommendation;
}
