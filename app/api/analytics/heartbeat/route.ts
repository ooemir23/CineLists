import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import {
  analyticsCountry,
  analyticsOriginAllowed,
} from "@/lib/admin/analytics";
import { createHash } from "node:crypto";
import { readAnalyticsBody } from "@/lib/admin/request-body";

export async function POST(request: Request) {
  if (process.env.ANALYTICS_ENABLED !== "true") {
    return new Response(null, { status: 204 });
  }

  if (!analyticsOriginAllowed(request.headers.get("origin"), request.url)) {
    return new Response(null, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = createHash("sha256").update(ip).digest("hex");
  if (!checkRateLimit(`heartbeat:${key}`, 120, 60000).allowed) {
    return new Response(null, { status: 429 });
  }

  try {
    let deltaSeconds = 45; // standard heartbeat interval
    const body = await readAnalyticsBody(request).catch(() => null);
    if (body?.ok && body.value && typeof body.value === "object" && "seconds" in body.value) {
      const parsed = Number(body.value.seconds);
      if (Number.isFinite(parsed) && parsed > 0 && parsed <= 120) {
        deltaSeconds = Math.round(parsed);
      }
    }

    const session = await auth();
    if (!session?.user?.id) {
      return new Response(null, { status: 204 });
    }

    const now = new Date();
    const country = analyticsCountry(request.headers);

    // Atomic update or create UserAdminProfile
    const profile = await prisma.userAdminProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        lastSeenAt: now,
        country: country === "ZZ" ? null : country,
        activeSeconds: deltaSeconds,
        totalMinutes: Math.max(1, Math.round(deltaSeconds / 60)),
      },
      update: {
        lastSeenAt: now,
        activeSeconds: { increment: deltaSeconds },
        ...(country !== "ZZ" ? { country } : {}),
      },
    });

    // Recompute totalMinutes based on activeSeconds
    const newTotalMinutes = Math.floor(profile.activeSeconds / 60);
    if (newTotalMinutes !== profile.totalMinutes) {
      await prisma.userAdminProfile.update({
        where: { userId: session.user.id },
        data: { totalMinutes: newTotalMinutes },
      });
    }

    return new Response(JSON.stringify({ ok: true, activeMinutes: newTotalMinutes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.warn("[heartbeat error]:", error);
    return new Response(null, { status: 204 });
  }
}
