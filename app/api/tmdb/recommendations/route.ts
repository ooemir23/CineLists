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
        const response = await fetch(
            `${TMDB_BASE_URL}/${type}/${id}/recommendations?api_key=${TMDB_API_KEY}&language=tr-TR`,
            { next: { revalidate: 86400 } }
        );

        if (!response.ok) {
            return NextResponse.json({ results: [] });
        }

        const data = await response.json();
        return NextResponse.json(
            { results: data.results || [] },
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
