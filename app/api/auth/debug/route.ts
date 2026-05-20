import { NextResponse } from "next/server";

// Debug endpoint to verify auth configuration at runtime
// Remove this in production after debugging
export async function GET() {
    const config = {
        NODE_ENV: process.env.NODE_ENV,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        authSecretLength: process.env.AUTH_SECRET?.length || 0,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
        googleIdPrefix: process.env.AUTH_GOOGLE_ID?.substring(0, 15) || "MISSING",
        hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
        googleSecretPrefix: process.env.AUTH_GOOGLE_SECRET?.substring(0, 8) || "MISSING",
        authUrl: process.env.AUTH_URL || "NOT SET",
        nextAuthUrl: process.env.NEXTAUTH_URL || "NOT SET",
        trustHost: process.env.AUTH_TRUST_HOST || "NOT SET",
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString(),
    };

    return NextResponse.json(config);
}
