import { NextRequest, NextResponse } from "next/server";
import { getFriendsActivity } from "@/lib/feed-actions";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const maxItems = Math.max(1, Math.min(Number(searchParams.get("maxItems") || "6"), 20));

    try {
        const activities = await getFriendsActivity();
        const results = activities.slice(0, maxItems);

        return NextResponse.json(
            { results },
            {
                headers: {
                    "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
                },
            }
        );
    } catch (error) {
        console.error("Error fetching friends activity:", error);
        return NextResponse.json({ results: [] }, { status: 500 });
    }
}
