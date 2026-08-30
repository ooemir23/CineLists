/**
 * Country detection and localization helper for Watch Providers and Geo filtering
 */

const COUNTRY_NAMES: Record<string, string> = {
    TR: "Türkiye",
    US: "ABD",
    GB: "İngiltere",
    DE: "Almanya",
    FR: "Fransa",
    ES: "İspanya",
    IT: "İtalya",
    CA: "Kanada",
    NL: "Hollanda",
    AU: "Avustralya",
    JP: "Japonya",
    KR: "G. Kore",
    BR: "Brezilya",
    MX: "Meksika",
    IN: "Hindistan",
    RU: "Rusya",
};

/**
 * Detect user country code (2-letter ISO) from request headers
 */
export function detectUserCountry(headers: Headers, defaultCountry = "TR"): string {
    // 1. Check direct Cloudflare / Vercel / AWS / Nginx geo headers
    const geoHeader =
        headers.get("cf-ip-country") ||
        headers.get("x-vercel-ip-country") ||
        headers.get("x-country-code") ||
        headers.get("cloudfront-viewer-country") ||
        headers.get("x-geo-country");

    if (geoHeader && geoHeader.length === 2 && geoHeader !== "XX" && geoHeader !== "T1") {
        return geoHeader.toUpperCase();
    }

    // 2. Fallback to Accept-Language header (e.g. "en-US,en;q=0.9" -> "US", "tr-TR,tr;q=0.9" -> "TR")
    const acceptLanguage = headers.get("accept-language");
    if (acceptLanguage) {
        const match = acceptLanguage.match(/[-_]([A-Za-z]{2})\b/);
        if (match && match[1]) {
            const langCountry = match[1].toUpperCase();
            if (langCountry.length === 2) {
                return langCountry;
            }
        }
    }

    return defaultCountry;
}

/**
 * Get localized display name for a country code
 */
export function getCountryName(countryCode: string): string {
    return COUNTRY_NAMES[countryCode.toUpperCase()] || countryCode.toUpperCase();
}

/**
 * Get Turkish prepositional suffix for country code / name
 * (e.g. TR -> "TR'de", US -> "US'de", DE -> "DE'de")
 */
export function getCountryBadgeLabel(countryCode: string): string {
    const code = (countryCode || "TR").toUpperCase();
    return `${code}'de Yok`;
}
