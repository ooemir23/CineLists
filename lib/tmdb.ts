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
        endpoint.includes("top_rated") ||
        endpoint.includes("recommendations") ||
        endpoint.includes("similar")
    );
}

type FetchOptions = {
    params?: Record<string, string>;
    cache?: RequestCache;
};

// Global in-memory cache to prevent blocking TMDB requests and 502/504 gateway timeouts
interface CacheEntry {
    data: any;
    expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const MAX_CACHE_SIZE = 1500;

// ── Rate Limiter & Concurrency Queue (Prevents TMDB 429 Too Many Requests) ──
const MAX_CONCURRENT_REQUESTS = 4;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
        activeRequests++;
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
        requestQueue.push(() => {
            activeRequests++;
            resolve();
        });
    });
}

function releaseSlot() {
    activeRequests--;
    if (requestQueue.length > 0) {
        const next = requestQueue.shift();
        next?.();
    }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getCacheTTL(endpoint: string): number {
    if (endpoint.includes("/genre") || endpoint.includes("/providers")) {
        return 24 * 60 * 60 * 1000; // 24 hours
    }
    if (endpoint.includes("/credits") || endpoint.includes("/videos") || endpoint.includes("/images") || endpoint.includes("/combined_credits")) {
        return 12 * 60 * 60 * 1000; // 12 hours
    }
    if (endpoint.includes("/trending") || endpoint.includes("/popular") || endpoint.includes("/top_rated")) {
        return 60 * 60 * 1000; // 1 hour
    }
    if (endpoint.includes("/discover") || endpoint.includes("/recommendations") || endpoint.includes("/similar")) {
        return 30 * 60 * 1000; // 30 minutes
    }
    if (endpoint.includes("/search")) {
        return 10 * 60 * 1000; // 10 minutes
    }
    return 2 * 60 * 60 * 1000; // 2 hours for details
}

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

        const cacheKey = url.toString();
        const now = Date.now();

        // 1. Check in-memory cache
        if (cache !== "no-store") {
            const cached = memoryCache.get(cacheKey);
            if (cached && cached.expiresAt > now) {
                return cached.data;
            }
        }

        // 2. In-flight request deduplication (SingleFlight pattern)
        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
            // Acquire concurrency slot
            await acquireSlot();

            try {
                const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
                    signal: AbortSignal.timeout(10000),
                };

                if (cache === "no-store") {
                    fetchOptions.next = { revalidate: 0 };
                } else {
                    fetchOptions.next = { revalidate: 3600 };
                }

                let res = await fetch(cacheKey, fetchOptions);

                // Handle 429 (Rate Limit) with graceful backoff retry
                if (res.status === 429) {
                    console.warn(`[TMDB RateLimit] 429 on ${endpoint}, waiting 600ms before retry...`);
                    await sleep(600);
                    res = await fetch(cacheKey, fetchOptions);
                }

                if (!res.ok) {
                    // Fallback to stale cache if available
                    const stale = memoryCache.get(cacheKey);
                    if (stale) return stale.data;

                    if (isListEndpoint(endpoint)) {
                        return EMPTY_LIST_RESPONSE;
                    }
                    return null;
                }

                const data = await res.json();

                // Save to in-memory cache
                if (cache !== "no-store" && data) {
                    if (memoryCache.size >= MAX_CACHE_SIZE) {
                        const firstKey = memoryCache.keys().next().value;
                        if (firstKey) memoryCache.delete(firstKey);
                    }
                    const ttl = getCacheTTL(endpoint);
                    memoryCache.set(cacheKey, {
                        data,
                        expiresAt: now + ttl,
                    });
                }

                return data;
            } catch (error) {
                // Fallback to stale cache if available
                const stale = memoryCache.get(cacheKey);
                if (stale) return stale.data;

                if (isListEndpoint(endpoint)) {
                    return EMPTY_LIST_RESPONSE;
                }
                return null;
            } finally {
                releaseSlot();
                inFlightRequests.delete(cacheKey);
            }
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        return fetchPromise;
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

    async getSimilar(type: "movie" | "tv", id: string) {
        return this.fetch(`/${type}/${id}/similar`);
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
            params: { append_to_response: "networks,next_episode_to_air,watch/providers" }
        });
    },
};
