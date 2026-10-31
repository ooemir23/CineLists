import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { detectUserCountry } from "./lib/country";

export default NextAuth(authConfig).auth((req) => {
  const host = req.headers.get("host") || "";
  if (host.startsWith("www.cinelists.com")) {
    const url = req.nextUrl.clone();
    url.host = "cinelists.com";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, { status: 301 });
  }

  const isLoggedIn = !!req.auth?.user;
  const pathname = req.nextUrl.pathname;
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const destination =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  const existingCookie = req.cookies.get("NEXT_COUNTRY")?.value;
  const country =
    existingCookie && /^[A-Z]{2}$/i.test(existingCookie)
      ? existingCookie.toUpperCase()
      : detectUserCountry(req.headers, req.cookies);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-country", country);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!existingCookie || existingCookie !== country) {
    response.cookies.set("NEXT_COUNTRY", country, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
    });
  }

  return response;
});

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

