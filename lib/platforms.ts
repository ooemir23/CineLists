import { tmdb } from "./tmdb";

export const APP_PLATFORMS: Record<number, { id: string, name: string }> = {
    8: { id: "netflix", name: "Netflix" },
    337: { id: "disney", name: "Disney+" },
    119: { id: "prime", name: "Prime Video" },
    301: { id: "blutv", name: "BluTV" },
    11: { id: "mubi", name: "MUBI" },
    2: { id: "apple", name: "Apple TV+" },
};

export async function getAppPlatforms() {
    const [movieProviders, tvProviders] = await Promise.all([
        tmdb.fetch("/watch/providers/movie", { params: { watch_region: "TR" } }),
        tmdb.fetch("/watch/providers/tv", { params: { watch_region: "TR" } })
    ]);

    const allProviders = [...(movieProviders.results || []), ...(tvProviders.results || [])];
    const platformsMap = new Map<number, { id: string, name: string, icon: string, priority: number }>();
    
    allProviders.forEach((p: any) => {
        if (p.logo_path && p.provider_id) {
            platformsMap.set(p.provider_id, {
                id: p.provider_id.toString(),
                name: p.provider_name,
                icon: `https://image.tmdb.org/t/p/original${p.logo_path}`,
                priority: p.display_priorities?.TR ?? p.display_priority ?? 999
            });
        }
    });

    // Ensure Netflix is always present and top-priority (provider_id 8)
    if (!platformsMap.has(8)) {
        platformsMap.set(8, {
            id: "8",
            name: "Netflix",
            icon: "https://image.tmdb.org/t/p/original/rK1KljqmbvO9HQa1PBFLILWah72.png",
            priority: 0
        });
    } else {
        const netflix = platformsMap.get(8)!;
        netflix.priority = 0;
    }

    const sortedPlatforms = Array.from(platformsMap.values())
        .sort((a, b) => a.priority - b.priority)
        .map(({ id, name, icon }) => ({ id, name, icon }));

    return sortedPlatforms.slice(0, 30);
}
