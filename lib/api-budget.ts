import { checkRateLimit } from "@/lib/ratelimit";
import { trustedClientIp } from "@/lib/auth-rate-limit";
import { RequestOverloadError } from "@/lib/request-budget";
import { getDictionary } from "@/lib/i18n/server";
import { resolveLocale } from "@/lib/i18n/resolve-locale";

export function validateTmdbRequest(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const isDiscovery = url.pathname === "/api/tmdb/home-discover";
  const dict = getDictionary(resolveLocale(request.headers));
  if (
    !checkRateLimit(`tmdb:${trustedClientIp(request.headers)}`, 120, 60_000)
      .allowed
  )
    return Response.json(
      { error: dict.common.tryAgain },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  const allowedValues: Record<string, string[]> = {
    type: ["movie", "tv", "all", "multi"],
    category: [
      "trending",
      "random",
      "now_playing",
      "popular",
      "top_rated",
      "upcoming",
      "friends",
      "discover",
    ],
    timeWindow: ["day", "week", "month"],
    upcomingFilter: ["all", "today", "week"],
    sortBy: [
      "popularity.desc",
      "popularity.asc",
      "vote_average.desc",
      "vote_average.asc",
      "primary_release_date.desc",
      "primary_release_date.asc",
      "first_air_date.desc",
      "first_air_date.asc",
      "release_date.desc",
      "release_date.asc",
      "vote_count.desc",
      "revenue.desc",
      "original_title.asc",
    ],
    includeProviders: ["true", "false"],
  };
  if (
    Object.entries(allowedValues).some(
      ([key, values]) => params.has(key) && !values.includes(params.get(key)!),
    ) ||
    ["id", "genre", "genres", "provider"].some(
      (key) => params.has(key) && !/^\d+(?:[,|]\d+)*$/.test(params.get(key)!),
    ) ||
    (params.has("language") &&
      !(
        isDiscovery ? /^[a-z]{2}(?:,[a-z]{2})*$/i : /^[a-z]{2}(?:-[a-z]{2})?$/i
      ).test(params.get("language")!)) ||
    Array.from(params).some(
      ([key, value]) =>
        key.length > 40 ||
        value.length > (key === "q" ? 200 : key === "items" ? 400 : 100),
    ) ||
    ["page", "limit"].some(
      (key) =>
        params.has(key) &&
        (!/^\d+$/.test(params.get(key)!) ||
          Number(params.get(key)) < 1 ||
          Number(params.get(key)) > (key === "page" ? 500 : 100)),
    ) ||
    (params.has("rating") &&
      (!/^\d+(\.\d+)?$/.test(params.get("rating")!) ||
        Number(params.get("rating")) > 10)) ||
    (params.has("year") &&
      !(isDiscovery ? /^\d{4}(?:,\d{4})*$/ : /^\d{4}$/).test(
        params.get("year")!,
      )) ||
    (params.has("country") &&
      !(isDiscovery ? /^[a-z]{2}(?:,[a-z]{2})*$/i : /^[a-z]{2}$/i).test(
        params.get("country")!,
      ))
  ) {
    return Response.json({ error: dict.common.errorOccurred }, { status: 400 });
  }
  return null;
}
export function tmdbErrorResponse(error: unknown, request: Request) {
  const dict = getDictionary(resolveLocale(request.headers));
  return Response.json(
    { error: dict.common.tryAgain },
    {
      status: error instanceof RequestOverloadError ? 503 : 502,
      headers: { "Retry-After": "5" },
    },
  );
}
