import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

type Genre = { id: number; name: string };
type Language = { iso_639_1: string; english_name: string };
type Country = { iso_3166_1: string; native_name?: string; english_name: string };
type Provider = { provider_id: number; provider_name: string };

export async function GET() {
    try {
        const [
            movieGenres,
            tvGenres,
            languages,
            countries,
            movieProviders,
            tvProviders
        ] = await Promise.all([
            tmdb.getGenres("movie"),
            tmdb.getGenres("tv"),
            tmdb.fetch("/configuration/languages"),
            tmdb.fetch("/configuration/countries"),
            tmdb.fetch("/watch/providers/movie", { params: { watch_region: "TR" } }),
            tmdb.fetch("/watch/providers/tv", { params: { watch_region: "TR" } }),
        ]);

        // Merge genres
        const genreMap = new Map<number, string>();
        [...((movieGenres.genres as Genre[] | undefined) || []), ...((tvGenres.genres as Genre[] | undefined) || [])].forEach((g) => {
            genreMap.set(g.id, g.name);
        });
        const genres = Array.from(genreMap.entries()).map(([id, name]) => ({
            id: id.toString(),
            label: name
        })).sort((a, b) => a.label.localeCompare(b.label, 'tr'));

        // Format languages (Common ones first or just all)
        const formattedLanguages = ((languages as Language[] | undefined) || [])
            .map((l) => ({ id: l.iso_639_1, label: l.english_name }))
            .sort((a, b) => a.label.localeCompare(b.label));

        // Format countries
        const formattedCountries = ((countries as Country[] | undefined) || [])
            .map((c) => ({ id: c.iso_3166_1, label: c.native_name || c.english_name }))
            .sort((a, b) => a.label.localeCompare(b.label));

        // Format providers
        const providerMap = new Map<number, string>();
        [...((movieProviders.results as Provider[] | undefined) || []), ...((tvProviders.results as Provider[] | undefined) || [])].forEach((p) => {
            providerMap.set(p.provider_id, p.provider_name);
        });
        const providers = Array.from(providerMap.entries()).map(([id, name]) => ({
            id: id.toString(),
            label: name
        })).sort((a, b) => a.label.localeCompare(b.label));

        return NextResponse.json(
            {
                genres,
                languages: formattedLanguages,
                countries: formattedCountries,
                providers,
            },
            {
                headers: {
                    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching consolidated filters:", error);
        return NextResponse.json({ error: "Failed to fetch filters" }, { status: 500 });
    }
}
