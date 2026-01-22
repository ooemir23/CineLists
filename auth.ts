import NextAuth from "next-auth";
import GoogleProperty from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    providers: [
        GoogleProperty({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
        Credentials({
            id: "guest",
            name: "Guest",
            credentials: {
                email: { label: "Email", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                // Trust the server action to verify/create the user before calling signIn
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (user && user.email?.endsWith("@guest.watchgo.local")) {
                    return user;
                }
                return null;
            }
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token }) {
            return token;
        },
    },
});
