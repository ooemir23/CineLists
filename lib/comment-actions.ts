"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addPersonComment(personId: number, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    if (!content.trim()) {
        return { error: "Yorum boş olamaz" };
    }

    try {
        await prisma.comment.create({
            data: {
                userId: session.user.id,
                personId,
                content: content.trim(),
            },
        });

        revalidatePath(`/person/${personId}`);
        return { success: true };
    } catch (error) {
        console.error("Error adding person comment:", error);
        return { error: "Yorum eklenirken bir hata oluştu" };
    }
}

export async function getPersonComments(personId: number) {
    try {
        const comments = await prisma.comment.findMany({
            where: { personId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return comments;
    } catch (error) {
        console.error("Error fetching person comments:", error);
        return [];
    }
}
