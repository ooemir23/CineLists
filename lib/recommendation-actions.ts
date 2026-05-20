"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { revalidatePath } from "next/cache";
import { sendRecommendationEmail } from "@/lib/mail";
import { checkAndUnlockAchievements } from "@/lib/achievement-actions";

export async function recommendMedia(params: {
    receiverId: string; // This can now be a userId or an email
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

    const { receiverId: receiverIdOrEmail, mediaId, mediaType, title, posterPath, message } = params;

    // Check if input is an email
    const isEmail = receiverIdOrEmail.includes("@");
    
    // Try to find receiver by ID or Email
    let receiver = await prisma.user.findFirst({
        where: isEmail 
            ? { email: receiverIdOrEmail } 
            : { id: receiverIdOrEmail },
        select: { id: true, email: true, name: true }
    });

    const sender = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { image: true }
    });

    // Ensure MediaItem exists in DB
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

    // Determine the target email
    const targetEmail = receiver?.email || (isEmail ? receiverIdOrEmail : null);

    // If we have a registered user, record the recommendation in DB
    if (receiver) {
        await prisma.recommendation.create({
            data: {
                senderId: session.user.id,
                receiverId: receiver.id,
                mediaId: media.id,
                message: message || null,
            },
        });

        // Create Notification
        await prisma.indicates.create({
            data: {
                userId: receiver.id,
                type: "NEW_RECOMMENDATION",
                message: `${session.user.name || "Birisi"} sana bir ${mediaType === "movie" ? "film" : "dizi"} tavsiye etti: ${title}`,
                link: `/${mediaType}/${mediaId}`,
            },
        });

        checkAndUnlockAchievements(session.user.id).catch(console.error);
    }

    // Fetch extra details for the email
    const [details, providers, senderWatched] = await Promise.all([
        tmdb.getDetails(mediaType, mediaId.toString()).catch(() => null),
        tmdb.getWatchProviders(mediaType, mediaId.toString()).catch(() => null),
        prisma.watched.findUnique({
            where: {
                userId_mediaId: {
                    userId: session.user.id,
                    mediaId: media.id
                }
            },
            select: { rating: true }
        })
    ]);

    // Send Email Notification if we have an email address
    if (targetEmail) {
        const trProviders = providers?.results?.TR?.flatrate?.map((p: any) => ({
            name: p.provider_name,
            logo: p.logo_path
        })) || [];

        try {
            await sendRecommendationEmail({
                email: targetEmail,
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
            console.error("Recommendation email error:", { error: error.message, targetEmail });
        }
    }

    revalidatePath("/feed");
    return { success: true };
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
