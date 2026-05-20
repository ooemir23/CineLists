import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function hasAnyEnv(...keys: string[]) {
    return keys.some((key) => !!process.env[key]?.trim());
}

export async function GET() {
    const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "NOT SET";

    const config = {
        NODE_ENV: process.env.NODE_ENV,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        authSecretLength: process.env.AUTH_SECRET?.length || 0,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleId: hasAnyEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID", "GOOGLE_ID"),
        googleIdSource: process.env.AUTH_GOOGLE_ID ? "AUTH_GOOGLE_ID" : process.env.GOOGLE_CLIENT_ID ? "GOOGLE_CLIENT_ID" : process.env.GOOGLE_ID ? "GOOGLE_ID" : "MISSING",
        hasGoogleSecret: hasAnyEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET", "GOOGLE_SECRET"),
        googleSecretSource: process.env.AUTH_GOOGLE_SECRET ? "AUTH_GOOGLE_SECRET" : process.env.GOOGLE_CLIENT_SECRET ? "GOOGLE_CLIENT_SECRET" : process.env.GOOGLE_SECRET ? "GOOGLE_SECRET" : "MISSING",
        authUrl: process.env.AUTH_URL || "NOT SET",
        nextAuthUrl: process.env.NEXTAUTH_URL || "NOT SET",
        expectedGoogleRedirectUri: authUrl === "NOT SET" ? "NOT SET" : `${authUrl.replace(/\/$/, "")}/api/auth/callback/google`,
        trustHost: process.env.AUTH_TRUST_HOST || "NOT SET",
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(config);
}
