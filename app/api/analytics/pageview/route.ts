import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  analyticsCountry,
  analyticsDevice,
  analyticsPath,
  analyticsOriginAllowed,
} from "@/lib/admin/analytics";
import { createHash } from "node:crypto";
import { readAnalyticsBody } from "@/lib/admin/request-body";

export async function POST(request: Request) {
  if (process.env.ANALYTICS_ENABLED !== "true")
    return new Response(null, { status: 204 });
  if (!analyticsOriginAllowed(request.headers.get("origin"), request.url))
    return new Response(null, { status: 403 });
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1"
  )
    return new Response(null, { status: 204 });
  const device = analyticsDevice(request.headers.get("user-agent") || "");
  if (!device) return new Response(null, { status: 204 });
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(ip).digest("hex");
  if (!checkRateLimit(`analytics:${key}`, 120, 60000).allowed)
    return new Response(null, { status: 429 });
  try {
    const body = await readAnalyticsBody(request);
    if (!body.ok) return new Response(null, { status: body.status });
    const input = body.value;
    const path =
      input &&
      typeof input === "object" &&
      "path" in input &&
      typeof input.path === "string"
        ? analyticsPath(input.path)
        : null;
    if (!path) return new Response(null, { status: 204 });
    const session = await auth();
    const now = new Date();
    const day = new Date(now);
    day.setUTCHours(0, 0, 0, 0);
    const country = analyticsCountry(request.headers);
    const audience = session?.user?.id ? "member" : "guest";
    await prisma.analyticsDaily.upsert({
      where: {
        day_country_device_path_audience: {
          day,
          country,
          device,
          path,
          audience,
        },
      },
      create: { day, country, device, path, audience, views: 1 },
      update: { views: { increment: 1 } },
    });
    if (session?.user?.id) {
      await prisma.userAdminProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          lastSeenAt: now,
          country: country === "ZZ" ? null : country,
        },
        update: { lastSeenAt: now, ...(country !== "ZZ" ? { country } : {}) },
      });
    }
    return new Response(null, { status: 204 });
  } catch {
    // Missing migration / unavailable database must not break the application.
    return new Response(null, { status: 503 });
  }
}
