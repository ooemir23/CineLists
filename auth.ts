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
            clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
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
            if (account?.provider === "google" && profile?.sub) {
                try {
                    if (user.email) {
                        const googleImage = (profile as any).picture || user.image;
                        const googleName = user.name || (profile as any).name;

                        console.log("[Google Auth] Profile sync:", { 
                            email: user.email, 
                            name: googleName, 
                            image: googleImage,
                            hasProfilePicture: !!(profile as any).picture,
                            hasUserImage: !!user.image
                        });

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
    logger: {
        error(code, ...message) {
            console.error("Auth.js Error:", code, ...message);
        },
        warn(code) {
            console.warn("Auth.js Warning:", code);
        },
        debug(code, ...message) {
            if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEBUG === "true") {
                console.log("Auth.js Debug:", code, ...message);
            }
        }
    },
});
