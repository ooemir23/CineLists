// API route for TMDB multi search
import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { searchUsers } from "@/lib/social-actions";

import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data: any = await tmdb.searchMulti(query);
    // Filter to include only movies, tv shows, and people
    const results = (data.results || []).filter((item: any) =>
      ["movie", "tv", "person"].includes(item.media_type)
    ).map((item: any) => ({
      id: item.id,
      name: item.title || item.name,
      type: item.media_type,
      image: item.poster_path || item.profile_path
        ? `https://image.tmdb.org/t/p/w200${item.poster_path || item.profile_path}`
        : null,
      year: (item.release_date || item.first_air_date)?.split("-")[0] || ""
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json([]);
  }
}
