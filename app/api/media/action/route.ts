import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { tmdb } from "@/lib/tmdb";
import { GENRE_MAP } from "@/lib/genres";

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

    if (!tmdbId || !type || !action) {
        return new Response("Missing parameters", { status: 400 });
    }

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
            // 2. Add to ToWatch (Watchlist) if it doesn't exist
            const existing = await prisma.toWatch.findUnique({
                where: {
                    userId_mediaId: {
                        userId: session.user.id,
                        mediaId: media.id,
                    },
                },
            });

            if (!existing) {
                // Remove from watched first if it exists
                await prisma.watched.deleteMany({
                    where: { userId: session.user.id, mediaId: media.id }
                });

                await prisma.toWatch.create({
                    data: {
                        userId: session.user.id,
                        mediaId: media.id,
                    },
                });
            }
        }

        if (shouldRedirect) {
            revalidatePath("/watchlist");
            revalidatePath(`/${type.toLowerCase()}/${tmdbId}`);
            return redirect(`/${type.toLowerCase()}/${tmdbId}`);
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error("Email action error:", error);
        return redirect("/");
    }
}
