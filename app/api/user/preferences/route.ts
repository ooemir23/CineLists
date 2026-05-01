import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                favoriteGenres: true,
                platforms: true,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
