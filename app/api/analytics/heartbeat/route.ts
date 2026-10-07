import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  analyticsCountry,
  analyticsDevice,
  analyticsOriginAllowed,
} from "@/lib/admin/analytics";
import { readAnalyticsBody } from "@/lib/admin/request-body";
export async function POST(request: Request) {
  if (
    process.env.ANALYTICS_ENABLED !== "true" ||
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1" ||
    !analyticsDevice(request.headers.get("user-agent") || "")
  )
    return new Response(null, { status: 204 });
  if (!analyticsOriginAllowed(request.headers.get("origin"), request.url))
    return new Response(null, { status: 403 });
  const input = await readAnalyticsBody(request);
  if (!input.ok) return new Response(null, { status: input.status });
  try {
    const session = await auth();
    if (!session?.user?.id) return new Response(null, { status: 204 });
    const userId = session.user.id;
    if (!checkRateLimit(`heartbeat-user:${userId}`, 10, 60_000).allowed)
      return new Response(null, { status: 429 });
    const country = analyticsCountry(request.headers),
      now = new Date(),
      day = new Date(now);
    day.setUTCHours(0, 0, 0, 0);
    // Serialize each member's heartbeat on the profile row. Elapsed time is derived
    // from the server clock, never from client seconds, and does not multiply per tab.
    await prisma.$transaction(async (tx) => {
      await tx.userAdminProfile.upsert({
        where: { userId },
        create: { userId, lastSeenAt: now },
        update: {},
      });
      const previous = await tx.$queryRaw<
        { heartbeatAt: Date | null }[]
      >`SELECT "heartbeatAt" FROM "UserAdminProfile" WHERE "userId"=${userId} FOR UPDATE`;
      const observedAt = new Date(),
        last = previous[0]?.heartbeatAt;
      const elapsed = last
        ? Math.floor((observedAt.getTime() - last.getTime()) / 1000)
        : 0;
      const seconds = elapsed > 0 && elapsed <= 90 ? Math.min(60, elapsed) : 0;
      const profile = await tx.userAdminProfile.update({
        where: { userId },
        data: {
          heartbeatAt: observedAt,
          lastSeenAt: observedAt,
          activeSeconds: { increment: seconds },
          ...(country !== "ZZ" ? { country } : {}),
        },
      });
      await tx.userAdminProfile.update({
        where: { userId },
        data: { totalMinutes: Math.floor(profile.activeSeconds / 60) },
      });
      await tx.memberDailyVisit.upsert({
        where: { userId_day: { userId, day } },
        create: { userId, day, lastSeen: observedAt, activeSeconds: seconds },
        update: { lastSeen: observedAt, activeSeconds: { increment: seconds } },
      });
    });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
