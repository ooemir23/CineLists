import { NextRequest, NextResponse } from "next/server";
import { getEnvVar } from "@/lib/env";

const TMDB_API_KEY = getEnvVar("TMDB_API_KEY");
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type Genre = {
    id: number;
    name: string;
};

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

        const data: { genres?: Genre[] } = await response.json();
        return NextResponse.json(
            { genres: data.genres || [] },
            {
                headers: {
                    "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching genres:", error);
        return NextResponse.json({ genres: [] }, { status: 500 });
    }
}
