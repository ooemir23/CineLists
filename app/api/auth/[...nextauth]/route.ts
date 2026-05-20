import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

function redirectLegacyGoogleOAuth(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const isLegacyGoogleRoute =
        pathname.endsWith("/api/auth/signin/google") ||
        pathname.endsWith("/api/auth/callback/google");

    if (!isLegacyGoogleRoute) return null;

    const url = new URL("/login", request.url);
    url.searchParams.set("error", "google-legacy-oauth");
    return NextResponse.redirect(url);
}

export function GET(request: NextRequest) {
    return redirectLegacyGoogleOAuth(request) ?? handlers.GET(request);
}

export function POST(request: NextRequest) {
    return redirectLegacyGoogleOAuth(request) ?? handlers.POST(request);
}
