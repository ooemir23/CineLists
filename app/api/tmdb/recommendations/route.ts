import { validateTmdbRequest } from "@/lib/api-budget";
import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

export async function GET(request: NextRequest) {
  const rejected = validateTmdbRequest(request);
  if (rejected) return rejected;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") === "tv" ? "tv" : "movie";
    const id = searchParams.get("id");

    if (!id || !/^\d+$/.test(id)) {
        return NextResponse.json({ results: [] }, { status: 400 });
    }

    const locale = resolveLocale(request.headers, request.cookies);
    const language = locale === "en" ? "en-US" : "tr-TR";

    try {
        const [recData, simData] = await Promise.all([
            tmdb.fetch(`/${type}/${id}/recommendations`, { params: { language } }).catch(() => ({ results: [] })),
            tmdb.fetch(`/${type}/${id}/similar`, { params: { language } }).catch(() => ({ results: [] })),
        ]);

        const combinedMap = new Map<number, any>();
        for (const item of [...(recData?.results || []), ...(simData?.results || [])]) {
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
                    const detailData = await tmdb.getDetails(type, id, { language }).catch(() => null);
                    genreIds = detailData?.genres?.map((g: any) => g.id).join(",");
                } catch {
                    // Ignore
                }
            }

            if (genreIds) {
                try {
                    const discoverData = await tmdb.discover(type, {
                        language,
                        sort_by: "popularity.desc",
                        with_genres: genreIds,
                        "vote_count.gte": "10",
                    }).catch(() => ({ results: [] }));
                    for (const item of (discoverData?.results || [])) {
                        if (item && item.id && item.id.toString() !== id && (item.poster_path || item.backdrop_path)) {
                            if (!combinedMap.has(item.id)) {
                                combinedMap.set(item.id, item);
                            }
                        }
                    }
                    results = Array.from(combinedMap.values());
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
