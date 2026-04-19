"use server";

import { signOut, auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginUser(formData: FormData) {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
        redirect("/login?error=missing");
    }

    try {
        await signIn("email", { email, password, redirectTo: "/onboarding" });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect("/login?error=invalid");
        }
        throw error;
    }
}

export async function registerUser(formData: FormData) {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();

    if (!email || !password || !name) {
        redirect("/register?error=missing");
    }

    if (password.length < 6) {
        redirect("/register?error=weak");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        redirect("/register?error=exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    await prisma.user.create({
        data: {
            email,
            username: email.split("@")[0] + "_" + Math.random().toString(36).slice(-4),
            name,
            password: hashedPassword,
        },
    });

    try {
        await signIn("email", { email, password, redirectTo: "/onboarding" });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect("/login?error=invalid");
        }
        throw error;
    }
}

export async function handleSignOut() {
    const session = await auth();
    const user = session?.user;

    if (user?.email?.endsWith("@guest.cinelists.local")) {
        try {
            // Delete the guest user from the database
            // onDelete: Cascade in schema.prisma will handle associated data
            await prisma.user.delete({
                where: { id: user.id },
            });
            console.log(`Guest user ${user.id} deleted successfully.`);
        } catch (error) {
            console.error("Error deleting guest user:", error);
        }
    }

    await signOut({ redirectTo: "/" });
}
