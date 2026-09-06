"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendMessage(receiverId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        return { error: "Mesaj göndermek için giriş yapmalısınız" };
    }

    if (!content.trim()) return { error: "Mesaj boş olamaz" };

    let senderId = session.user.id;
    const senderExists = await prisma.user.findUnique({ where: { id: senderId }, select: { id: true } });
    if (!senderExists && (session.user as any).email) {
        const dbUser = await prisma.user.findUnique({ where: { email: (session.user as any).email }, select: { id: true } });
        if (dbUser) senderId = dbUser.id;
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) return { error: "Alıcı kullanıcı bulunamadı." };

    await prisma.message.create({
        data: {
            senderId,
            receiverId,
            content: content.trim(),
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
        take: 50,
    });

    const conversations = new Map();

    messages.forEach((msg) => {
        const partner = msg.senderId === session.user?.id ? msg.receiver : msg.sender;
        if (partner && !conversations.has(partner.id)) {
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
