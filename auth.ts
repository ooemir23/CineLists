import NextAuth from "next-auth";
import GoogleProperty from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [
            GoogleProperty({
                clientId: process.env.AUTH_GOOGLE_ID,
                clientSecret: process.env.AUTH_GOOGLE_SECRET,
            })
        ] : []),
        ...(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET ? [
            Apple({
                clientId: process.env.AUTH_APPLE_ID,
                clientSecret: process.env.AUTH_APPLE_SECRET,
            })
        ] : []),
        Credentials({
            id: "email",
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;
                const email = credentials.email as string;

                let user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) {
                    // IF GUEST: Don't create in DB
                    if (email.endsWith("@guest.watchgo.local")) {
                        return {
                            id: "guest_" + Math.random().toString(36).slice(-8),
                            email: email,
                            name: "Misafir",
                            username: "guest_" + Math.random().toString(36).slice(-4),
                            hasCompletedOnboarding: true, // Guests skip onboarding
                            isGuest: true
                        } as any;
                    }

                    const username = email.split("@")[0] + "_" + Math.random().toString(36).slice(-4);
                    user = await prisma.user.create({
                        data: {
                            email,
                            username: username,
                            name: email.split("@")[0],
                        },
                    });
                }

                return user;
            }
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;

                // If guest (id starts with guest_), don't check DB
                if (token.sub.startsWith("guest_") || (token as any).isGuest) {
                    (session.user as any).isGuest = true;
                    (session.user as any).hasCompletedOnboarding = true;
                    return session;
                }

                const dbUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { hasCompletedOnboarding: true }
                });

                if (dbUser) {
                    (session.user as any).hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
                }
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                (token as any).isGuest = (user as any).isGuest;
            }
            return token;
        },
    },
});
