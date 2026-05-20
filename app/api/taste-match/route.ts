import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculateTasteMatch, getTopTasteMatches, getMyTasteProfile } from "@/lib/taste-match-actions";

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get("userId");
    const action = searchParams.get("action") || "match";

    try {
        if (action === "profile") {
            const profile = await getMyTasteProfile();
            return NextResponse.json(profile);
        }

        if (action === "top") {
            const limit = parseInt(searchParams.get("limit") || "10");
            const matches = await getTopTasteMatches(session.user.id, limit);
            return NextResponse.json({ matches });
        }

        if (targetUserId) {
            const match = await calculateTasteMatch(session.user.id, targetUserId);
            return NextResponse.json(match);
        }

        return NextResponse.json({ error: "Geçersiz parametre" }, { status: 400 });
    } catch (error) {
        console.error("Taste match API error:", error);
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
    }
}