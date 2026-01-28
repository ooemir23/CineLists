"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
    name?: string;
    username?: string;
    bio?: string;
    image?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    try {
        // If username is changing, check if it's already taken
        if (data.username) {
            const existingUser = await prisma.user.findUnique({
                where: { username: data.username },
            });

            if (existingUser && existingUser.id !== session.user.id) {
                return { error: "Bu kullanıcı adı zaten alınmış" };
            }
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                username: data.username,
                bio: data.bio,
                image: data.image,
            },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: "Bu kullanıcı adı zaten başka bir üye tarafından kullanılıyor" };
        }
        console.error("Profile update error:", error);
        return { error: "Profil güncellenirken bir hata oluştu" };
    }
}

export async function updatePrivacySettings(data: {
    isPrivate: boolean;
    showActivities: boolean;
    showStats: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                isPrivate: data.isPrivate,
                showActivities: data.showActivities,
                showStats: data.showStats,
            },
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Privacy update error:", error);
        return { error: "Gizlilik ayarları güncellenirken bir hata oluştu" };
    }
}

export async function updateUserPreferences(data: {
    favoriteGenres: string[];
    platforms: string[];
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                favoriteGenres: data.favoriteGenres,
                platforms: data.platforms,
            },
        });

        // Revalidate home page and profile to reflect changes in recommendations
        revalidatePath("/", "layout");
        revalidatePath("/profile");
        revalidatePath("/recommendations");

        return { success: true };
    } catch (error) {
        console.error("Preferences update error:", error);
        return { error: "Tercihler güncellenirken bir hata oluştu" };
    }
}

export async function deleteAccount() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    try {
        // Prisma cascade deletes should handle relations if configured, 
        // but let's be safe and ensure the user is deleted.
        await prisma.user.delete({
            where: { id: session.user.id },
        });

        return { success: true };
    } catch (error) {
        console.error("Account deletion error:", error);
        return { error: "Hesap silinirken bir hata oluştu" };
    }
}

export async function suspendAccount() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Giriş yapmalısınız" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                isSuspended: true,
                suspendedAt: new Date(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Account suspension error:", error);
        return { error: "Hesap askıya alınırken bir hata oluştu" };
    }
}

export async function checkUsernameAvailability(username: string) {
    if (!username || username.length < 3) return { available: false, message: "Kullanıcı adı en az 3 karakter olmalıdır" };

    const session = await auth();

    const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
    });

    if (user) {
        if (session?.user?.id && user.id === session.user.id) {
            return { available: true };
        }
        return { available: false, message: "Bu kullanıcı adı zaten alınmış" };
    }

    return { available: true };
}
