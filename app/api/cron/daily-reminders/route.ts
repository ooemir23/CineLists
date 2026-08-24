import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { sendDailyReminderEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Security check: Only allow if a secret key matches or if it's a known cron service
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || key !== cronSecret) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        console.log("Starting daily reminders cron job...");
        const today = new Date().toISOString().split("T")[0];

        // 1. Get all unique TV show IDs that users are interested in (WATCHING or TO_WATCH)
        const watchingShows = await prisma.watched.findMany({
            where: { media: { type: "TV" } },
            select: { media: { select: { tmdbId: true } } }
        });

        const toWatchShows = await prisma.toWatch.findMany({
            where: { media: { type: "TV" } },
            select: { media: { select: { tmdbId: true } } }
        });

        const allShowIds = Array.from(new Set([
            ...watchingShows.map(s => s.media.tmdbId),
            ...toWatchShows.map(s => s.media.tmdbId)
        ]));

        console.log(`Found ${allShowIds.length} unique TV shows to check.`);

        // 2. Check which shows have episodes today
        // We'll do this in batches to avoid TMDB rate limits
        const showsWithEpisodesToday: any[] = [];
        
        for (const tmdbId of allShowIds) {
            const details = await tmdb.getTVShow(tmdbId.toString());
            const nextEpisode = details?.next_episode_to_air;

            if (nextEpisode && nextEpisode.air_date === today) {
                const providers = await tmdb.getWatchProviders("tv", tmdbId.toString());
                const trProviders = providers?.results?.TR?.flatrate?.map((p: any) => p.provider_name) || [];

                showsWithEpisodesToday.push({
                    tmdbId,
                    title: details.name,
                    posterPath: details.poster_path,
                    episodeInfo: `${nextEpisode.season_number}. Sezon ${nextEpisode.episode_number}. Bölüm`,
                    platforms: trProviders
                });
            }
        }

        console.log(`Found ${showsWithEpisodesToday.length} shows airing today.`);

        if (showsWithEpisodesToday.length === 0) {
            return NextResponse.json({ message: "No shows airing today for any user." });
        }

        // 3. Find users who follow these shows and send emails
        const users = await prisma.user.findMany({
            where: { email: { not: null } },
            select: { id: true, email: true, name: true }
        });

        for (const user of users) {
            // Get shows this user follows that are airing today
            const userShows = await prisma.mediaItem.findMany({
                where: {
                    tmdbId: { in: showsWithEpisodesToday.map(s => s.tmdbId) },
                    OR: [
                        { watchedBy: { some: { userId: user.id } } },
                        { toWatchBy: { some: { userId: user.id } } }
                    ]
                }
            });

            if (userShows.length > 0 && user.email) {
                const mailData = showsWithEpisodesToday
                    .filter(s => userShows.some(us => us.tmdbId === s.tmdbId))
                    .map(s => ({
                        title: s.title,
                        posterPath: s.posterPath,
                        episodeInfo: s.episodeInfo,
                        platforms: s.platforms
                    }));

                console.log(`Sending reminder to ${user.email} for ${mailData.length} shows.`);
                await sendDailyReminderEmail(user.email, user.name || "Sinefil", mailData);
            }
        }

        return NextResponse.json({ success: true, processedShows: showsWithEpisodesToday.length });
    } catch (error) {
        console.error("Cron job error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
