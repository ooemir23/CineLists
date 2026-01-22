"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendMessage(receiverId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    if (!content.trim()) return { error: "Mesaj boş olamaz" };

    await prisma.message.create({
        data: {
            senderId: session.user.id,
            receiverId: receiverId,
            content: content,
        },
    });

    revalidatePath(`/messages/${receiverId}`);
    revalidatePath("/messages");

    return { success: true };
}

export async function getConversations() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Group messages to find unique conversation partners
    // This is tricky with Prisma. 
    // We can fetch recent messages where user is sender OR receiver.
    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: session.user.id },
                { receiverId: session.user.id },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            sender: { select: { id: true, name: true, image: true } },
            receiver: { select: { id: true, name: true, image: true } },
        },
        // We should probably distinct on partnerId but Prisma assumes distinct on columns.
        // Instead, we fetch many and process in JS for MVP.
        take: 50,
    });

    const conversations = new Map();

    messages.forEach((msg) => {
        const partner = msg.senderId === session.user?.id ? msg.receiver : msg.sender;
        if (!conversations.has(partner.id)) {
            conversations.set(partner.id, {
                partner,
                lastMessage: msg,
            });
        }
    });

    return Array.from(conversations.values());
}

export async function getMessages(partnerId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: session.user.id, receiverId: partnerId },
                { senderId: partnerId, receiverId: session.user.id },
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    // Mark as read (simple implementation, mark all received from partner as read)
    // This is a side effect in a GET, usually bad practice but for server component convenience...
    // Better to separate or handle cautiously.
    // Let's do a quick updateAsync but not await it to block? No, await needs to be safe.
    // We'll update only unread ones.
    await prisma.message.updateMany({
        where: {
            senderId: partnerId,
            receiverId: session.user.id,
            isRead: false
        },
        data: { isRead: true }
    });

    return messages;
}
