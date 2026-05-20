import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";

function firstEnv(...keys: string[]) {
    for (const key of keys) {
        const value = process.env[key]?.trim();
        if (value) return value;
    }
    return undefined;
}

const authSecret = firstEnv("AUTH_SECRET", "NEXTAUTH_SECRET");
const googleClientId = firstEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID", "GOOGLE_ID");

if (!googleClientId) {
    console.warn("[Auth] Google Identity Services env is incomplete. Expected AUTH_GOOGLE_ID.");
}

type GoogleTokenInfo = {
    aud?: string;
    audience?: string;
    issued_to?: string;
    sub?: string;
    user_id?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
    picture?: string;
};

async function verifyGoogleAccessToken(accessToken: string) {
    if (!googleClientId) return null;

    const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`, {
        cache: "no-store",
    });

    if (!tokenInfoResponse.ok) return null;

    const tokenInfo = (await tokenInfoResponse.json()) as GoogleTokenInfo;
    const tokenAudience = tokenInfo.aud || tokenInfo.audience || tokenInfo.issued_to;

    if (tokenAudience !== googleClientId) {
        return null;
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        cache: "no-store",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!profileResponse.ok) return null;

    const profile = (await profileResponse.json()) as GoogleTokenInfo;
    const isVerified = profile.email_verified === true || profile.email_verified === "true";

    if (!profile.sub || !profile.email || !isVerified) return null;

    return profile;
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    secret: authSecret,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
        Credentials({
            id: "google-identity",
            name: "Google",
            credentials: {
                accessToken: { label: "Access Token", type: "text" },
            },
            async authorize(credentials) {
                const accessToken = credentials?.accessToken as string | undefined;
                if (!accessToken) return null;

                const profile = await verifyGoogleAccessToken(accessToken);
                if (!profile) return null;
                const email = profile.email;
                if (!email) return null;

                const user = await prisma.user.upsert({
                    where: { email },
                    update: {
                        name: profile.name || undefined,
                        image: profile.picture || undefined,
                    },
                    create: {
                        email,
                        name: profile.name || email.split("@")[0],
                        image: profile.picture || undefined,
                    },
                });

                return user;
            },
        }),
        Credentials({
            id: "email",
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;
                const email = credentials.email as string;

                const password = credentials.password as string | undefined;
                if (!password) return null;

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user?.password) return null;

                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) return null;

                return user;
            }
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            console.log("[Auth] signIn callback:", {
                provider: account?.provider,
                email: user?.email,
                hasSub: !!(profile as any)?.sub || !!user?.id,
            });

            return true;
        },

        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;

                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.sub },
                        select: {
                            hasCompletedOnboarding: true,
                            isSuspended: true,
                            name: true,
                            image: true,
                        }
                    });

                    if (dbUser) {
                        (session.user as any).hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
                        (session.user as any).isSuspended = dbUser.isSuspended;
                        // Session'da güncel profil verilerini tut
                        session.user.name = dbUser.name;
                        session.user.image = dbUser.image;
                    }
                } catch (error) {
                    console.error("[Auth] Session DB lookup error:", error);
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user?.id) {
                token.sub = user.id;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
            }

            return token;
        },
    },
    logger: {
        error(code, ...message) {
            console.error("[Auth.js Error]", code, JSON.stringify(message, null, 2));
        },
        warn(code) {
            console.warn("[Auth.js Warning]", code);
        },
        debug(code, ...message) {
            console.log("[Auth.js Debug]", code, ...message);
        }
    },
});
