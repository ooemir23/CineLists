import { NextResponse } from "next/server";

function firstEnv(...keys: string[]) {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) return value;
    }
    return undefined;
}

export function GET() {
    const clientId = firstEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID", "GOOGLE_ID");

    if (!clientId) {
        return NextResponse.json({ error: "Google client id is not configured." }, { status: 500 });
    }

    return NextResponse.json({ clientId });
}
