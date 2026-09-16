import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

// Also cache absent runtimes: upcoming titles must not be fetched on every visit.
const refresh = unstable_cache(
  async (id: number, type: "movie" | "tv") => {
    const details = await tmdb.getDetails(type, String(id));
    if (!details) return null;
    const value =
      type === "movie"
        ? details.runtime
        : details.episode_run_time?.[0] ||
          details.last_episode_to_air?.runtime ||
          details.next_episode_to_air?.runtime;
    const runtime = typeof value === "number" && value > 0 ? value : null;
    // This runs after the response. Preserve colliding movie/TV IDs instead of updating the wrong title.
    await prisma.mediaItem.createMany({
      skipDuplicates: true,
      data: [{ tmdbId: id, type: type === "movie" ? "MOVIE" : "TV",
        title: details.title || details.name || "Tarih Bekleniyor", posterPath: details.poster_path,
        genres: (details.genres || []).map((genre: { name: string }) => genre.name), runtime }]
    });
    await prisma.mediaItem.updateMany({
      where: { tmdbId: id, type: type === "movie" ? "MOVIE" : "TV" },
      data: { runtime },
    });
    return runtime;
  },
  ["media-runtime-refresh-v1"],
  { revalidate: 21600 },
);

const pending = new Map<string, Promise<unknown>>();
let backgroundTail: Promise<unknown> = Promise.resolve();
export async function refreshMediaRuntime(item: {
  id: number;
  type: "movie" | "tv";
}) {
  const key = `${item.type}:${item.id}`;
  if (pending.has(key)) return pending.get(key);
  // Keep background enrichment from filling all four shared TMDB request slots.
  if (pending.size >= 30) return null;
  const work = backgroundTail.then(() => refresh(item.id, item.type))
    .catch(() => null)
    .finally(() => pending.delete(key));
  backgroundTail = work;
  pending.set(key, work);
  return work;
}
