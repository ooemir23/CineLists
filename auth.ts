import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
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
const isProduction = process.env.NODE_ENV === "production";
const hasGoogleAuth = Boolean(googleClientId && googleClientSecret);

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    secret: authSecret,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
        ...(hasGoogleAuth ? [
            Google({
                clientId: googleClientId!,
                clientSecret: googleClientSecret!,
                allowDangerousEmailAccountLinking: true,
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code",
                    },
                },
            }),
        ] : []),
        Credentials({
            id: "email",
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;
                const email = (credentials.email as string).trim().toLowerCase();
                const password = credentials.password as string | undefined;
                if (!password) return null;

                try {
                    const user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (user?.password) {
                        const isValidPassword = await bcrypt.compare(password, user.password);
                        if (isValidPassword) return user;
                        return null;
                    }
                } catch (error) {
                    console.error("[Auth] Database authorize error:", error);
                    return null;
                }

                return null;
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
                if (token.name) session.user.name = token.name;
                if (token.email) session.user.email = token.email;
                if (token.picture) session.user.image = token.picture as string;
                if ((token as any).username) (session.user as any).username = (token as any).username;
                (session.user as any).hasCompletedOnboarding = (token as any).hasCompletedOnboarding ?? false;
                (session.user as any).isSuspended = (token as any).isSuspended ?? false;
            }
            return session;
        },
        async jwt({ token, user, trigger, session, account }) {
            if (user) {
                if (account && account.provider !== "credentials" && user.email) {
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { email: user.email },
                            select: { id: true, name: true, email: true, username: true, image: true, hasCompletedOnboarding: true, isSuspended: true }
                        });
                        if (dbUser) {
                            token.sub = dbUser.id;
                            token.name = dbUser.name;
                            token.email = dbUser.email;
                            token.picture = dbUser.image;
                            (token as any).username = dbUser.username;
                            (token as any).hasCompletedOnboarding = dbUser.hasCompletedOnboarding ?? false;
                            (token as any).isSuspended = dbUser.isSuspended ?? false;
                            return token;
                        }
                    } catch (e) {
                        console.error("[Auth] DB lookup error in jwt callback:", e);
                    }
                }

                token.sub = user.id;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
                if ((user as any).username) (token as any).username = (user as any).username;
                (token as any).hasCompletedOnboarding = (user as any).hasCompletedOnboarding ?? false;
                (token as any).isSuspended = (user as any).isSuspended ?? false;
            }
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }
            return token;
        },
    },
    events: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "google" || !user.id) return;

            try {
                const googleProfile = profile as { name?: string; picture?: string } | undefined;

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        name: user.name || googleProfile?.name || undefined,
                        image: user.image || googleProfile?.picture || undefined,
                    },
                });
            } catch (error) {
                console.error("[Auth] Google profile sync error:", error);
            }
        },
    },
    logger: {
        error(code, ...message) {
            console.error("[Auth.js Error]", code, message.map((rawItem) => {
                const item = rawItem as unknown;
                if (item instanceof Error) {
                    return {
                        name: item.name,
                        message: item.message,
                        stack: item.stack,
                    };
                }

                return typeof item === "string" ? item : "[details hidden]";
            }));
        },
        warn(code) {
            console.warn("[Auth.js Warning]", code);
        },
        debug(code, ...message) {
            if (isProduction) return;
            console.log("[Auth.js Debug]", code, ...message);
        }
    },
});
