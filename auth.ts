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
        async jwt({ token }) {
            return token;
        },
    },
});
