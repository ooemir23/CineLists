"use server";

import { discoveryAnswer } from "@/lib/acquisition";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";

export async function completeOnboarding(formData: FormData) {
    const dict = getDictionary(await getServerLocale());
    const session = await auth();
    if (!session?.user?.id) {
        return { error: dict.onboarding.signInRequired };
    }

    // Guest users are not in DB, skip onboarding persistence
    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        redirect("/");
    }

    const rawDiscovery = formData.get("discoveryAnswer");
    const answer = discoveryAnswer(rawDiscovery);
    if (rawDiscovery && !answer) return { error: dict.acquisition.invalidAnswer };

    const rawUsername = formData.get("username");
    if (rawUsername !== null && typeof rawUsername !== "string") {
        return { error: dict.onboarding.invalidUsername };
    }
    const username = normalizeUsername(rawUsername || "");
    if (username && !isValidUsername(username)) {
        return { error: dict.onboarding.invalidUsername };
    }

    const favoriteGenres = formData.getAll("genres");
    const platforms = formData.getAll("platforms");
    const validIds = (values: FormDataEntryValue[]) =>
        values.length <= 100 && values.every(value =>
            typeof value === "string" && /^[1-9]\d{0,9}$/.test(value));
    if (!validIds(favoriteGenres) || !validIds(platforms)) {
        return { error: dict.onboarding.invalidPreferences };
    }

    const updateData: Prisma.UserUpdateInput = {
        favoriteGenres: [...new Set(favoriteGenres as string[])],
        platforms: [...new Set(platforms as string[])],
        hasCompletedOnboarding: true,
        ...(username ? { username } : {}),
        ...(answer ? { adminProfile: { upsert: { create: { discoveryAnswer: answer }, update: { discoveryAnswer: answer } } } } : {}),
    };

    try {
        if (username) {
            const existing = await prisma.user.findFirst({
                where: { OR: [{ username: { equals: username, mode: "insensitive" } }, { usernameAliases: { some: { username: { equals: username, mode: "insensitive" } } } }] },
                select: { id: true },
            });
            if (existing && existing.id !== session.user.id) {
                return { error: dict.onboarding.usernameTaken };
            }
        }
        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return { error: dict.onboarding.usernameTaken };
        }
        console.error("Onboarding update error:", error);
        return { error: dict.onboarding.saveError };
    }

    revalidatePath("/", "layout");
    revalidatePath("/profile");
    redirect("/");
}

export async function skipOnboarding() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    redirect("/");
}
