// Use only an explicitly trusted edge header. Browser language is not location.
const allowedHeaders = [
  "cf-ip-country",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-country-code",
];
export function analyticsOriginAllowed(
  origin: string | null,
  requestUrl: string,
  publicUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL,
) {
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const targetUrl = new URL(publicUrl || requestUrl);
    if (originUrl.origin === targetUrl.origin) return true;
    if (originUrl.host === targetUrl.host) return true;
    if (
      ["localhost", "127.0.0.1"].includes(originUrl.hostname) &&
      ["localhost", "127.0.0.1"].includes(targetUrl.hostname)
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
export function analyticsCountry(
  headers: Headers,
  configured = process.env.ANALYTICS_COUNTRY_HEADER,
) {
  // If explicitly configured, validate only against that header
  if (configured !== undefined) {
    if (!configured || !allowedHeaders.includes(configured)) return "ZZ";
    const code = headers.get(configured)?.toUpperCase() || "";
    return /^[A-Z]{2}$/.test(code) && !["XX", "T1", "ZZ"].includes(code)
      ? code
      : "ZZ";
  }

  // Fallback: check known reverse proxy headers in priority order
  for (const header of allowedHeaders) {
    const code = headers.get(header)?.toUpperCase() || "";
    if (/^[A-Z]{2}$/.test(code) && !["XX", "T1", "ZZ"].includes(code)) {
      return code;
    }
  }

  return "ZZ";
}

export function analyticsPath(path: string): string | null {
  if (path.includes("?") || path.length > 250) return null;
  if (/^\/(movie|tv|person)\/[^/]+\/?$/.test(path))
    return `/${path.split("/")[1]}/[id]`;
  if (/^\/tv\/[^/]+\/(s|season)\/[^/]+\/(e|episode)\/[^/]+\/?$/.test(path))
    return "/tv/[id]/episode";
  if (/^\/profile\/[^/]+(?:\/(stats|activities|insights))?\/?$/.test(path))
    return "/profile/[id]";
  if (/^\/messages\/[^/]+\/?$/.test(path)) return "/messages/[id]";
  if (/^\/explore\/(movie|tv)\/[^/]+\/?$/.test(path))
    return "/explore/[type]/[category]";
  if (/^\/settings(?:\/[^/]+)?\/?$/.test(path))
    return "/settings";
  const pages = [
    "/",
    "/search",
    "/watchlist",
    "/watched",
    "/watching",
    "/feed",
    "/community",
    "/stats",
    "/profile",
    "/recommendations",
    "/calendar",
    "/upcoming-episodes",
    "/achievements",
    "/messages",
    "/notifications",
    "/taste-match",
    "/privacy",
    "/privacy-policy",
  ];
  return pages.includes(path) ? path : null;
}

export function analyticsDevice(agent: string) {
  if (/bot|crawler|spider|headless/i.test(agent)) return null;
  return /ipad|tablet/i.test(agent)
    ? "tablet"
    : /mobile|android|iphone/i.test(agent)
      ? "mobile"
      : "desktop";
}

export function countryLabel(code: string | null | undefined) {
  if (!code || code === "ZZ") return "Bilinmiyor";
  try {
    return new Intl.DisplayNames(["tr"], { type: "region" }).of(code) || code;
  } catch {
    return code;
  }
}
