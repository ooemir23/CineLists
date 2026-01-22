const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
    console.warn("TMDB API Key is missing!");
}

type FetchOptions = {
    params?: Record<string, string>;
    cache?: RequestCache;
};

export const tmdb = {
    async fetch(endpoint: string, { params, cache = "force-cache" }: FetchOptions = {}) {
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

    async searchMulti(query: string) {
        return this.fetch("/search/multi", {
            params: { query },
            cache: "no-store",
        });
    },

    async getDetails(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}`, {
            params: { append_to_response: "credits,recommendations,similar" }
        });
    },

    async getSeasonDetails(tvId: string, seasonNumber: number) {
        return this.fetch(`/tv/${tvId}/season/${seasonNumber}`);
    },
};
