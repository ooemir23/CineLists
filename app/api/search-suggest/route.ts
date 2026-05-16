// API route for TMDB multi search
import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { searchUsers } from "@/lib/social-actions";

import type { NextRequest } from "next/server";

type TMDBSearchItem = {
  media_type?: "movie" | "tv" | "person";
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
};

type SearchUser = {
  id: string;
  name?: string | null;
  image?: string | null;
  followersCount?: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [tmdbData, users]: [
      { results?: TMDBSearchItem[] },
      SearchUser[]
    ] = await Promise.all([
      tmdb.searchMulti(query),
      searchUsers(query)
    ]);

    // Format TMDB results
    const tmdbResults = ((tmdbData.results || []) as TMDBSearchItem[])
      .filter((item) => ["movie", "tv", "person"].includes(item.media_type || ""))
      .map((item) => ({
        id: item.id,
        name: item.title || item.name,
        type: item.media_type,
        image: item.poster_path || item.profile_path
          ? `https://image.tmdb.org/t/p/w200${item.poster_path || item.profile_path}`
          : null,
        year: (item.release_date || item.first_air_date)?.split("-")[0] || ""
      }));

    // Format User results
    const userResults = users.map((user) => ({
      id: user.id,
      name: user.name || "Kullanıcı",
      type: "user",
      image: user.image,
      year: user.followersCount ? `${user.followersCount} Takipçi` : ""
    }));

    // Combine results
    const combinedResults = [...tmdbResults, ...userResults];

    return NextResponse.json(combinedResults, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json([]);
  }
}
