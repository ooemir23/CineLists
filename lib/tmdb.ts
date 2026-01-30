import { env } from "./env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = env.TMDB_API_KEY;

type FetchOptions = {
    params?: Record<string, string>;
    cache?: RequestCache;
};

export const tmdb = {
    async fetch(endpoint: string, { params, cache = "force-cache" }: FetchOptions = {}): Promise<any> {
        const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
        url.searchParams.append("api_key", API_KEY || "");
        url.searchParams.append("language", "tr-TR"); // Türkçe içerik istendi

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        const res = await fetch(url.toString(), {
            next: { revalidate: 3600 }, // 1 saat önbellek
        });

        if (!res.ok) {
            console.error(`TMDB API Error: ${res.status} ${res.statusText} at ${endpoint}`);
            throw new Error(`TMDB Error: ${res.status} ${res.statusText}`);
        }

        return res.json();
    },

    async getTrendingMovies() {
        return this.fetch("/trending/movie/day");
    },

    async getTrendingTV() {
        return this.fetch("/trending/tv/day");
    },

    async getTrending(type: "movie" | "tv", timeWindow: "day" | "week") {
        return this.fetch(`/trending/${type}/${timeWindow}`);
    },

    async searchMulti(query: string) {
        return this.fetch("/search/multi", {
            params: { query },
            cache: "no-store",
        });
    },

    async getDetails(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}`, {
            params: { append_to_response: "credits,recommendations,similar,images,videos" }
        });
    },

    async getSeasonDetails(tvId: string, seasonNumber: number) {
        return this.fetch(`/tv/${tvId}/season/${seasonNumber}`);
    },

    async getWatchProviders(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}/watch/providers`);
    },

    async discover(type: "movie" | "tv", params: Record<string, string>) {
        return this.fetch(`/discover/${type}`, { params });
    },

    async getTopRated(type: "movie" | "tv") {
        return this.fetch(`/${type}/top_rated`);
    },

    async getPopular(type: "movie" | "tv") {
        return this.fetch(`/${type}/popular`);
    },

    async getUpcomingMovies() {
        return this.fetch("/movie/upcoming");
    },

    async getAiringTodayTV() {
        return this.fetch("/tv/airing_today");
    },

    async getGenres(type: "movie" | "tv") {
        return this.fetch(`/genre/${type}/list`);
    },

    async getPersonDetails(id: string) {
        return this.fetch(`/person/${id}`, {
            params: { append_to_response: "external_ids,combined_credits,images" }
        });
    },

    async getPersonExternalIds(id: string) {
        return this.fetch(`/person/${id}/external_ids`);
    },

    async getPersonCombinedCredits(id: string) {
        return this.fetch(`/person/${id}/combined_credits`);
    },
};
