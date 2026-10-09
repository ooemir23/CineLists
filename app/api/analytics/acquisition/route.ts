import { NextRequest, NextResponse } from "next/server";
import {
  ACQUISITION_COOKIE,
  ACQUISITION_MAX_AGE,
  normalizeAcquisition,
  readAcquisition,
  signAcquisition,
} from "@/lib/acquisition";
import { analyticsDevice, analyticsOriginAllowed } from "@/lib/admin/analytics";
import { readAnalyticsBody } from "@/lib/admin/request-body";
import { trustedClientIp } from "@/lib/auth-rate-limit";
import { checkRateLimit } from "@/lib/ratelimit";
export async function POST(request: NextRequest) {
  const response = () =>
    new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "private, no-store" },
    });
  if (!analyticsOriginAllowed(request.headers.get("origin"), request.url))
    return new NextResponse(null, { status: 403 });
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1" ||
    !analyticsDevice(request.headers.get("user-agent") || "")
  ) {
    const r = response();
    r.cookies.delete(ACQUISITION_COOKIE);
    return r;
  }
  if (readAcquisition(request.cookies.get(ACQUISITION_COOKIE)?.value))
    return response();
  if (
    !checkRateLimit(
      `acquisition:${trustedClientIp(request.headers)}`,
      20,
      60_000,
    ).allowed
  )
    return new NextResponse(null, { status: 429 });
  const body = await readAnalyticsBody(request);
  if (!body.ok) return new NextResponse(null, { status: body.status });
  const data = normalizeAcquisition(
    body.value,
    process.env.AUTH_URL || request.url,
  );
  const token = data && signAcquisition(data);
  const r = response();
  if (token)
    r.cookies.set(ACQUISITION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACQUISITION_MAX_AGE,
    });
  return r;
}
