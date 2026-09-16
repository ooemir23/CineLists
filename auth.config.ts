import type { NextAuthConfig } from "next-auth";

if (!process.env.AUTH_TRUST_HOST) {
    process.env.AUTH_TRUST_HOST = "true";
}

const fallbackSecret = "cinelists-secret-key-development-2026-auth-3891724";

export const authConfig = {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || fallbackSecret,
    trustHost: true,
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedRoutes = ["/profile", "/watchlist", "/watched", "/feed", "/notifications", "/community", "/messages", "/stats", "/recommendations", "/lists", "/achievements"];
            const isProtectedRoute = protectedRoutes.some(route => nextUrl.pathname.startsWith(route));

            if (isProtectedRoute) {
                if (!isLoggedIn) return false; // Redirect unauthenticated users to login page
                return true;
            }
            return true;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
