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
    session: { strategy: "jwt" },
    providers: [
        Google, // Auth.js v5 automatically looks for AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
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

                // Guest login bypasses DB and password checks
                if (email.endsWith("@guest.cinelists.local")) {
                    return {
                        id: "guest_" + Math.random().toString(36).slice(-8),
                        email: email,
                        name: "Misafir",
                        username: "guest_" + Math.random().toString(36).slice(-4),
                        hasCompletedOnboarding: true,
                        isGuest: true
                    } as any;
                }

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
            // Guest users must never be persisted to the database.
            // Returning false here prevents PrismaAdapter from creating a DB
            // record. The jwt callback handles guest token creation separately.
            if ((user as any).isGuest || user.id?.startsWith("guest_")) {
                return false;
            }

            // Google ile giriş yapılırken profil verilerini senkronize et
            if (account?.provider === "google" && profile?.sub) {
                try {
                    // Sadece kullanıcı ID'si varsa (zaten kayıtlıysa) güncelleme yap
                    if (user.id) {
                        const googleImage = (profile as any).picture || user.image;
                        const googleName = user.name || (profile as any).name;

                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
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

                // If guest (id starts with guest_), don't check DB
                if (token.sub.startsWith("guest_") || (token as any).isGuest) {
                    session.user.name = (token as any).guestName ?? session.user.name;
                    session.user.email = (token as any).guestEmail ?? session.user.email;
                    (session.user as any).isGuest = true;
                    (session.user as any).hasCompletedOnboarding = true;
                    return session;
                }

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
        async jwt({ token, user, trigger }) {
            // Guest users: signIn callback returns false to block DB persistence,
            // so we must build the guest token here directly from the user object
            // returned by authorize, before the adapter is ever invoked.
            if (user && ((user as any).isGuest || user.id?.startsWith("guest_"))) {
                token.sub = user.id ?? token.sub;
                (token as any).isGuest = true;
                (token as any).guestName = user.name;
                (token as any).guestEmail = user.email;
                return token;
            }

            if (user) {
                (token as any).isGuest = false;
            }
            return token;
        },
    },
});
