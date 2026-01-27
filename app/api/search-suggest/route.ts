// API route for TMDB multi search
import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query || query.length < 2) return NextResponse.json([]);
  const data: any = await tmdb.searchMulti(query);
  // Only return first 7 results, with id, name/title, type, and poster/profile
  const results = (data.results || []).slice(0, 7).map((item: any) => {
    if (item.media_type === "person") {
      return {
        id: item.id,
        name: item.name,
        type: "person",
        image: item.profile_path ? `https://image.tmdb.org/t/p/w92${item.profile_path}` : null,
      };
    } else {
      return {
        id: item.id,
        name: item.title || item.name,
        type: item.media_type,
        image: item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : null,
      };
    }
  });
  return NextResponse.json(results);
}
