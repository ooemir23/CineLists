/**
 * Country detection and localization helper for Watch Providers and Geo filtering
 */

export const COUNTRY_NAMES_TR: Record<string, string> = {
    TR: "Türkiye",
    US: "ABD",
    GB: "İngiltere",
    UK: "İngiltere",
    DE: "Almanya",
    FR: "Fransa",
    ES: "İspanya",
    IT: "İtalya",
    CA: "Kanada",
    NL: "Hollanda",
    AU: "Avustralya",
    JP: "Japonya",
    KR: "Güney Kore",
    BR: "Brezilya",
    MX: "Meksika",
    IN: "Hindistan",
    RU: "Rusya",
    AZ: "Azerbaycan",
    IE: "İrlanda",
    SE: "İsveç",
    NO: "Norveç",
    DK: "Danimarka",
    FI: "Finlandiya",
    BE: "Belçika",
    AT: "Avusturya",
    CH: "İsviçre",
    PL: "Polonya",
    PT: "Portekiz",
    GR: "Yunanistan",
    NZ: "Yeni Zelanda",
};

export const COUNTRY_NAMES_EN: Record<string, string> = {
    TR: "Turkey",
    US: "United States",
    GB: "United Kingdom",
    UK: "United Kingdom",
    DE: "Germany",
    FR: "France",
    ES: "Spain",
    IT: "Italy",
    CA: "Canada",
    NL: "Netherlands",
    AU: "Australia",
    JP: "Japan",
    KR: "South Korea",
    BR: "Brazil",
    MX: "Mexico",
    IN: "India",
    RU: "Russia",
    AZ: "Azerbaijan",
    IE: "Ireland",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    FI: "Finland",
    BE: "Belgium",
    AT: "Austria",
    CH: "Switzerland",
    PL: "Poland",
    PT: "Portugal",
    GR: "Greece",
    NZ: "New Zealand",
};

/**
 * Pre-defined Turkish locative forms (e.g. İngiltere'de, Almanya'da, ABD'de)
 */
const COUNTRY_LOCATIVES_TR: Record<string, string> = {
    TR: "Türkiye'de",
    US: "ABD'de",
    GB: "İngiltere'de",
    UK: "İngiltere'de",
    DE: "Almanya'da",
    FR: "Fransa'da",
    ES: "İspanya'da",
    IT: "İtalya'da",
    CA: "Kanada'da",
    NL: "Hollanda'da",
    AU: "Avustralya'da",
    JP: "Japonya'da",
    KR: "Güney Kore'de",
    BR: "Brezilya'da",
    MX: "Meksika'da",
    IN: "Hindistan'da",
    RU: "Rusya'da",
    AZ: "Azerbaycan'da",
    IE: "İrlanda'da",
    SE: "İsveç'te",
    NO: "Norveç'te",
    DK: "Danimarka'da",
    FI: "Finlandiya'da",
    BE: "Belçika'da",
    AT: "Avusturya'da",
    CH: "İsviçre'de",
    PL: "Polonya'da",
    PT: "Portekiz'de",
    GR: "Yunanistan'da",
    NZ: "Yeni Zelanda'da",
};

/**
 * Detect user country code (2-letter ISO) from request headers and cookies
 */
