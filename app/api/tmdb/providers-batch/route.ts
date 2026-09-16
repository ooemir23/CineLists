import { NextRequest, NextResponse } from "next/server";
import { cachedGetWatchProviders } from "@/lib/watch-provider-cache";
import { detectUserCountry } from "@/lib/country";

export async function GET(request: NextRequest) {
    const tokens = request.nextUrl.searchParams.get("items")?.split(",") || [];
    if (!tokens.length || tokens.length > 20 || tokens.some(token => !/^(movie|tv):[1-9]\d{0,9}$/.test(token))) {
        return NextResponse.json({ error: "Geçersiz içerik listesi" }, { status: 400 });
    }
    const requestedCountry = request.nextUrl.searchParams.get("country") || "";
    const country = /^[A-Z]{2}$/.test(requestedCountry) ? requestedCountry : detectUserCountry(request.headers);
    const entries = await Promise.all([...new Set(tokens)].map(async token => {
        const [type, id] = token.split(":");
        try {
            const data = await cachedGetWatchProviders(type as "movie" | "tv", id);
            const providers = data?.results?.[country]?.flatrate;
            return [token, providers?.length ? { flatrate: providers.slice(0, 5) } : null];
        } catch {
            return [token, null];
        }
    }));
    return NextResponse.json({ providers: Object.fromEntries(entries), country }, {
        headers: { "Cache-Control": "private, max-age=3600" }
    });
}
