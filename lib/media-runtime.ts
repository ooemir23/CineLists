import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

// Also cache absent runtimes: upcoming titles must not be fetched on every visit.
const refresh = unstable_cache(async (id: number, type: "movie" | "tv") => {
    const details = await tmdb.getDetails(type, String(id));
    const value = type === "movie" ? details.runtime
        : details.episode_run_time?.[0] || details.last_episode_to_air?.runtime || details.next_episode_to_air?.runtime;
    const runtime = typeof value === "number" && value > 0 ? value : null;
    // Only enrich existing records of the correct type; reading a list must not create catalog entries.
    await prisma.mediaItem.updateMany({
        where: { tmdbId: id, type: type === "movie" ? "MOVIE" : "TV" },
        data: { runtime }
    });
    return runtime;
}, ["media-runtime-refresh-v1"], { revalidate: 21600 });

const pending = new Map<string, Promise<unknown>>();
export async function refreshMediaRuntime(item: { id: number; type: "movie" | "tv" }) {
    const key = `${item.type}:${item.id}`;
    if (pending.has(key)) return pending.get(key);
    const work = refresh(item.id, item.type).catch(() => null).finally(() => pending.delete(key));
    pending.set(key, work);
    return work;
}
