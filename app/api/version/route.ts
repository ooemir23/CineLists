import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function firstEnv(...keys: string[]) {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) return value;
    }

    return undefined;
}

export function GET() {
    return NextResponse.json(
        {
            app: "cinelists",
            commit: firstEnv("APP_COMMIT_SHA", "SOURCE_COMMIT", "GITHUB_SHA", "COMMIT_SHA") ?? "unknown",
            buildDate: firstEnv("APP_BUILD_DATE", "BUILD_DATE") ?? "unknown",
            container: process.env.HOSTNAME ?? "unknown",
            nodeEnv: process.env.NODE_ENV ?? "unknown",
        },
        {
            headers: {
                "Cache-Control": "no-store, max-age=0, must-revalidate",
            },
        }
    );
}
