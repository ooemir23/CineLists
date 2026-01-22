"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const notifications = await prisma.indicates.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    return notifications;
}

export async function getUnreadNotificationCount() {
    const session = await auth();
    if (!session?.user?.id) return 0;

    const count = await prisma.indicates.count({
        where: {
            userId: session.user.id,
            isRead: false
        },
    });

    return count;
}

export async function markAllNotificationsAsRead() {
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
    revalidatePath("/", "layout"); // Update sidebar count if possible
}
