"use server";

import { signOut, auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { sendPasswordResetEmail } from "./mail";
import crypto from "crypto";

function isPrismaConnectionError(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) return true;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") return true;
    if (error instanceof Error && error.message.includes("Can't reach database server")) return true;
    return false;
}

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

    if (!email || !password) {
        redirect("/register?error=missing");
    }

    if (password.length < 6) {
        redirect("/register?error=weak");
    }

    // Check if user already exists
    let existingUser = null;
    try {
        existingUser = await prisma.user.findUnique({
            where: { email },
        });
    } catch (error) {
        if (isPrismaConnectionError(error)) {
            redirect("/register?error=db");
        }
        throw error;
    }

    if (existingUser) {
        redirect("/register?error=exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const resolvedName = name || email.split("@")[0] || "Kullanici";

    // Generate unique username
    const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
    const username = baseUsername + "_" + Math.random().toString(36).slice(-4);

    // Create user
    try {
        await prisma.user.create({
            data: {
                email,
                username,
                name: resolvedName,
                password: hashedPassword,
            },
        });
    } catch (error: any) {
        if (isPrismaConnectionError(error)) {
            redirect("/register?error=db");
        }
        if (error.code === 'P2002') {
            redirect("/register?error=exists");
        }
        console.error("Registration error:", error);
        redirect("/register?error=unknown");
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

export async function handleSignOut() {
    const session = await auth();
    const user = session?.user;

    if (user?.email?.endsWith("@guest.cinelists.local")) {
        // Guest users are not persisted in DB (JWT-only), no cleanup needed
        console.log(`Guest user ${user.id} signing out.`);
    }

    await signOut({ redirectTo: "/" });
}

export async function signInWithGoogle() {
    await signIn("google", { redirectTo: "/onboarding" });
}

export async function requestPasswordReset(formData: FormData) {
    const email = String(formData.get("email") || "").trim();

    if (!email) {
        redirect("/forgot-password?error=missing");
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Güvenlik nedeniyle e-posta gönderildi mesajı veriyoruz
            redirect("/forgot-password?success=sent");
        }

        // 1 saat geçerli bir token oluştur
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600 * 1000);

        // Eski tokenları temizle ve yenisini kaydet
        await prisma.verificationToken.deleteMany({
            where: { identifier: email }
        });

        await prisma.verificationToken.create({
            data: {
                identifier: email,
                token,
                expires
            }
        });

        // E-posta gönder
        await sendPasswordResetEmail(email, token);
        
        redirect("/forgot-password?success=sent");
    } catch (error) {
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        console.error("Password reset request error:", error);
        redirect("/forgot-password?error=db");
    }
}

export async function resetPassword(formData: FormData) {
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const token = String(formData.get("token") || "");

    if (!password || !confirmPassword || !token) {
        redirect(`/reset-password?token=${token}&error=missing`);
    }

    if (password !== confirmPassword) {
        redirect(`/reset-password?token=${token}&error=mismatch`);
    }

    if (password.length < 6) {
        redirect(`/reset-password?token=${token}&error=weak`);
    }

    try {
        // Token'ı doğrula
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
            redirect(`/reset-password?token=${token}&error=invalid`);
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Şifreyi güncelle
        await prisma.user.update({
            where: { email: verificationToken.identifier },
            data: { password: hashedPassword }
        });

        // Kullanılan token'ı sil
        await prisma.verificationToken.delete({
            where: { token }
        });

        console.log(`Password reset successfully for user: ${verificationToken.identifier}`);
        
        redirect("/login?reset=success");
    } catch (error) {
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        console.error("Password reset error:", error);
        redirect(`/reset-password?token=${token}&error=db`);
    }
}

