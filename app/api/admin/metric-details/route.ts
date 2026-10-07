import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { adminRequest, privateJson } from "@/lib/admin/http";
import { dateWindow, pagination } from "@/lib/admin/policy";
import { adminUserSelect } from "@/lib/admin/data";
import { countryLabel } from "@/lib/admin/analytics";
import {
  adminDate,
  adminDuration,
  adminPathLabel,
  interpolate,
} from "@/lib/admin/format";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const { admin, error, t, locale } = await adminRequest(request);
  if (error || !admin) return error!;
  const qs = new URL(request.url).searchParams,
    type = qs.get("type") || "",
    { days, since } = dateWindow(qs.get("days") || "30");
  if (
    !["users", "online", "active", "new-users", "duration", "views"].includes(
      type,
    )
  )
    return privateJson({ error: t.invalidMetric }, 400);
  try {
    if (type === "views") {
      const where = { day: { gte: since } },
        [paths, devices, audience] = await Promise.all([
          prisma.analyticsDaily.groupBy({
            by: ["path"],
            where,
            _sum: { views: true },
            orderBy: { _sum: { views: "desc" } },
            take: 12,
          }),
          prisma.analyticsDaily.groupBy({
            by: ["device"],
            where,
            _sum: { views: true },
          }),
          prisma.analyticsDaily.groupBy({
            by: ["audience"],
            where,
            _sum: { views: true },
          }),
        ]);
      return privateJson({
        title: t.views,
        subtitle: interpolate(t.lastDays, { days }),
        type: "views-breakdown",
        paths: paths.map((p) => ({
          path: p.path,
          label: adminPathLabel(p.path, t),
          views: p._sum.views || 0,
        })),
        devices: devices.map((d) => ({
          device: d.device,
          views: d._sum.views || 0,
        })),
        audience: audience.map((a) => ({
          audience: a.audience,
          views: a._sum.views || 0,
        })),
      });
    }
    const where: Prisma.UserWhereInput =
      type === "online"
        ? {
            isSuspended: false,
            adminProfile: {
              lastSeenAt: { gte: new Date(Date.now() - 5 * 60_000) },
            },
          }
        : type === "active"
          ? { adminProfile: { lastSeenAt: { gte: since } } }
          : type === "new-users"
            ? { adminProfile: { registeredAt: { gte: since } } }
            : type === "duration"
              ? { adminProfile: { totalMinutes: { gt: 0 } } }
              : {};
    const orderBy: Prisma.UserOrderByWithRelationInput[] =
      type === "duration"
        ? [{ adminProfile: { totalMinutes: "desc" } }, { id: "asc" }]
        : type === "online" || type === "active"
          ? [
              { adminProfile: { lastSeenAt: { sort: "desc", nulls: "last" } } },
              { id: "asc" },
            ]
          : [
              {
                adminProfile: { registeredAt: { sort: "desc", nulls: "last" } },
              },
              { id: "asc" },
            ];
    const total = await prisma.user.count({ where }),
      { take, page } = pagination(qs.get("page") || undefined),
      pages = Math.max(1, Math.ceil(total / take)),
      currentPage = Math.min(page, pages);
    const users = await prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy,
      take,
      skip: (currentPage - 1) * take,
    });
    return privateJson({
      title: (
        {
          users: t.registeredUsers,
          online: t.online,
          active: t.activeMembers,
          "new-users": t.newUsers,
          duration: t.duration,
        } as Record<string, string>
      )[type],
      subtitle:
        type === "online"
          ? t.onlineHint
          : type === "duration" || type === "users"
            ? t.allTime
            : interpolate(t.lastDays, { days }),
      type: "users",
      total,
      page: currentPage,
      pages,
      directoryHref: `/admin?tab=users&metric=${type}&days=${days}&sort=${type === "duration" ? "time" : type === "new-users" || type === "users" ? "registered" : "recent"}`,
      dateLabel:
        type === "duration"
          ? t.duration
          : type === "new-users" || type === "users"
            ? t.registeredAt
            : t.lastSeen,
      items: users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        image: u.image,
        hasCompletedOnboarding: u.hasCompletedOnboarding,
        isSuspended: u.isSuspended,
        countryLabel: countryLabel(u.adminProfile?.country, locale, t.unknown),
        formattedDate:
          type === "duration"
            ? adminDuration(u.adminProfile?.totalMinutes || 0, locale, t)
            : adminDate(
                type === "new-users" || type === "users"
                  ? u.adminProfile?.registeredAt
                  : u.adminProfile?.lastSeenAt,
                locale,
                t.unknown,
              ),
        watchedCount: u._count.watched,
        totalMinutes: u.adminProfile?.totalMinutes || 0,
      })),
    });
  } catch {
    return privateJson({ error: t.loadError }, 503);
  }
}
