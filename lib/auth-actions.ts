"use server";

import { signOut, auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { sendPasswordResetEmail } from "./mail";
import crypto from "crypto";
import { safeInternalRedirect } from "@/lib/admin/policy";
import { checkRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import { getServerLocale } from "@/lib/i18n/server";

async function getClientIp() {
    const headersList = await headers();
    return headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function loginUser(formData: FormData) {
    const rawInput = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const rawCallbackUrl = String(formData.get("callbackUrl") || "");
    const callbackUrl = safeInternalRedirect(rawCallbackUrl);

    if (!rawInput || !password) {
        redirect("/login?error=missing");
    }

    const ip = await getClientIp();
    // Max 10 attempts per 5 minutes, keyed by IP + attempted account so a single
    // account can't be brute-forced and a single IP can't spray many accounts.
    const rateLimit = checkRateLimit(`login:${ip}:${rawInput.toLowerCase()}`, 10, 5 * 60 * 1000);
    if (!rateLimit.allowed) {
        redirect(`/login?error=ratelimit${rawCallbackUrl ? `&callbackUrl=${encodeURIComponent(rawCallbackUrl)}` : ""}`);
    }

    try {
        await signIn("email", { email: rawInput, password, redirectTo: callbackUrl });
    } catch (error) {
        if (error instanceof AuthError) {
            redirect(`/login?error=invalid${rawCallbackUrl ? `&callbackUrl=${encodeURIComponent(rawCallbackUrl)}` : ""}`);
        }
        const msg = (error as any)?.message || "";
        if (msg.includes("CredentialsSignin") || msg.includes("CallbackRouteError")) {
            redirect(`/login?error=invalid${rawCallbackUrl ? `&callbackUrl=${encodeURIComponent(rawCallbackUrl)}` : ""}`);
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

    const ip = await getClientIp();
    // Max 8 registrations per hour per IP to slow down mass account creation.
    const rateLimit = checkRateLimit(`register:${ip}`, 8, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
        redirect("/register?error=ratelimit");
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
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                name: resolvedName,
                password: hashedPassword,
                hasCompletedOnboarding: false,
            },
        });
        try {
            await prisma.userAdminProfile.create({ data: { userId: newUser.id, registeredAt: new Date() } });
        } catch { console.warn("[Admin] Registration analytics unavailable"); }
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
    const hasGoogleKeys = Boolean(
        (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID) &&
        (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET)
    );
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

    const ip = await getClientIp();
    // Max 3 reset requests per hour per IP+email so this can't be used to spam
    // a victim's inbox or brute-force account existence at volume.
    const rateLimit = checkRateLimit(`reset:${ip}:${email}`, 3, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
        // Same success response as the happy path: don't let response timing/shape
        // reveal whether the account exists or is just rate-limited.
        redirect("/forgot-password?success=sent");
    }

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
            // Don't reveal whether the account exists - respond exactly like the
            // success path so this endpoint can't be used to enumerate accounts.
            console.warn(`Password reset requested for non-existent email: ${rawEmail}`);
            redirect("/forgot-password?success=sent");
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

        // E-posta gönder (talebi yapan kişinin o an aktif olan arayüz diline göre)
        const locale = await getServerLocale();
        await sendPasswordResetEmail(userEmail, token, locale);
        
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
