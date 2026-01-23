"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFavoritePerson(personId: number, name: string, profilePath: string | null) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Giriş yapmalısınız" };
    }

    const existing = await prisma.favoritePerson.findUnique({
        where: {
            userId_tmdbId: {
                userId: session.user.id,
                tmdbId: personId,
            },
        },
    });

    if (existing) {
        await prisma.favoritePerson.delete({
            where: { id: existing.id },
        });
        revalidatePath(`/person/${personId}`);
        revalidatePath("/profile");
        return { isFavorite: false };
    } else {
        await prisma.favoritePerson.create({
            data: {
                userId: session.user.id,
                tmdbId: personId,
                name: name,
                profilePath: profilePath,
            },
        });
        revalidatePath(`/person/${personId}`);
        revalidatePath("/profile");
        return { isFavorite: true };
    }
}

export async function getIsFavoritePerson(personId: number) {
    const session = await auth();
    if (!session?.user?.id) return false;

    const favorite = await prisma.favoritePerson.findUnique({
        where: {
            userId_tmdbId: {
                userId: session.user.id,
                tmdbId: personId,
            },
        },
    });

    return !!favorite;
}
