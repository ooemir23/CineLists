"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function loginAsGuest() {
    const randomId = randomBytes(4).toString("hex");
    const guestEmail = `guest_${randomId}@guest.watchgo.local`;
    const guestName = `Misafir-${randomId}`;

    // Create guest user
    await prisma.user.create({
        data: {
            email: guestEmail,
            username: `guest_${randomId}`,
            name: guestName,
            image: null,
        },
    });

    // Sign in with these credentials - Auth.js will handle the redirect
    await signIn("email", {
        email: guestEmail,
        redirectTo: "/profile",
    });
}
