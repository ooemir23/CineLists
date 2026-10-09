import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

export const ACQUISITION_COOKIE = "cinelists_acquisition";
export const DISCOVERY_COOKIE = "cinelists_discovery";
export const ACQUISITION_MAX_AGE = 30 * 24 * 60 * 60;
export const DISCOVERY_OPTIONS = [
  "google",
  "instagram",
  "youtube",
  "tiktok",
  "x",
  "facebook",
  "friend",
  "other",
] as const;
export const SOURCE_OPTIONS = [
  "google",
  "bing",
  "instagram",
  "youtube",
  "tiktok",
  "x",
  "facebook",
  "other",
  "direct",
] as const;
export type Acquisition = {
  source: string;
  medium: string | null;
  campaign: string | null;
  referrerHost: string | null;
  capturedAt: number;
};

export function discoveryAnswer(value: unknown): string | null {
  return typeof value === "string" &&
    DISCOVERY_OPTIONS.some((option) => option === value)
    ? value
    : null;
}
function tag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 &&
    trimmed.length <= 80 &&
    /^[\p{L}\p{N} ._-]+$/u.test(trimmed)
    ? trimmed
    : null;
}
export function normalizeAcquisition(
  input: unknown,
  ownOrigin: string,
  now = Date.now(),
): Acquisition | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  let host: string | null = null;
  if (typeof data.referrer === "string" && data.referrer.length <= 2048) {
    try {
      const referrer = new URL(data.referrer),
        own = new URL(ownOrigin);
      if (
        ["https:", "http:"].includes(referrer.protocol) &&
        referrer.hostname.replace(/^www\./, "") !==
          own.hostname.replace(/^www\./, "") &&
        !referrer.username &&
        !referrer.password &&
        !isIP(referrer.hostname.replace(/^\[|\]$/g, ""))
      )
        host = referrer.hostname
          .toLowerCase()
          .replace(/^www\./, "")
          .slice(0, 253);
    } catch {
      /* Missing or malformed referrers stay unknown. */
    }
  }
  const rawSource = tag(data.source)?.toLowerCase() || null;
  const utmSource = rawSource === "unknown" ? "other" : rawSource;
  // Internal navigation without campaign data is not a new first touch.
  if (!utmSource && typeof data.referrer === "string" && data.referrer) {
    try {
      if (
        new URL(data.referrer).hostname.replace(/^www\./, "") ===
        new URL(ownOrigin).hostname.replace(/^www\./, "")
      )
        return null;
    } catch {
      /* Treat as missing. */
    }
  }
  const domain = (name: string) =>
    host === name || !!host?.endsWith("." + name);
  const inferred = /(^|\.)google\.[a-z.]+$/.test(host || "")
    ? "google"
    : domain("bing.com")
      ? "bing"
      : domain("instagram.com")
        ? "instagram"
        : domain("youtube.com") || domain("youtu.be")
          ? "youtube"
          : domain("tiktok.com")
            ? "tiktok"
            : domain("twitter.com") || domain("x.com") || domain("t.co")
              ? "x"
              : domain("facebook.com") || domain("fb.com")
                ? "facebook"
                : host
                  ? "other"
                  : "direct";
  const aliases: Record<string, string> = {
    ig: "instagram",
    fb: "facebook",
    twitter: "x",
  };
  return {
    source: utmSource ? aliases[utmSource] || utmSource : inferred,
    medium: tag(data.medium),
    campaign: tag(data.campaign),
    referrerHost: host,
    capturedAt: now,
  };
}
function secret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}
export function signAcquisition(data: Acquisition): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return (
    payload +
    "." +
    createHmac("sha256", key).update(payload).digest("base64url")
  );
}
export function readAcquisition(
  value: string | undefined,
  now = Date.now(),
): Acquisition | null {
  const key = secret();
  if (!value || !key || value.length > 1500) return null;
  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", key).update(payload).digest(),
      actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as Acquisition;
    if (
      !Number.isFinite(data.capturedAt) ||
      data.capturedAt > now ||
      now - data.capturedAt > ACQUISITION_MAX_AGE * 1000 ||
      !tag(data.source)
    )
      return null;
    return data;
  } catch {
    return null;
  }
}
export function acquisitionProfile(data: Acquisition | null) {
  return data
    ? {
        acquisitionSource: data.source,
        acquisitionMedium: data.medium,
        acquisitionCampaign: data.campaign,
        referrerHost: data.referrerHost,
        acquisitionCapturedAt: new Date(data.capturedAt),
      }
    : {};
}
