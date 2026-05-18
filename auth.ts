import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" },
    providers: [
        Google({
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
            // Google ile giriş yapılırken profil verilerini senkronize et
            if (account?.provider === "google" && profile?.sub) {
                try {
                    // Use email as the unique identifier — it is always present for
                    // Google OAuth users and is set on the record created by
                    // PrismaAdapter, making it reliable for both new and existing users.
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
                    console.error("Google profil senkronizasyon hatası:", error);
                    // Hata olsa bile giriş işlemine devam et (return true)
                }
            }
            return true;
        },

        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;

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
            }
            return session;
        },
        async jwt({ token }) {
            return token;
        },
    },
});
