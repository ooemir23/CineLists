// API route for TMDB multi search with bilingual lookup
import { NextResponse } from "next/server";
import { tmdb } from "@/lib/tmdb";
import { searchUsers } from "@/lib/social-actions";

import type { NextRequest } from "next/server";

type TMDBSearchItem = {
  media_type?: "movie" | "tv" | "person";
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  known_for_department?: string;
};

type SearchUser = {
  id: string;
  name?: string | null;
  image?: string | null;
  followersCount?: number;
};

const DEPARTMENT_TR_MAP: Record<string, string> = {
  Acting: "Oyuncu",
  Directing: "Yönetmen",
  Writing: "Senarist",
  Production: "Yapımcı",
  Sound: "Ses & Müzik",
  Camera: "Görüntü Yönetmeni",
  Editing: "Kurgu",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const locale = req.cookies.get("NEXT_LOCALE")?.value || "tr";
  const primaryLang = locale === "en" ? "en-US" : "tr-TR";
  const altLang = locale === "en" ? "tr-TR" : "en-US";

  try {
    const [tmdbPrimary, tmdbAlt, users]: [
      { results?: TMDBSearchItem[] },
      { results?: TMDBSearchItem[] },
      SearchUser[]
    ] = await Promise.all([
      tmdb.searchMulti(query, { language: primaryLang }).catch(() => ({ results: [] })),
      tmdb.searchMulti(query, { language: altLang }).catch(() => ({ results: [] })),
      searchUsers(query).catch(() => []),
    ]);

    // Merge TMDB results by unique ID, keeping primary localized titles first
    const itemsMap = new Map<string, TMDBSearchItem>();
    for (const item of tmdbPrimary.results || []) {
      if (item.id && item.media_type) {
        itemsMap.set(`${item.media_type}:${item.id}`, item);
      }
    }
    for (const item of tmdbAlt.results || []) {
      if (item.id && item.media_type) {
        const key = `${item.media_type}:${item.id}`;
        if (!itemsMap.has(key)) {
          itemsMap.set(key, item);
        }
      }
    }

    // Format TMDB results
    const tmdbResults = Array.from(itemsMap.values())
      .filter((item) => ["movie", "tv", "person"].includes(item.media_type || ""))
      .slice(0, 8)
      .map((item) => {
        let department: string | undefined = undefined;
        if (item.media_type === "person" && item.known_for_department) {
          department = locale === "en" ? item.known_for_department : (DEPARTMENT_TR_MAP[item.known_for_department] || item.known_for_department);
        }

        const mainTitle = item.title || item.name || "";
        const origTitle = item.original_title || item.original_name;
        const originalName = origTitle && origTitle.toLowerCase() !== mainTitle.toLowerCase()
          ? origTitle
          : undefined;

        return {
          id: item.id,
          name: mainTitle,
          originalName,
          type: item.media_type,
          image: item.poster_path || item.profile_path
            ? `https://image.tmdb.org/t/p/w200${item.poster_path || item.profile_path}`
            : null,
          year: (item.release_date || item.first_air_date)?.split("-")[0] || "",
          vote_average: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
          department,
        };
      });

    // Format User results
    const userResults = (users || []).slice(0, 2).map((user) => ({
      id: user.id,
      name: user.name || (locale === "en" ? "User" : "Kullanıcı"),
      type: "user",
      image: user.image,
      year: user.followersCount ? `${user.followersCount} ${locale === "en" ? "Followers" : "Takipçi"}` : "",
    }));

    // Combine results (up to 10 items)
    const combinedResults = [...tmdbResults, ...userResults].slice(0, 10);

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
