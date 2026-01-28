import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "movie";

    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/genre/${type}/list?api_key=${TMDB_API_KEY}&language=tr-TR`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch genres");
        }

        const data = await response.json();
        return NextResponse.json({ genres: data.genres });
    } catch (error) {
        console.error("Error fetching genres:", error);
        return NextResponse.json({ genres: [] }, { status: 500 });
    }
}
