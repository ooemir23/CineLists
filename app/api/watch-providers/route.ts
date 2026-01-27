import { NextResponse } from "next/server";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "movie";
  const country = searchParams.get("country") || "TR";
  const url = `${TMDB_BASE_URL}/watch/providers/${type}?api_key=${API_KEY}&language=tr-TR&watch_region=${country}`;
  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
  const data = await res.json();
  return NextResponse.json({ results: data.results || [] });
}