export function detectUserCountry(
    headers: Headers,
    cookiesObj?: { get?: (name: string) => { value: string } | undefined }
): string {
    // 1. Check direct cookies
    if (cookiesObj && typeof cookiesObj.get === "function") {
        const cookieVal = cookiesObj.get("NEXT_COUNTRY")?.value;
        if (cookieVal && /^[A-Z]{2}$/i.test(cookieVal)) {
            return cookieVal.toUpperCase();
        }
    }

    // Also check raw Cookie header
    const cookieHeader = headers.get("cookie");
    if (cookieHeader) {
        const match = cookieHeader.match(/(?:^|;\s*)NEXT_COUNTRY=([A-Za-z]{2})/);
        if (match && match[1]) {
            return match[1].toUpperCase();
        }
    }

    // 2. Check direct CDN / Hosting Geo headers
    const geoHeader =
        headers.get("cf-ip-country") ||
        headers.get("x-vercel-ip-country") ||
        headers.get("x-country-code") ||
        headers.get("cloudfront-viewer-country") ||
        headers.get("x-geo-country") ||
        headers.get("x-user-country");

    if (geoHeader && geoHeader.length === 2 && geoHeader !== "XX" && geoHeader !== "T1") {
        return geoHeader.toUpperCase();
    }

    // 3. Fallback to Accept-Language header (e.g. "en-GB,en;q=0.9" -> "GB", "en-US,en;q=0.9" -> "US", "tr-TR,tr;q=0.9" -> "TR")
    const acceptLanguage = headers.get("accept-language");
    if (acceptLanguage) {
        const match = acceptLanguage.match(/\b[a-zA-Z]{2,3}[-_]([A-Za-z]{2})\b/);
        if (match && match[1]) {
            const langCountry = match[1].toUpperCase();
            if (langCountry.length === 2) {
                return langCountry;
            }
        }
    }

    return "TR";
}

/**
 * Get client-side user country from cookie or browser locale
 */
export function getClientUserCountry(): string {
    if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)NEXT_COUNTRY=([A-Za-z]{2})/);
        if (match && match[1]) {
            return match[1].toUpperCase();
        }
        if (typeof navigator !== "undefined" && navigator.language) {
            const parts = navigator.language.split("-");
            if (parts.length > 1 && parts[1].length === 2) {
                return parts[1].toUpperCase();
            }
        }
    }
    return "TR";
}

/**
 * Get server-side user country from cookies or headers
 */
export async function getServerCountry(): Promise<string> {
    try {
        const { cookies, headers } = await import("next/headers");
        const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
        const cookieVal = cookieStore.get("NEXT_COUNTRY")?.value;
        if (cookieVal && /^[A-Z]{2}$/i.test(cookieVal)) {
            return cookieVal.toUpperCase();
        }
        return detectUserCountry(headersList, cookieStore);
    } catch {
        return "TR";
    }
}

/**
 * Get localized display name for a country code
 */
export function getCountryName(countryCode: string, locale: string = "tr"): string {
    const code = (countryCode || "TR").toUpperCase();
    if (locale === "en") {
        return COUNTRY_NAMES_EN[code] || code;
    }
    return COUNTRY_NAMES_TR[code] || code;
}

/**
 * Get Turkish locative form (e.g. İngiltere'de, Almanya'da, ABD'de)
 */
export function getCountryLocative(countryCode: string): string {
    const code = (countryCode || "TR").toUpperCase();
    if (COUNTRY_LOCATIVES_TR[code]) {
        return COUNTRY_LOCATIVES_TR[code];
    }
    const name = COUNTRY_NAMES_TR[code] || code;
    // Basic Turkish vowel harmony fallback
    const lastVowel = name.match(/[aıoueiöüAIOUEİÖÜ](?=[^aıoueiöüAIOUEİÖÜ]*$)/)?.[0]?.toLowerCase();
    const isBack = lastVowel && ["a", "ı", "o", "u"].includes(lastVowel);
    const suffix = isBack ? "'da" : "'de";
    return `${name}${suffix}`;
}

/**
 * Get country badge label for card thumbnails
 * (e.g. "İngiltere'de Yok", "Türkiye'de Yok", or "Not in UK")
 */
export function getCountryBadgeLabel(countryCode: string, locale: string = "tr"): string {
    const code = (countryCode || "TR").toUpperCase();
    if (locale === "en") {
        if (code === "GB" || code === "UK") return "Not in UK";
        if (code === "US") return "Not in US";
        return `Not in ${COUNTRY_NAMES_EN[code] || code}`;
    }
    return `${getCountryLocative(code)} Yok`;
}

