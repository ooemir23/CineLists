import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

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
        const genreMap = new Map();
        [...(movieGenres.genres || []), ...(tvGenres.genres || [])].forEach((g: any) => {
            genreMap.set(g.id, g.name);
        });
        const genres = Array.from(genreMap.entries()).map(([id, name]) => ({
            id: id.toString(),
            label: name
        })).sort((a, b) => a.label.localeCompare(b.label, 'tr'));

        // Format languages (Common ones first or just all)
        const formattedLanguages = (languages || [])
            .map((l: any) => ({ id: l.iso_639_1, label: l.english_name }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

        // Format countries
        const formattedCountries = (countries || [])
            .map((c: any) => ({ id: c.iso_3166_1, label: c.native_name || c.english_name }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));

        // Format providers
        const providerMap = new Map();
        [...(movieProviders.results || []), ...(tvProviders.results || [])].forEach((p: any) => {
            providerMap.set(p.provider_id, p.provider_name);
        });
        const providers = Array.from(providerMap.entries()).map(([id, name]) => ({
            id: id.toString(),
            label: name
        })).sort((a, b) => a.label.localeCompare(b.label));

        return NextResponse.json({
            genres,
            languages: formattedLanguages,
            countries: formattedCountries,
            providers,
        });
    } catch (error) {
        console.error("Error fetching consolidated filters:", error);
        return NextResponse.json({ error: "Failed to fetch filters" }, { status: 500 });
    }
}
