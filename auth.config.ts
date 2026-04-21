import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const protectedRoutes = ["/profile", "/watchlist", "/watched", "/feed", "/notifications", "/community", "/messages", "/stats", "/recommendations", "/lists", "/achievements", "/calendar"];
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
