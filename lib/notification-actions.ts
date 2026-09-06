"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const notifications = await prisma.indicates.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return notifications.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            link: n.link,
            isRead: n.isRead,
            image: n.image,
            createdAt: n.createdAt.toISOString()
        }));
    } catch (error) {
        console.warn("[Notifications] Error in getNotifications:", (error as Error)?.message || error);
        return [];
    }
}

export async function markNotificationAsRead(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.indicates.updateMany({
            where: { id, userId: session.user.id },
            data: { isRead: true },
        });

        revalidatePath("/notifications");
        return { success: true };
    } catch (_error) {
        return { success: false };
    }
}

export async function getUnreadNotificationCount() {
    try {
        const session = await auth();
        if (!session?.user?.id) return 0;

        const count = await prisma.indicates.count({
            where: {
                userId: session.user.id,
                isRead: false
            },
        });

        return count;
    } catch {
        return 0;
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const session = await auth();
        if (!session?.user?.id) return;

        await prisma.indicates.updateMany({
            where: {
                userId: session.user.id,
                isRead: false
            },
            data: { isRead: true },
        });

        revalidatePath("/notifications");
        revalidatePath("/", "layout");
    } catch {
        // Fallback gracefully
    }
}
