import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ items: [], unreadCount: 0 });
        }

        const [items, unreadCount] = await Promise.all([
            prisma.indicates.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
                take: 6,
            }),
            prisma.indicates.count({
                where: { userId: session.user.id, isRead: false },
            }),
        ]);

        return NextResponse.json(
            {
                items: items.map((n) => ({
                    id: n.id,
                    type: n.type,
                    message: n.message,
                    link: n.link,
                    isRead: n.isRead,
                    image: n.image,
                    createdAt: n.createdAt.toISOString(),
                })),
                unreadCount,
            },
            {
                headers: {
                    "Cache-Control": "no-store, max-age=0, must-revalidate",
                },
            }
        );
    } catch {
        return NextResponse.json({ items: [], unreadCount: 0 });
    }
}
