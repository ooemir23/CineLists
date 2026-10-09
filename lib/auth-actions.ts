"use server";

import { registrationAcquisition } from "@/lib/acquisition-server";
import { discoveryAnswer, DISCOVERY_COOKIE } from "@/lib/acquisition";
import { signOut, auth, signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { sendPasswordResetEmail } from "./mail";
import crypto from "crypto";
import { safeInternalRedirect } from "@/lib/admin/policy";
import { checkRateLimit } from "@/lib/ratelimit";
import { headers, cookies } from "next/headers";
import { withUserTransaction } from "@/lib/user-transaction";
import { getServerCountry } from "@/lib/country";
import { trustedClientIp } from "@/lib/auth-rate-limit";
import { getServerLocale } from "@/lib/i18n/server";

async function getClientIp() {
    const headersList = await headers();
    return trustedClientIp(headersList);
}

export async function loginUser(formData: FormData) {
    const rawInput = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const rawCallbackUrl = String(formData.get("callbackUrl") || "");
    const callbackUrl = safeInternalRedirect(rawCallbackUrl);

    if (!rawInput || !password) {
        redirect("/login?error=missing");
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
    const rawDiscovery = formData.get("discoveryAnswer");
    const answer = discoveryAnswer(rawDiscovery);
    if (rawDiscovery && !answer) redirect("/register?error=discovery");

    if (!email || !password) {
        redirect("/register?error=missing");
    }

    if (password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
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
            where: { OR: [{ username: { equals: username, mode: "insensitive" } }, { usernameAliases: { some: { username: { equals: username, mode: "insensitive" } } } }] },
        });
        if (existingUsername) {
            username = `${username}_${crypto.randomBytes(4).toString("hex")}`;
        }
    } catch (error) {
        console.error("Username uniqueness check error:", error);
    }

    // Create user in real PostgreSQL database
    const locale = await getServerLocale();
    const country = await getServerCountry();
    const acquisition = await registrationAcquisition();
    for (let attempt = 0; attempt < 4; attempt++) {
        try {
            const newUser = await prisma.user.create({
                data: { email, username, name: resolvedName, password: hashedPassword,
                    hasCompletedOnboarding: false, locale, country },
            });
            try {
                await prisma.userAdminProfile.create({ data: { userId: newUser.id, registeredAt: new Date(), ...acquisition, discoveryAnswer: answer } });
            } catch { console.warn("[Admin] Registration analytics unavailable"); }
            break;
        } catch (error: unknown) {
            const conflict = error as { code?: string; meta?: { target?: unknown } };
            if (conflict.code === "P2002") {
                if (String(conflict.meta?.target).toLowerCase().includes("username") && attempt < 3) {
                    username = `${baseUsername || "user"}_${crypto.randomBytes(4).toString("hex")}`;
                    const reserved = await prisma.user.findFirst({
                        where: { OR: [{ username: { equals: username, mode: "insensitive" } }, { usernameAliases: { some: { username: { equals: username, mode: "insensitive" } } } }] },
                        select: { id: true },
                    });
                    if (reserved) redirect("/register?error=unknown");
                    continue;
                }
                redirect("/register?error=exists");
            }
            console.error("Registration database error:", error);
            redirect("/register?error=unknown");
        }
    }

    try {
        await signIn("email", { email, password, redirectTo: "/" });
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

export async function signInWithGoogle(formData?: FormData) {
    const hasGoogleKeys = Boolean(
        (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID) &&
        (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET)
    );
    if (!hasGoogleKeys) {
        redirect("/login?error=OAuthNotConfigured");
    }
    const rawAnswer = formData?.get("discoveryAnswer"), answer = discoveryAnswer(rawAnswer);
    if (rawAnswer && !answer) redirect("/register?error=discovery");
    const cookieStore = await cookies();
    if (answer) cookieStore.set(DISCOVERY_COOKIE, answer, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
    else cookieStore.delete(DISCOVERY_COOKIE);
    await signIn("google", { redirectTo: "/" });
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
    const checks = [checkRateLimit(`reset:ip:${ip}`, 20, 60 * 60 * 1000), checkRateLimit(`reset:account:${email}`, 3, 60 * 60 * 1000), checkRateLimit(`reset:pair:${ip}:${email}`, 3, 60 * 60 * 1000)];
    const rateLimit = { allowed: checks.every(result => result.allowed) };
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
            redirect("/forgot-password?success=sent");
        }

        const userEmail = user.email.toLowerCase();

        // 1 saat geçerli bir token oluştur
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 3600 * 1000);

        await withUserTransaction(user.id, async tx => {
            await tx.verificationToken.deleteMany({ where: { identifier: userEmail } });
            await tx.verificationToken.create({ data: {
                identifier: userEmail,
                token: crypto.createHash("sha256").update(token).digest("hex"), expires,
            } });
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
        redirect(`/reset-password?token=${encodeURIComponent(token)}&error=missing`);
    }

    if (password !== confirmPassword) {
        redirect(`/reset-password?token=${encodeURIComponent(token)}&error=mismatch`);
    }

    if (password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
        redirect(`/reset-password?token=${encodeURIComponent(token)}&error=weak`);
    }

    if (!/^[a-f0-9]{64}$/.test(token)) redirect("/reset-password?error=invalid");
    const ip = await getClientIp();
    if (!checkRateLimit(`reset:consume:${ip}`, 20, 5 * 60_000).allowed) redirect("/reset-password?error=invalid");
    try {
        // Token'ı doğrula
        const verificationToken = await prisma.verificationToken.findUnique({
            where: { token: crypto.createHash("sha256").update(token).digest("hex") }
        });

        if (!verificationToken || verificationToken.expires < new Date()) {
            redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
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
            redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid`);
        }

        const consumed = await prisma.$transaction(async tx => {
            const result = await tx.verificationToken.deleteMany({ where: {
                token: verificationToken.token, expires: { gt: new Date() },
            } });
            if (result.count !== 1) return false;
            await tx.user.update({ where: { id: targetUser.id }, data: {
                password: hashedPassword, sessionVersion: { increment: 1 },
            } });
            await tx.session.deleteMany({ where: { userId: targetUser.id } });
            await tx.verificationToken.deleteMany({ where: { identifier: verificationToken.identifier } });
            return true;
        });
        if (!consumed) redirect(`/reset-password?token=${encodeURIComponent(token)}&error=invalid`);

        redirect("/login?reset=success");
    } catch (error) {
        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
            throw error;
        }
        console.error("Password reset error:", error);
        redirect(`/reset-password?token=${encodeURIComponent(token)}&error=db`);
    }
}
