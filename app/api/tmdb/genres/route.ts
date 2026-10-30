import { validateTmdbRequest } from "@/lib/api-budget";
import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

export async function GET(request: NextRequest) {
  const rejected = validateTmdbRequest(request);
  if (rejected) return rejected;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") === "tv" ? "tv" : "movie";
    const locale = resolveLocale(request.headers, request.cookies);
    const language = locale === "en" ? "en-US" : "tr-TR";

    try {
        const data = await tmdb.getGenres(type, language);
        return NextResponse.json(
            { genres: data?.genres || [] },
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
