import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

function firstEnv(...keys: string[]) {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) return value;
    }

    return undefined;
}

function readBuildId() {
    try {
        return readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
    } catch {
        return "unknown";
    }
}

export function GET() {
    return NextResponse.json(
        {
            app: "cinelists",
            commit: firstEnv("APP_COMMIT_SHA", "SOURCE_COMMIT", "GITHUB_SHA", "COMMIT_SHA", "GIT_HASH") ?? "unknown",
            deploymentId: firstEnv("APP_DEPLOYMENT_ID", "APP_COMMIT_SHA", "SOURCE_COMMIT", "GITHUB_SHA", "COMMIT_SHA", "GIT_HASH") ?? "unknown",
            nextBuildId: readBuildId(),
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
