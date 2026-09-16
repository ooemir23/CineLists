import { unstable_cache } from "next/cache";
import { tmdb } from "@/lib/tmdb";

export const cachedGetWatchProviders = unstable_cache(
  async (type: "movie" | "tv", id: string) => tmdb.getWatchProviders(type, id),
  ["tmdb-watch-providers-v2"],
  { revalidate: 86400 },
);
