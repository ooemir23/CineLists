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
    let sender = await prisma.user.findUnique({ where: { id: senderId }, select: { id: true, name: true, username: true, image: true } });
    if (!sender && (session.user as any).email) {
        sender = await prisma.user.findUnique({ where: { email: (session.user as any).email }, select: { id: true, name: true, username: true, image: true } });
        if (sender) senderId = sender.id;
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
    if (!receiver) return { error: "Alıcı kullanıcı bulunamadı." };

    const trimmedContent = content.trim();

    await prisma.message.create({
        data: {
            senderId,
            receiverId,
            content: trimmedContent,
        },
    });

    if (senderId !== receiverId) {
        try {
            const senderName = sender?.name || (sender?.username ? `@${sender.username}` : "Birisi");
            const preview = trimmedContent.length > 60 ? `${trimmedContent.slice(0, 60)}...` : trimmedContent;
            const notifMessage = `${senderName} sana mesaj gönderdi: "${preview}"`;
            const link = `/messages/${senderId}`;

            // Consolidate rapid messages from the same sender into a single
            // unread notification instead of flooding the list with one per message.
            const existing = await prisma.indicates.findFirst({
                where: { userId: receiverId, type: "NEW_MESSAGE", isRead: false, link },
            });

            if (existing) {
                await prisma.indicates.update({
                    where: { id: existing.id },
                    data: { message: notifMessage, image: sender?.image, createdAt: new Date() },
                });
            } else {
                await prisma.indicates.create({
                    data: {
                        userId: receiverId,
                        type: "NEW_MESSAGE",
                        message: notifMessage,
                        link,
                        image: sender?.image,
                    },
                });
            }
        } catch (notifErr) {
            console.warn("[Messages] Notification creation warning:", notifErr);
        }
    }

    revalidatePath(`/messages/${receiverId}`);
    revalidatePath("/messages");

    return { success: true };
}

export async function getConversations() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userId = session.user.id;

    // Get the latest message per conversation partner (not just the latest 50
    // messages overall, which could drop older/quieter conversations from the list
    // once a single partner sends 50+ new messages).
    const latestPerPartner = await prisma.$queryRaw<
        { id: string; senderId: string; receiverId: string; content: string; createdAt: Date; isRead: boolean; partnerId: string }[]
    >`
        SELECT DISTINCT ON (partner_id) id, "senderId", "receiverId", content, "createdAt", "isRead", partner_id AS "partnerId"
        FROM (
            SELECT
                m.*,
                CASE WHEN m."senderId" = ${userId} THEN m."receiverId" ELSE m."senderId" END AS partner_id
            FROM "Message" m
            WHERE m."senderId" = ${userId} OR m."receiverId" = ${userId}
        ) sub
        ORDER BY partner_id, "createdAt" DESC
    `;

    if (latestPerPartner.length === 0) return [];

    const partnerIds = latestPerPartner.map((m) => m.partnerId);
    const partners = await prisma.user.findMany({
        where: { id: { in: partnerIds } },
        select: { id: true, name: true, image: true },
    });
    const partnerById = new Map(partners.map((p) => [p.id, p]));

    return latestPerPartner
        .map((msg) => {
            const partner = partnerById.get(msg.partnerId);
            if (!partner) return null;
            return { partner, lastMessage: msg };
        })
        .filter((c): c is { partner: (typeof partners)[number]; lastMessage: typeof latestPerPartner[number] } => c !== null)
        .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
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

    // Opening the conversation also clears the consolidated message
    // notification for this sender, so the bell badge stays in sync.
    await prisma.indicates.updateMany({
        where: {
            userId: session.user.id,
            type: "NEW_MESSAGE",
            link: `/messages/${partnerId}`,
            isRead: false,
        },
        data: { isRead: true },
    }).catch(() => {});

    return messages;
}
