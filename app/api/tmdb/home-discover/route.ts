import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") === "tv" ? "tv" : "movie";
    const category = searchParams.get("category") || "trending";

    try {
        let data: any;

        if (category === "trending") {
            data = type === "movie" ? await tmdb.getTrendingMovies() : await tmdb.getTrendingTV();
        } else if (category === "popular") {
            data = await tmdb.getPopular(type);
        } else if (category === "top_rated") {
            data = await tmdb.getTopRated(type);
        } else if (category === "upcoming") {
            data = type === "movie" ? await tmdb.getUpcomingMovies() : await tmdb.getAiringTodayTV();
        } else {
            data = await tmdb.discover(type, {
                watch_region: "TR",
                sort_by: "popularity.desc",
            });
        }

        return NextResponse.json({ results: data?.results || [] });
    } catch (error) {
        console.error("Home discover API error:", error);
        return NextResponse.json({ results: [] });
    }
}
