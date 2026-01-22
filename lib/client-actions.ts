"use server";

import { tmdb } from "./tmdb";

export async function fetchSeasonEpisodes(tmdbId: number, seasonNumber: number) {
    try {
        const data = await tmdb.getSeasonDetails(String(tmdbId), seasonNumber);
        return data;
    } catch (error) {
        console.error("Fetch season error:", error);
        return { episodes: [] };
    }
}
