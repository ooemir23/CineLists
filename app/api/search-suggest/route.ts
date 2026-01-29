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
    const [tmdbData, users]: [any, any[]] = await Promise.all([
      tmdb.searchMulti(query),
      searchUsers(query)
    ]);

    // Format TMDB results
    const tmdbResults = (tmdbData.results || []).filter((item: any) =>
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

    // Format User results
    const userResults = users.map(user => ({
      id: user.id,
      name: user.name || "Kullanıcı",
      type: "user",
      image: user.image,
      year: user.followersCount ? `${user.followersCount} Takipçi` : ""
    }));

    // Combine results
    const combinedResults = [...tmdbResults, ...userResults];

    return NextResponse.json(combinedResults);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json([]);
  }
}
