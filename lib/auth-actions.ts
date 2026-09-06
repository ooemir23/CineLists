"use server";

import { signOut, auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { sendPasswordResetEmail } from "./mail";
import crypto from "crypto";

export async function loginUser(formData: FormData) {
    const rawInput = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!rawInput || !password) {
        redirect("/login?error=missing");
    }

    try {
        await signIn("email", { email: rawInput, password, redirectTo: "/" });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect("/login?error=invalid");
        }
        const msg = (error as any)?.message || "";
        if (msg.includes("CredentialsSignin") || msg.includes("CallbackRouteError")) {
            redirect("/login?error=invalid");
        }
        throw error;
    }
}

export async function registerUser(formData: FormData) {
    const rawEmail = String(formData.get("email") || "").trim();
    const email = rawEmail.toLowerCase();
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
        existingUser = await prisma.user.findFirst({
            where: {
                email: { equals: email, mode: "insensitive" },
            },
        });
    } catch (error) {
        console.error("User lookup error during register:", error);
        redirect("/register?error=db");
    }

    if (existingUser) {
        redirect("/register?error=exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const resolvedName = name || email.split("@")[0] || "Kullanıcı";

    // Clean username
    const baseUsername = (name || email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
    let username = baseUsername || "user";

    try {
        const existingUsername = await prisma.user.findFirst({
            where: { username: { equals: username, mode: "insensitive" } },
        });
        if (existingUsername) {
            username = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
        }
    } catch (error) {
        console.error("Username uniqueness check error:", error);
    }

    // Create user in real PostgreSQL database
    try {
        await prisma.user.create({
            data: {
                email,
                username,
                name: resolvedName,
                password: hashedPassword,
                hasCompletedOnboarding: false,
            },
        });
    } catch (error: any) {
        if (error?.code === "P2002") {
            redirect("/register?error=exists");
        }
        console.error("Registration database error:", error);
        redirect("/register?error=unknown");
    }

    try {
        await signIn("email", { email, password, redirectTo: "/onboarding" });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect("/login?error=invalid");
        }
        const msg = (error as any)?.message || "";
        if (msg.includes("CredentialsSignin") || msg.includes("CallbackRouteError")) {
            redirect("/login?error=invalid");
        }
        throw error;
    }
}

export async function handleSignOut() {
    const session = await auth();
    const user = session?.user;

    if (user?.email?.endsWith("@guest.cinelists.local")) {
        console.log(`Guest user ${user.id} signing out.`);
    }

    await signOut({ redirectTo: "/" });
}

export async function signInWithGoogle() {
    const hasGoogleKeys = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    if (!hasGoogleKeys) {
        redirect("/login?error=OAuthNotConfigured");
    }
    await signIn("google", { redirectTo: "/onboarding" });
}

export async function requestPasswordReset(formData: FormData) {
    const rawEmail = String(formData.get("email") || "").trim();

    if (!rawEmail) {
        redirect("/forgot-password?error=missing");
    }

    const email = rawEmail.toLowerCase();

    try {
        // Case-insensitive lookup so users entering upper/mixed-case email always match
        const user = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: "insensitive"
                }
            }
        });

        if (!user || !user.email) {
            console.warn(`Password reset requested for non-existent email: ${rawEmail}`);
            redirect("/forgot-password?error=not-found");
        }

        const userEmail = user.email.toLowerCase();

        // 1 saat geçerli bir token oluştur
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600 * 1000);

        // Eski tokenları temizle ve yenisini kaydet
        await prisma.verificationToken.deleteMany({
            where: { identifier: userEmail }
        });

        await prisma.verificationToken.create({
            data: {
                identifier: userEmail,
                token,
                expires
            }
        });

        // E-posta gönder
        await sendPasswordResetEmail(userEmail, token);
        
        redirect("/forgot-password?success=sent");
    } catch (error: any) {
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        console.error("Password reset request error:", error);
        if (error?.message?.includes("E-posta")) {
            redirect("/forgot-password?error=mail");
        }
        redirect("/forgot-password?error=db");
    }
}

export async function resetPassword(formData: FormData) {
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const token = String(formData.get("token") || "").trim();

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
        
        // Find user case-insensitively
        const targetUser = await prisma.user.findFirst({
            where: {
                email: {
                    equals: verificationToken.identifier,
                    mode: "insensitive"
                }
            }
        });

        if (!targetUser) {
            redirect(`/reset-password?token=${token}&error=invalid`);
        }

        // Şifreyi güncelle (ID ile güvenli güncelleme)
        await prisma.user.update({
            where: { id: targetUser.id },
            data: { password: hashedPassword }
        });

        // Kullanılan token'ları sil
        await prisma.verificationToken.deleteMany({
            where: { identifier: verificationToken.identifier }
        });

        console.log(`Password reset successfully for user: ${targetUser.email}`);
        
        redirect("/login?reset=success");
    } catch (error) {
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        console.error("Password reset error:", error);
        redirect(`/reset-password?token=${token}&error=db`);
    }
}

