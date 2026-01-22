"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function loginAsGuest() {
    try {
        const randomId = randomBytes(4).toString("hex");
        const guestEmail = `guest_${randomId}@guest.watchgo.local`;
        const guestName = `Misafir-${randomId}`;

        // Create guest user
        await prisma.user.create({
            data: {
                email: guestEmail,
                name: guestName,
                image: null,
            },
        });

        // Sign in with these credentials, catching the redirect
        await signIn("credentials", {
            email: guestEmail,
            redirectTo: "/profile",
        });

    } catch (error) {
        // NextAuth throws error on redirect, which is expected behavior
        if ((error as Error).message === "NEXT_REDIRECT") {
            throw error;
        }
        console.error("Guest login error:", error);
        throw new Error("Misafir girişi başarısız oldu.");
    }
}
