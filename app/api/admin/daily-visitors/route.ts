import { prisma } from "@/lib/prisma";
import { adminRequest, privateJson } from "@/lib/admin/http";
import { pagination, validAdminDay } from "@/lib/admin/policy";
import { adminUserSelect } from "@/lib/admin/data";
import { adminDate, adminPathLabel } from "@/lib/admin/format";
import { countryLabel } from "@/lib/admin/analytics";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const { error, t, locale } = await adminRequest(request);
  if (error) return error;
  const qs = new URL(request.url).searchParams,
    day = validAdminDay(qs.get("date"));
  if (!day) return privateJson({ error: t.invalidDate }, 400);
  try {
    const where = { day },
      total = await prisma.memberDailyVisit.count({ where }),
      { take, page } = pagination(qs.get("page") || undefined),
      pages = Math.max(1, Math.ceil(total / take)),
      currentPage = Math.min(page, pages);
    const [audience, paths, devices, countries, visits] = await Promise.all([
      prisma.analyticsDaily.groupBy({
        by: ["audience"],
        where,
        _sum: { views: true },
      }),
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
        by: ["country"],
        where,
        _sum: { views: true },
        orderBy: { _sum: { views: "desc" } },
        take: 20,
      }),
      prisma.memberDailyVisit.findMany({
        where,
        take,
        skip: (currentPage - 1) * take,
        orderBy: [{ views: "desc" }, { lastSeen: "desc" }, { id: "asc" }],
        include: { user: { select: adminUserSelect } },
      }),
    ]);
    return privateJson({
      date: qs.get("date"),
      formattedDate: adminDate(day, locale, t.unknown),
      totalViews: audience.reduce((sum, r) => sum + (r._sum.views || 0), 0),
      memberViews:
        audience.find((r) => r.audience === "member")?._sum.views || 0,
      guestViews: audience.find((r) => r.audience === "guest")?._sum.views || 0,
      total,
      page: currentPage,
      pages,
      paths: paths.map((r) => ({
        path: r.path,
        label: adminPathLabel(r.path, t),
        views: r._sum.views || 0,
      })),
      devices: devices.map((r) => ({
        device: r.device,
        views: r._sum.views || 0,
      })),
      countries: countries.map((r) => ({
        country: r.country,
        label: countryLabel(r.country, locale, t.unknown),
        views: r._sum.views || 0,
      })),
      users: visits.map((v) => ({
        id: v.userId,
        name: v.user.name,
        username: v.user.username,
        email: v.user.email,
        image: v.user.image,
        countryLabel: countryLabel(
          v.user.adminProfile?.country,
          locale,
          t.unknown,
        ),
        totalMinutes: Math.floor(v.activeSeconds / 60),
        lastSeenAt: v.lastSeen.toISOString(),
        isSuspended: v.user.isSuspended,
        watchedCount: v.user._count.watched,
        episodeCount: v.user._count.watchedEpisodes,
        viewsOnDate: v.views,
      })),
    });
  } catch {
    return privateJson({ error: t.loadError }, 503);
  }
}
