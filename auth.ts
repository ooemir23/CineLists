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

if (!googleClientId || !googleClientSecret) {
    console.warn("[Auth] Google provider env is incomplete. Expected AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET.");
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    secret: authSecret,
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            allowDangerousEmailAccountLinking: true,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                };
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
                const email = (credentials.email as string).trim();
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
                } catch {
                    // DB offline fallback
                }

                // If DB is offline in development, log the user in with their entered email
                if (!isProduction) {
                    return {
                        id: `dev_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
                        name: email.split("@")[0] || "Emir",
                        email: email,
                        image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
                    };
                }

                return null;
            }
        }),
        Credentials({
            id: "dev-login",
            name: "Dev Login",
            credentials: {},
            async authorize() {
                // Yerel geliştirme ortamında Google OAuth yapılandırılmamışsa veya localhost testinde
                return {
                    id: "local_dev_user_emir",
                    name: "Emir (Admin / Local Dev)",
                    email: "emir@cinelists.com",
                    image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
                };
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
                (session.user as any).hasCompletedOnboarding = (token as any).hasCompletedOnboarding ?? true;
                (session.user as any).isSuspended = (token as any).isSuspended ?? false;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.name = user.name;
                token.email = user.email;
                token.picture = user.image;
                (token as any).hasCompletedOnboarding = (user as any).hasCompletedOnboarding ?? true;
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
