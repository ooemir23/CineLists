import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { tmdb } from "@/lib/tmdb";
import { GENRE_MAP } from "@/lib/genres";

import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tmdbId = parseInt(searchParams.get("tmdbId") || "");
    const type = searchParams.get("type"); // MOVIE or TV
    const action = searchParams.get("action"); // PLAN_TO_WATCH
    const shouldRedirect = searchParams.get("redirect") === "true";

    const session = await auth();
    
    // If not logged in, redirect to login with callback
    if (!session?.user?.id) {
        const callbackUrl = encodeURIComponent(request.url);
        return redirect(`/login?callbackUrl=${callbackUrl}`);
    }

    // Rate limit actions per user: max 30 requests per minute
    const rateLimit = checkRateLimit(`media-action:${session.user.id}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
        return new Response("Too many requests", { status: 429 });
    }

    if (!tmdbId || !type || !action || !["MOVIE", "TV"].includes(type) || !["WATCHED", "WATCHING", "PLAN_TO_WATCH"].includes(action)) {
        return new Response("Missing or invalid parameters", { status: 400 });
    }

    let targetUrl = "/";
    let message = "success";

    try {
        // 1. Ensure MediaItem exists
        let media = await prisma.mediaItem.findUnique({
            where: { tmdbId },
        });

        if (!media) {
            const mediaType = type.toLowerCase() as "movie" | "tv";
            const details = await tmdb.getDetails(mediaType, tmdbId.toString());
            
            if (details) {
                const genres = details.genres?.map((g: any) => GENRE_MAP[g.id] || g.name) || [];
                media = await prisma.mediaItem.create({
                    data: {
                        tmdbId,
                        type: type as "MOVIE" | "TV",
                        title: details.title || details.name,
                        posterPath: details.poster_path,
                        genres: genres,
                        voteAverage: details.vote_average || 0,
                        runtime: mediaType === "movie" ? details.runtime : null,
                    },
                });
            }
        }

        if (media) {
            targetUrl = `/${type.toLowerCase()}/${tmdbId}`;
            
            if (action === "WATCHED") {
                // Add to watched
                await prisma.watched.upsert({
                    where: { userId_mediaId: { userId: session.user.id, mediaId: media.id } },
                    update: { watchedAt: new Date() },
                    create: { userId: session.user.id, mediaId: media.id }
                });
                // Remove from toWatch
                await prisma.toWatch.deleteMany({
                    where: { userId: session.user.id, mediaId: media.id }
                });
                message = "watched";
            } else if (action === "WATCHING") {
                // Add to toWatch with status WATCHING
                await prisma.toWatch.upsert({
                    where: { userId_mediaId: { userId: session.user.id, mediaId: media.id } },
                    update: { status: "WATCHING" },
                    create: { userId: session.user.id, mediaId: media.id, status: "WATCHING" }
                });
                // Remove from watched
                await prisma.watched.deleteMany({
                    where: { userId: session.user.id, mediaId: media.id }
                });
                message = "watching";
            } else if (action === "PLAN_TO_WATCH") {
                // Add to toWatch with status PLAN_TO_WATCH
                await prisma.toWatch.upsert({
                    where: { userId_mediaId: { userId: session.user.id, mediaId: media.id } },
                    update: { status: "PLAN_TO_WATCH" },
                    create: { userId: session.user.id, mediaId: media.id, status: "PLAN_TO_WATCH" }
                });
                // Remove from watched
                await prisma.watched.deleteMany({
                    where: { userId: session.user.id, mediaId: media.id }
                });
                message = "added";
            }
        }
    } catch (error) {
        console.error("Email action error details:", error);
    }

    if (shouldRedirect) {
        revalidatePath("/watchlist");
        revalidatePath("/social"); // Revalidate social for activities
        if (targetUrl !== "/") {
            revalidatePath(targetUrl);
            const finalUrl = new URL(targetUrl, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
            finalUrl.searchParams.set("actionMsg", message);
            return redirect(finalUrl.toString().replace(finalUrl.origin, ""));
        }
        return redirect(targetUrl);
    }

    return Response.json({ success: targetUrl !== "/" });
}
