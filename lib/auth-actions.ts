"use server";

import { signOut, auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password || !name) {
        throw new Error("Tüm alanları doldurun");
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("Bu e-posta adresi zaten kayıtlı");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            username: email.split("@")[0] + "_" + Math.random().toString(36).slice(-4),
            name,
            password: hashedPassword,
        },
    });

    // Sign in the user
    await signIn("email", { email, password, redirectTo: "/onboarding" });
}

export async function handleSignOut() {
    const session = await auth();
    const user = session?.user;

    if (user?.email?.endsWith("@guest.watchgo.local")) {
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
