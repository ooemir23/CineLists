import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "movie";
  const country = searchParams.get("country") || "TR";
  // Use a popular movie/tv to get providers for the region
  let id = type === "movie" ? "603692" : "1399"; // Default: "John Wick: Chapter 4" or "Game of Thrones"
  try {
    const data = await tmdb.getWatchProviders(type, id);
    const providers = data.results?.[country]?.flatrate || [];
    return NextResponse.json(providers);
  } catch (e) {
    return NextResponse.json([]);
  }
}
