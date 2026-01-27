import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { checkRateLimit } from "./lib/ratelimit";

export default NextAuth(authConfig).auth;

export async function middleware(request: any) {
  // Rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
    const { allowed, remaining, resetTime } = checkRateLimit(`api-${ip}`, 100, 3600000) // 100 requests per hour

    if (!allowed) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetTime.toString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      })
    }
  }

  // Let NextAuth handle authentication
  return NextAuth(authConfig).auth(request)
}

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
