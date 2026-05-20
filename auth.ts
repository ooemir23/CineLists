import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
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
const googleClientSecret = firstEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET", "GOOGLE_SECRET");

if (!googleClientId || !googleClientSecret) {
    console.warn("[Auth] Google provider env is incomplete. Expected AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET.");
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    secret: authSecret,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
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
                hasSub: !!(profile as any)?.sub,
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
        async jwt({ token, user, account, profile }) {
            if (account?.provider === "google" && user?.email) {
                const googleProfile = profile as { name?: string; picture?: string } | undefined;

                const dbUser = await prisma.user.upsert({
                    where: { email: user.email },
                    update: {
                        name: user.name || googleProfile?.name || undefined,
                        image: user.image || googleProfile?.picture || undefined,
                    },
                    create: {
                        email: user.email,
                        name: user.name || googleProfile?.name || user.email.split("@")[0],
                        image: user.image || googleProfile?.picture || undefined,
                    },
                });

                token.sub = dbUser.id;
                token.name = dbUser.name;
                token.email = dbUser.email;
                token.picture = dbUser.image;
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
