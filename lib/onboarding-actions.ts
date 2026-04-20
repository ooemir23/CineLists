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

    const favoriteGenres = formData.getAll("genres") as string[];
    const platforms = formData.getAll("platforms") as string[];

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            favoriteGenres,
            platforms,
            hasCompletedOnboarding: true,
        },
    });

    revalidatePath("/");
    revalidatePath("/profile");
    redirect("/");
}
