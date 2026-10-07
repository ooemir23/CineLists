"use server";

import { getServerCountry } from "@/lib/country";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
    name?: string;
    username?: string;
    bio?: string;
    image?: string;
}) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

    if (!data || typeof data !== "object") return { error: dict.common.errorOccurred };
    if (data.username !== undefined) {
        if (typeof data.username !== "string") return { error: dict.onboarding.invalidUsername };
        data.username = normalizeUsername(data.username);
        if (!isValidUsername(data.username)) return { error: dict.onboarding.invalidUsername };
    }
    if ((data.name !== undefined && (typeof data.name !== "string" || data.name.length > 100)) ||
        (data.bio !== undefined && (typeof data.bio !== "string" || data.bio.length > 1000)) ||
        (data.image !== undefined && (typeof data.image !== "string" || data.image.length > 2048 || (data.image !== "" && !/^https:\/\//.test(data.image))))) {
        return { error: dict.common.errorOccurred };
    }
    try {
        // If username is changing, check if it's already taken
        if (data.username) {
            const existingUser = await prisma.user.findFirst({
                where: { OR: [{ username: { equals: data.username, mode: "insensitive" } }, { usernameAliases: { some: { username: { equals: data.username, mode: "insensitive" } } } }] },
            });

            if (existingUser && existingUser.id !== session.user.id) {
                return { error: dict.onboarding.usernameTaken };
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

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: dict.onboarding.usernameTaken };
        }
        console.error("Profile update error:", error);
        return { error: dict.common.errorOccurred };
    }
}

export async function updateUserLocale(locale: "tr" | "en") {
    const session = await auth();
    if (!session?.user?.id) return { success: false };
    if (locale !== "tr" && locale !== "en") return { success: false };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { locale, country: await getServerCountry() },
        });
        return { success: true };
    } catch (error) {
        console.warn("Locale persist error:", error);
        return { success: false };
    }
}

export async function updatePrivacySettings(data: {
    isPrivate: boolean;
    showActivities: boolean;
    showStats: boolean;
}) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                isPrivate: data.isPrivate,
                showActivities: data.showActivities,
                showStats: data.showStats,
            },
        });

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Privacy update error:", error);
        return { error: dict.common.errorOccurred };
    }
}

export async function updateUserPreferences(data: {
    favoriteGenres: string[];
    platforms: string[];
}) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

    if (!data || !Array.isArray(data.favoriteGenres) || !Array.isArray(data.platforms) || data.favoriteGenres.length > 100 || data.platforms.length > 100 || [...data.favoriteGenres, ...data.platforms].some(id => typeof id !== "string" || !/^[1-9]\d{0,9}$/.test(id))) return { error: dict.onboarding.invalidPreferences };
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
        return { error: dict.common.errorOccurred };
    }
}

export async function deleteAccount() {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

    try {
        // Prisma cascade deletes should handle relations if configured, 
        // but let's be safe and ensure the user is deleted.
        await prisma.user.delete({
            where: { id: session.user.id },
        });

        return { success: true };
    } catch (error) {
        console.error("Account deletion error:", error);
        return { error: dict.common.errorOccurred };
    }
}

export async function suspendAccount() {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) return { error: dict.common.errorOccurred };

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
        return { error: dict.common.errorOccurred };
    }
}

export async function checkUsernameAvailability(username: string) {
    const dict = getDictionary(await getServerLocale());
    if (typeof username !== "string") return { available: false, message: dict.onboarding.invalidUsername };
    username = normalizeUsername(username);
    if (!isValidUsername(username)) return { available: false, message: dict.onboarding.invalidUsername };
    const session = await auth();
    const user = await prisma.user.findFirst({ where: { OR: [{ username: { equals: username, mode: "insensitive" } }, { usernameAliases: { some: { username: { equals: username, mode: "insensitive" } } } }] }, select: { id: true } });

    if (user) {
        if (session?.user?.id && user.id === session.user.id) {
            return { available: true };
        }
        return { available: false, message: dict.onboarding.usernameTaken };
    }

    return { available: true };
}
