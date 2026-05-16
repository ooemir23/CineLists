import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = env.TMDB_API_KEY;

type WatchProvider = {
  display_priorities?: Record<string, number>;
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "movie";
    const country = searchParams.get("country") || "TR";

    if (!API_KEY) {
      console.error("TMDB_API_KEY is missing");
      return NextResponse.json({ results: [] }, { status: 500 });
    }

    const url = `${TMDB_BASE_URL}/watch/providers/${type}?api_key=${API_KEY}&language=tr-TR&watch_region=${country}`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // 24 hours cache

    if (!res.ok) {
      console.error(`TMDB Provider Error: ${res.status}`);
      return NextResponse.json({ results: [] });
    }

    const data: { results?: WatchProvider[] } = await res.json();
    return NextResponse.json(
      { results: data.results || [] },
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
