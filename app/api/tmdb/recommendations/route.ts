import { NextRequest, NextResponse } from "next/server";
import { getEnvVar } from "@/lib/env";

const TMDB_API_KEY = getEnvVar("TMDB_API_KEY");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") === "tv" ? "tv" : "movie";
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ results: [] }, { status: 400 });
    }

    try {
        const [recRes, simRes] = await Promise.allSettled([
            fetch(
                `${TMDB_BASE_URL}/${type}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=tr-TR`,
                { next: { revalidate: 86400 } }
            ),
            fetch(
                `${TMDB_BASE_URL}/${type}/${id}/similar?api_key=${TMDB_API_KEY}&language=tr-TR`,
                { next: { revalidate: 86400 } }
            ),
        ]);

        const recData = recRes.status === "fulfilled" && recRes.value.ok ? await recRes.value.json() : { results: [] };
        const simData = simRes.status === "fulfilled" && simRes.value.ok ? await simRes.value.json() : { results: [] };

        const combinedMap = new Map<number, any>();
        for (const item of [...(recData.results || []), ...(simData.results || [])]) {
            if (item && item.id && item.id.toString() !== id && (item.poster_path || item.backdrop_path)) {
                if (!combinedMap.has(item.id)) {
                    combinedMap.set(item.id, item);
                }
            }
        }

        let results = Array.from(combinedMap.values());

        // If still fewer than 6, fallback to genres from query params or details
        if (results.length < 6) {
            let genreIds = searchParams.get("genres");
            if (!genreIds) {
                try {
                    const detailRes = await fetch(
                        `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=tr-TR`,
                        { next: { revalidate: 86400 } }
                    );
                    if (detailRes.ok) {
                        const detailData = await detailRes.json();
                        genreIds = detailData.genres?.map((g: any) => g.id).join(",");
                    }
                } catch {
                    // Ignore
                }
            }

            if (genreIds) {
                try {
                    const discoverRes = await fetch(
                        `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=tr-TR&sort_by=popularity.desc&with_genres=${genreIds}&vote_count.gte=10`,
                        { next: { revalidate: 86400 } }
                    );
                    if (discoverRes.ok) {
                        const discoverData = await discoverRes.json();
                        for (const item of (discoverData.results || [])) {
                            if (item && item.id && item.id.toString() !== id && (item.poster_path || item.backdrop_path)) {
                                if (!combinedMap.has(item.id)) {
                                    combinedMap.set(item.id, item);
                                }
                            }
                        }
                        results = Array.from(combinedMap.values());
                    }
                } catch {
                    // Ignore
                }
            }
        }

        return NextResponse.json(
            { results },
            {
                headers: {
                    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}
