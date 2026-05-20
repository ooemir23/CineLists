import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";

// Read env vars at module load time
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

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

            if (account?.provider === "google" && profile?.sub) {
                try {
                    if (user.email) {
                        const googleImage = (profile as any).picture || user.image;
                        const googleName = user.name || (profile as any).name;

                        await prisma.user.upsert({
                            where: { email: user.email },
                            update: {
                                name: googleName || undefined,
                                image: googleImage || undefined,
                            },
                            create: {
                                email: user.email,
                                name: googleName || undefined,
                                image: googleImage || undefined,
                            },
                        });
                    }
                } catch (error) {
                    console.error("[Auth] Google profile sync error:", error);
                    // Don't block sign in on sync failure
                }
            }
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
        async jwt({ token }) {
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
