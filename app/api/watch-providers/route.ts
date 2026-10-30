import { NextResponse } from "next/server";
import { validateTmdbRequest } from "@/lib/api-budget";
import { tmdb } from "@/lib/tmdb";

export async function GET(request: Request) {
  const rejected = validateTmdbRequest(request);
  if (rejected) return rejected;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") === "tv" ? "tv" : "movie";
    const rawCountry = searchParams.get("country") || "TR";
    const country = /^[a-z]{2}$/i.test(rawCountry) ? rawCountry.toUpperCase() : "TR";

    const data = await tmdb
      .fetch(`/watch/providers/${type}`, { params: { watch_region: country } })
      .catch(() => ({ results: [] }));

    return NextResponse.json(
      { results: data?.results || [] },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error) {
    console.error("Watch Providers API Error:", error);
    return NextResponse.json({ results: [] });
  }
}
