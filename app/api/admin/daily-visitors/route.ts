import { getAdmin } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";
import { countryLabel } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) {
    return new Response(JSON.stringify({ error: "Yetkisiz erişim" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date"); // "YYYY-MM-DD"

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Response(JSON.stringify({ error: "Geçersiz tarih formatı" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    // 1. Fetch aggregated stats for this day
    const [analyticsRows, rawDailyVisits] = await Promise.all([
      prisma.analyticsDaily.findMany({
        where: { day: dayStart },
        orderBy: { views: "desc" },
      }),
      // Check if UserDailyVisit table exists and has records
      prisma
        .$queryRaw<{ userId: string; views: number; lastSeen: Date }[]>`
          SELECT "userId", "views", "lastSeen" 
          FROM "UserDailyVisit" 
          WHERE "day" = ${dayStart}::date
        `
        .catch(() => [] as { userId: string; views: number; lastSeen: Date }[]),
    ]);

    let totalViews = 0;
    let memberViews = 0;
    let guestViews = 0;
    const pathsMap: Record<string, number> = {};
    const devicesMap: Record<string, number> = {};
    const countriesMap: Record<string, number> = {};

    for (const row of analyticsRows) {
      totalViews += row.views;
      if (row.audience === "member") memberViews += row.views;
      else guestViews += row.views;

      pathsMap[row.path] = (pathsMap[row.path] || 0) + row.views;
      devicesMap[row.device] = (devicesMap[row.device] || 0) + row.views;
      countriesMap[row.country] = (countriesMap[row.country] || 0) + row.views;
    }

    // 2. Identify active users for this day
    const userIds = new Set<string>();

    // A) Users logged in UserDailyVisit
    for (const v of rawDailyVisits) {
      if (v.userId) userIds.add(v.userId);
    }

    // B) Users with lastSeenAt on this day
    const activeProfiles = await prisma.userAdminProfile.findMany({
      where: {
        lastSeenAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: { userId: true },
    });
    for (const p of activeProfiles) userIds.add(p.userId);

    // C) Users who watched or were active on this day
    const [watchedRecords, activities] = await Promise.all([
      prisma.watched.findMany({
        where: { watchedAt: { gte: dayStart, lte: dayEnd } },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.activity.findMany({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);
    for (const w of watchedRecords) userIds.add(w.userId);
    for (const a of activities) userIds.add(a.userId);

    // 3. Fetch detailed profiles for matched users
    const matchedUsers = userIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(userIds) } },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            isSuspended: true,
            adminProfile: true,
            _count: {
              select: {
                watched: true,
                watchedEpisodes: true,
                comments: true,
              },
            },
          },
        })
      : [];

    const visitsByUserId = new Map(
      rawDailyVisits.map((v) => [v.userId, v.views]),
    );

    const formattedUsers = matchedUsers.map((u) => {
      const countryCode = u.adminProfile?.country;
      const totalMinutes = u.adminProfile?.totalMinutes || 0;
      const userViews = visitsByUserId.get(u.id);

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        image: u.image,
        country: countryCode,
        countryLabel: countryLabel(countryCode),
        totalMinutes,
        lastSeenAt: u.adminProfile?.lastSeenAt?.toISOString() || null,
        isSuspended: u.isSuspended,
        watchedCount: u._count.watched,
        episodeCount: u._count.watchedEpisodes,
        viewsOnDate: userViews || null,
      };
    });

    // Sort users: those with recorded views first, then by lastSeenAt desc
    formattedUsers.sort((a, b) => {
      if (a.viewsOnDate && !b.viewsOnDate) return -1;
      if (!a.viewsOnDate && b.viewsOnDate) return 1;
      const timeA = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0;
      const timeB = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0;
      return timeB - timeA;
    });

    const formattedDate = dayStart.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    return new Response(
      JSON.stringify({
        date: dateStr,
        formattedDate,
        totalViews,
        memberViews,
        guestViews,
        paths: Object.entries(pathsMap)
          .map(([path, views]) => ({ path, views }))
          .sort((a, b) => b.views - a.views),
        devices: Object.entries(devicesMap)
          .map(([device, views]) => ({ device, views }))
          .sort((a, b) => b.views - a.views),
        countries: Object.entries(countriesMap)
          .map(([country, views]) => ({
            country,
            label: countryLabel(country),
            views,
          }))
          .sort((a, b) => b.views - a.views),
        users: formattedUsers,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[daily-visitors error]:", error);
    return new Response(
      JSON.stringify({ error: "Veriler alınırken bir hata oluştu" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
