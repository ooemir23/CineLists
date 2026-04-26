import { tmdb } from "@/lib/tmdb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "multi";

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        let results;
        if (type === "movie") {
            const data = await tmdb.searchMovies(query);
            results = data.results;
        } else if (type === "tv") {
            const data = await tmdb.searchTV(query);
            results = data.results;
        } else {
            const data = await tmdb.searchMulti(query);
            results = data.results;
        }

        return NextResponse.json({ results: results.slice(0, 10) });
    } catch (error) {
        console.error("Search API error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
