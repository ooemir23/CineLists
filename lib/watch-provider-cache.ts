import { unstable_cache } from "next/cache";
import { tmdb } from "@/lib/tmdb";

export const cachedGetWatchProviders = unstable_cache(
  async (type: "movie" | "tv", id: string) => tmdb.fetch(`/${type}/${id}/watch/providers`, { params: { language: "en-US" } }),
  ["tmdb-watch-providers-v2"],
  { revalidate: 86400 },
);
