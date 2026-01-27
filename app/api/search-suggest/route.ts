// API route for TMDB multi search
import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { searchUsers } from "@/lib/social-actions";

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
  // Return mixed results
  const userResults = await searchUsers(query);
  const formattedUserResults = userResults.map((u: any) => ({
    id: u.id,
    name: u.name,
    type: "user", // Custom type for users
    image: u.image,
  }));

  // Combine: Users first, then TMDB results
  const combined = [...formattedUserResults, ...results].slice(0, 10);

  return NextResponse.json(combined);
}
