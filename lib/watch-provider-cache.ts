import { tmdb } from "@/lib/tmdb";

export const cachedGetWatchProviders = async (type: "movie" | "tv", id: string) =>
  tmdb.getWatchProviders(type, id);

