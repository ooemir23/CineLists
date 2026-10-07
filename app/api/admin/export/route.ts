import { prisma } from "@/lib/prisma";
import { userWhere } from "@/lib/admin/data";
import { csvCell } from "@/lib/admin/policy";
import { checkRateLimit } from "@/lib/ratelimit";
import { adminRequest, privateJson } from "@/lib/admin/http";
import { interpolate } from "@/lib/admin/format";
export async function GET(request: Request) {
  const { admin, error, t } = await adminRequest(request);
  if (error || !admin) return error!;
  if (!checkRateLimit(`admin-export:${admin.id}`, 5, 60_000).allowed)
    return privateJson({ error: t.rateLimited }, 429);
  const qs = new URL(request.url).searchParams,
    where = userWhere({
      q: qs.get("q") || "",
      country: qs.get("country") || "",
      status: qs.get("status") || "",
      metric: qs.get("metric") || "",
      days: qs.get("days") || "30",
    });
  try {
    if ((await prisma.user.count({ where })) > 5000)
      return privateJson({ error: t.exportLimit }, 422);
    const users = await prisma.user.findMany({
      where,
      take: 5000,
      orderBy: { id: "asc" },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        isSuspended: true,
        hasCompletedOnboarding: true,
        adminProfile: true,
      },
    });
    const rows = [
      [
        t.userId,
        t.username,
        t.name,
        t.email,
        t.status,
        t.completed,
        t.registeredAt + " (UTC)",
        t.lastSeen + " (UTC)",
        t.duration,
        t.country,
      ],
      ...users.map((u) => [
        u.id,
        u.username,
        u.name,
        u.email,
        u.isSuspended ? t.suspended : t.active,
        u.hasCompletedOnboarding ? t.yes : t.no,
        u.adminProfile?.registeredAt?.toISOString(),
        u.adminProfile?.lastSeenAt?.toISOString(),
        u.adminProfile?.totalMinutes || 0,
        u.adminProfile?.country || t.unknown,
      ]),
    ];
    await prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        actorName: admin.username,
        action: "export-users",
        targetId: "users",
        reason: interpolate(t.exportReason, { count: users.length }),
      },
    });
    return new Response(
      "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="cinelists-users.csv"',
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          Vary: "Cookie",
        },
      },
    );
  } catch {
    return privateJson({ error: t.exportError }, 503);
  }
}
