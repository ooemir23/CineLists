import { env } from "./env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const getApiKey = () => process.env.TMDB_API_KEY?.trim() || env.TMDB_API_KEY?.trim();

const EMPTY_LIST_RESPONSE = {
    results: [],
    genres: [],
    total_pages: 0,
    total_results: 0,
};

function isListEndpoint(endpoint: string): boolean {
    return (
        endpoint.includes("trending") ||
        endpoint.includes("popular") ||
        endpoint.includes("discover") ||
        endpoint.includes("search") ||
        endpoint.includes("genre") ||
        endpoint.includes("upcoming") ||
        endpoint.includes("airing_today") ||
        endpoint.includes("top_rated")
    );
}

type FetchOptions = {
    params?: Record<string, string>;
    cache?: RequestCache;
};

export const tmdb = {
    async fetch(endpoint: string, { params, cache }: FetchOptions = {}) {
        const apiKey = getApiKey();
        if (!apiKey || apiKey.includes("buraya")) {
            console.error("TMDB_API_KEY is missing or placeholder value");
            if (isListEndpoint(endpoint)) {
                return EMPTY_LIST_RESPONSE;
            }
            throw new Error("TMDB_API_KEY is missing");
        }

        const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
        url.searchParams.append("api_key", apiKey);
        url.searchParams.append("language", "tr-TR");

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        try {
            const fetchOptions: RequestInit & { next?: { revalidate: number } } = {};

            if (cache === "no-store") {
                fetchOptions.next = { revalidate: 0 };
            } else {
                fetchOptions.next = { revalidate: 3600 };
            }

            const res = await fetch(url.toString(), fetchOptions);

            if (!res.ok) {
                // Log only in dev or conditionally to avoid spamming prod logs
                console.warn(`TMDB API Warning: ${res.status} ${res.statusText} at ${endpoint}`);
                // Return empty results instead of throwing to prevent pages from crashing
                if (isListEndpoint(endpoint)) {
                    return EMPTY_LIST_RESPONSE;
                }
                return null; // Return null instead of throwing Error for detail endpoints
            }

            return res.json();
        } catch (error) {
            console.warn(`Network error fetching from TMDB (${endpoint}):`, error);
            if (isListEndpoint(endpoint)) {
                return EMPTY_LIST_RESPONSE;
            }
            return null;
        }
    },

    async getTrendingMovies() {
        return this.fetch("/trending/movie/day");
    },

    async getTrendingTV() {
        return this.fetch("/trending/tv/day");
    },

    async getTrending(type: "movie" | "tv", timeWindow: "day" | "week", params: Record<string, string> = {}) {
        return this.fetch(`/trending/${type}/${timeWindow}`, { params });
    },

    async searchMulti(query: string) {
        return this.fetch("/search/multi", {
            params: { query },
            cache: "no-store",
        });
    },

    async searchMovies(query: string) {
        return this.fetch("/search/movie", {
            params: { query },
            cache: "no-store",
        });
    },

    async searchTV(query: string) {
        return this.fetch("/search/tv", {
            params: { query },
            cache: "no-store",
        });
    },

    async getDetails(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}`);
    },

    async getCredits(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}/credits`);
    },

    async getVideos(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}/videos`);
    },

    async getRecommendations(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}/recommendations`);
    },

    async getImages(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}/images`);
    },

    async getSeasonDetails(tvId: string, seasonNumber: number) {
        return this.fetch(`/tv/${tvId}/season/${seasonNumber}`);
    },

    async getEpisodeDetails(tvId: string, seasonNumber: number, episodeNumber: number) {
        return this.fetch(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
    },

    async getWatchProviders(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}/watch/providers`);
    },

    async discover(type: "movie" | "tv", params: Record<string, string>) {
        return this.fetch(`/discover/${type}`, { params });
    },

    async getTopRated(type: "movie" | "tv", params: Record<string, string> = {}) {
        return this.fetch(`/${type}/top_rated`, { params });
    },

    async getPopular(type: "movie" | "tv", params: Record<string, string> = {}) {
        return this.fetch(`/${type}/popular`, { params });
    },

    async getUpcomingMovies(params: Record<string, string> = {}) {
        return this.fetch("/movie/upcoming", { params });
    },

    async getAiringTodayTV(params: Record<string, string> = {}) {
        return this.fetch("/tv/airing_today", { params });
    },
    
    async getOnTheAirTV(params: Record<string, string> = {}) {
        return this.fetch("/tv/on_the_air", { params });
    },

    async getNowPlayingMovies(params: Record<string, string> = {}) {
        return this.fetch("/movie/now_playing", { params });
    },

    async getGenres(type: "movie" | "tv") {
        return this.fetch(`/genre/${type}/list`);
    },

    async getPersonDetails(id: string) {
        return this.fetch(`/person/${id}`);
    },

    async getPersonExternalIds(id: string) {
        return this.fetch(`/person/${id}/external_ids`);
    },

    async getPersonCombinedCredits(id: string) {
        return this.fetch(`/person/${id}/combined_credits`);
    },

    async getPersonUpcoming(id: number) {
        return this.fetch(`/person/${id}/movie_credits`, {
            params: { sort_by: "release_date.asc" }
        });
    },

    async getTVShow(id: string) {
        return this.fetch(`/tv/${id}`, {
            params: { append_to_response: "networks,next_episode_to_air" }
        });
    },
};
