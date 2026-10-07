import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { sendDailyReminderEmail } from "@/lib/mail";
import { getDictionary } from "@/lib/i18n/server";

export async function GET(request: Request) {
    const secret = process.env.CRON_SECRET;
    const supplied = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
    if (!secret || Buffer.byteLength(supplied) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) return new Response(null, { status: 401 });
    try {
        const today = new Date().toISOString().slice(0, 10);
        const users = await prisma.user.findMany({
            where: { email: { not: null }, isSuspended: false },
            select: {
                email: true, name: true, locale: true, country: true,
                watched: { where: { media: { type: "TV" } }, select: { media: { select: { tmdbId: true } } } },
                toWatch: { where: { media: { type: "TV" } }, select: { media: { select: { tmdbId: true } } } },
            },
        });
        // Shared request promises avoid fetching a show once per subscriber.
        const details = new Map<string, Promise<any>>();
        const providers = new Map<number, Promise<any>>();
        let recipients = 0;
        for (const user of users) {
            const locale = user.locale === "en" ? "en" : "tr";
            const dictionary = getDictionary(locale);
            const ids = new Set([...user.watched, ...user.toWatch].map(w => w.media.tmdbId));
            const shows = [];
            for (const id of ids) {
                const key = `${locale}:${id}`;
                if (!details.has(key)) details.set(key, tmdb.fetch(`/tv/${id}`, { params: { language: locale === "en" ? "en-US" : "tr-TR" } }));
                const show = await details.get(key);
                const episode = show?.next_episode_to_air;
                if (episode?.air_date !== today) continue;
                if (!providers.has(id)) providers.set(id, tmdb.fetch(`/tv/${id}/watch/providers`, { params: { language: "en-US" } }));
                const availability = await providers.get(id);
                shows.push({
                    title: show.name, posterPath: show.poster_path,
                    episodeInfo: dictionary.reviewUi.episode.replace("{season}", String(episode.season_number)).replace("{episode}", String(episode.episode_number)),
                    platforms: availability?.results?.[user.country]?.flatrate?.map((p: { provider_name: string }) => p.provider_name) || [],
                });
            }
            if (shows.length && user.email) {
                await sendDailyReminderEmail(user.email, user.name || dictionary.common.appName, shows, locale);
                recipients++;
            }
        }
        return Response.json({ success: true, recipients });
    } catch { return Response.json({ success: false }, { status: 500 }); }
}
