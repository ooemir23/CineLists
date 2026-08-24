"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Guest users are not in DB, skip onboarding persistence
    if ((session.user as any).isGuest || session.user.id.startsWith("guest_")) {
        redirect("/");
    }

    const username = formData.get("username") as string;
    const favoriteGenres = formData.getAll("genres") as string[];
    const platforms = formData.getAll("platforms") as string[];
    const favoriteMediaIds = formData.getAll("favorites") as string[];

    const updateData: any = {
        favoriteGenres,
        platforms,
        favoriteMediaIds,
        hasCompletedOnboarding: true,
    };

    // Only update username if provided and not empty
    if (username && username.trim() !== "") {
        // Simple check: if username is taken, it will throw P2002. 
        // For onboarding, we'll try-catch or just use it.
        try {
            updateData.username = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
        } catch (_e) {
            // Fallback to default if there's an error
        }
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
        });
    } catch (error: any) {
        // If username exists, it will fail here. For now, we'll let it fail or handle P2002.
        if (error.code === 'P2002') {
            // User can try again if we implement error handling in the form, 
            // but for simplicity we'll just skip username update if it fails.
            delete updateData.username;
            await prisma.user.update({
                where: { id: session.user.id },
                data: updateData,
            });
        } else {
            throw error;
        }
    }

    revalidatePath("/");
    revalidatePath("/profile");
    redirect("/");
}
