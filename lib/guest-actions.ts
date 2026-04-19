"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function loginAsGuest() {
    const randomId = randomBytes(4).toString("hex");
    const guestEmail = `guest_${randomId}@guest.cinelists.local`;

    // Sign in with these credentials - Auth.js will handle the user creation/login
    // But we will intercept this in auth.ts to prevent DB persistence for guests
    await signIn("email", {
        email: guestEmail,
        redirectTo: "/",
    });
}
