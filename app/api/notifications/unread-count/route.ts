import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ count: 0 });
        }

        const count = await prisma.indicates.count({
            where: {
                userId: session.user.id,
                isRead: false,
            },
        });

        return NextResponse.json(
            { count },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0, must-revalidate",
                },
            }
        );
    } catch {
        return NextResponse.json({ count: 0 });
    }
}
