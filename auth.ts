import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";
import { allowCredentialAttempt } from "@/lib/auth-rate-limit";
import { getServerCountry } from "@/lib/country";
import { getServerLocale } from "@/lib/i18n/server";

if (!process.env.AUTH_TRUST_HOST) {
  process.env.AUTH_TRUST_HOST = "true";
}

if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
  const isProd = process.env.NODE_ENV === "production";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (isProd ? "https://cinelists.com" : "http://localhost:3000");
  process.env.AUTH_URL = appUrl;
  process.env.NEXTAUTH_URL = appUrl;
}

function firstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

const googleClientId = firstEnv(
  "AUTH_GOOGLE_ID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_ID",
);
const googleClientSecret = firstEnv(
  "AUTH_GOOGLE_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_SECRET",
);
const isProduction = process.env.NODE_ENV === "production";
const hasGoogleAuth = Boolean(googleClientId && googleClientSecret);

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    ...(hasGoogleAuth
      ? [
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
        ]
      : []),
    Credentials({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const rawIdentifier = String(credentials?.email || "").trim();
        const password = credentials?.password as string | undefined;
        if (
          !rawIdentifier ||
          rawIdentifier.length > 254 ||
          !password ||
          Buffer.byteLength(password, "utf8") > 72
        )
          return null;

        const normalizedEmail = rawIdentifier.toLowerCase();
        const turkishNormalized = rawIdentifier
          .replace(/I/g, "i")
          .replace(/İ/g, "i")
          .replace(/ı/g, "i")
          .toLowerCase();

        try {
          if (!(await allowCredentialAttempt(rawIdentifier, request.headers)))
            return null;
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: { equals: rawIdentifier, mode: "insensitive" } },
                { email: { equals: normalizedEmail, mode: "insensitive" } },
                { email: { equals: turkishNormalized, mode: "insensitive" } },
                { username: { equals: rawIdentifier, mode: "insensitive" } },
                { username: { equals: normalizedEmail, mode: "insensitive" } },
              ],
            },
          });

          if (!user) {
            return null;
          }

          if (user.isSuspended) return null;
          if (!user.password) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (isValidPassword) {
            return user;
          }

          return null;
        } catch (error) {
          console.error("[Auth] Database authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      if (user.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isSuspended: true },
        });
        if (currentUser?.isSuspended) return false;
      }
      return true;
    },

    async session({ session, token }) {
      if (!session) {
        session = {
          expires: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        } as any;
      }
      if (!session.user) {
        session.user = {} as any;
      }

      if (token) {
        try {
          let dbUser = null;

          // 1. Find by token.sub (Prisma User ID)
          if (token.sub) {
            dbUser = await prisma.user.findUnique({
              where: { id: token.sub },
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                image: true,
                hasCompletedOnboarding: true,
                isSuspended: true,
                sessionVersion: true,
              },
            });
          }

          if (dbUser) {
            if (
              dbUser.isSuspended ||
              (token.sessionVersion ?? 0) !== dbUser.sessionVersion
            )
              return { expires: session.expires } as any;
            session.user.id = dbUser.id;
            session.user.name =
              dbUser.name || (token.name as string) || dbUser.username || "";
            session.user.email = dbUser.email || (token.email as string) || "";
            session.user.image =
              dbUser.image || (token.picture as string) || null;
            if (dbUser.username)
              (session.user as any).username = dbUser.username;
            (session.user as any).hasCompletedOnboarding =
              dbUser.hasCompletedOnboarding ?? false;
            (session.user as any).isSuspended = dbUser.isSuspended ?? false;
          } else {
            // User does not exist in DB (stale cookie from previous DB / deleted user)
            return { expires: session.expires } as any;
          }
        } catch (error) {
          console.error("[Auth] Session validation error:", error);
          return { expires: session.expires } as any;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account && account.provider !== "credentials" && user.email) {
          try {
            const dbUser = await prisma.user.findFirst({
              where: {
                email: {
                  equals: user.email,
                  mode: "insensitive",
                },
              },
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
                image: true,
                hasCompletedOnboarding: true,
                isSuspended: true,
                sessionVersion: true,
              },
            });
            if (dbUser) {
              token.sessionVersion = dbUser.sessionVersion;
              token.sub = dbUser.id;
              token.name = dbUser.name;
              token.email = dbUser.email;
              token.picture = dbUser.image;
              (token as any).username = dbUser.username;
              (token as any).hasCompletedOnboarding =
                dbUser.hasCompletedOnboarding ?? false;
              (token as any).isSuspended = dbUser.isSuspended ?? false;

              // Ensure UserAdminProfile exists with registeredAt for OAuth users
              try {
                const profile = await prisma.userAdminProfile.findUnique({
                  where: { userId: dbUser.id },
                });
                if (!profile) {
                  await prisma.userAdminProfile.create({
                    data: {
                      userId: dbUser.id,
                      registeredAt: new Date(),
                    },
                  });
                }
              } catch (profErr) {
                console.warn(
                  "[Auth] Failed to initialize UserAdminProfile:",
                  profErr,
                );
              }

              return token;
            }
          } catch (e) {
            console.error("[Auth] DB lookup error in jwt callback:", e);
          }
        }

        token.sessionVersion = (user as any).sessionVersion ?? 0;
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        if ((user as any).username)
          (token as any).username = (user as any).username;
        (token as any).hasCompletedOnboarding =
          (user as any).hasCompletedOnboarding ?? false;
        (token as any).isSuspended = (user as any).isSuspended ?? false;
      }
      // Never merge client session updates into identity/authorization claims.
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            locale: await getServerLocale(),
            country: await getServerCountry(),
          },
        });
        await prisma.userAdminProfile.upsert({
          where: { userId: user.id },
          create: { userId: user.id, registeredAt: new Date() },
          update: {},
        });
      } catch {
        console.warn("[Admin] Registration analytics unavailable");
      }
    },
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user.id) return;

      try {
        const googleProfile = profile as
          | { name?: string; picture?: string }
          | undefined;

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
      console.error(
        "[Auth.js Error]",
        code,
        message.map((rawItem) => {
          const item = rawItem as unknown;
          if (item instanceof Error) {
            return {
              name: item.name,
              message: item.message,
              stack: item.stack,
            };
          }

          return typeof item === "string" ? item : "[details hidden]";
        }),
      );
    },
    warn(code) {
      console.warn("[Auth.js Warning]", code);
    },
    debug(code, ...message) {
      if (isProduction) return;
      console.log("[Auth.js Debug]", code, ...message);
    },
  },
});
