import { getAdmin } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";
import { countryLabel, pathLabel } from "@/lib/admin/analytics";
import { dateWindow } from "@/lib/admin/policy";

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
  const type = searchParams.get("type"); // "new-users" | "online" | "active" | "duration" | "users" | "views"
  const daysParam = searchParams.get("days") || "30";
  const { days, since } = dateWindow(daysParam);

  try {
    switch (type) {
      case "new-users": {
        // Users registered in the selected date window
        const users = await prisma.user.findMany({
          where: {
            adminProfile: {
              registeredAt: { gte: since },
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            hasCompletedOnboarding: true,
            isSuspended: true,
            adminProfile: true,
            _count: {
              select: {
                watched: true,
                watchedEpisodes: true,
              },
            },
          },
          orderBy: {
            adminProfile: {
              registeredAt: "desc",
            },
          },
          take: 100,
        });

        const formatted = users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          image: u.image,
          hasCompletedOnboarding: u.hasCompletedOnboarding,
          isSuspended: u.isSuspended,
          countryLabel: countryLabel(u.adminProfile?.country),
          date: u.adminProfile?.registeredAt?.toISOString() || null,
          formattedDate: u.adminProfile?.registeredAt
            ? new Intl.DateTimeFormat("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Europe/Istanbul",
              }).format(u.adminProfile.registeredAt)
            : "Bilinmiyor",
          watchedCount: u._count.watched,
        }));

        return new Response(
          JSON.stringify({
            title: `Yeni Kayıt Olan Kullanıcılar (Son ${days} gün)`,
            subtitle: `Bu dönemde platforma katılan ${formatted.length} kayıtlı üye`,
            type: "users",
            dateLabel: "Kayıt Tarihi",
            items: formatted,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      case "online": {
        // Users active in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const users = await prisma.user.findMany({
          where: {
            adminProfile: {
              lastSeenAt: { gte: fiveMinutesAgo },
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            hasCompletedOnboarding: true,
            isSuspended: true,
            adminProfile: true,
            _count: {
              select: {
                watched: true,
                watchedEpisodes: true,
              },
            },
          },
          orderBy: {
            adminProfile: {
              lastSeenAt: "desc",
            },
          },
          take: 100,
        });

        const formatted = users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          image: u.image,
          hasCompletedOnboarding: u.hasCompletedOnboarding,
          isSuspended: u.isSuspended,
          countryLabel: countryLabel(u.adminProfile?.country),
          date: u.adminProfile?.lastSeenAt?.toISOString() || null,
          formattedDate: u.adminProfile?.lastSeenAt
            ? new Intl.DateTimeFormat("tr-TR", {
                timeStyle: "short",
                dateStyle: "medium",
                timeZone: "Europe/Istanbul",
              }).format(u.adminProfile.lastSeenAt)
            : "Şimdi",
          watchedCount: u._count.watched,
          totalMinutes: u.adminProfile?.totalMinutes || 0,
        }));

        return new Response(
          JSON.stringify({
            title: "Şu An Çevrimiçi Olan Üyeler",
            subtitle: "Son 5 dakika içinde sitede işlem yapan veya sayfaları gezen kullanıcılar",
            type: "users",
            dateLabel: "Son Etkinlik",
            items: formatted,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      case "active": {
        // Users active in the selected days
        const users = await prisma.user.findMany({
          where: {
            adminProfile: {
              lastSeenAt: { gte: since },
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            hasCompletedOnboarding: true,
            isSuspended: true,
            adminProfile: true,
            _count: {
              select: {
                watched: true,
                watchedEpisodes: true,
              },
            },
          },
          orderBy: {
            adminProfile: {
              lastSeenAt: "desc",
            },
          },
          take: 100,
        });

        const formatted = users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          image: u.image,
          hasCompletedOnboarding: u.hasCompletedOnboarding,
          isSuspended: u.isSuspended,
          countryLabel: countryLabel(u.adminProfile?.country),
          date: u.adminProfile?.lastSeenAt?.toISOString() || null,
          formattedDate: u.adminProfile?.lastSeenAt
            ? new Intl.DateTimeFormat("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Europe/Istanbul",
              }).format(u.adminProfile.lastSeenAt)
            : "Bilinmiyor",
          watchedCount: u._count.watched,
          totalMinutes: u.adminProfile?.totalMinutes || 0,
        }));

        return new Response(
          JSON.stringify({
            title: `Aktif Üyeler (Son ${days} gün)`,
            subtitle: `Son ${days} günde siteyi ziyaret eden ${formatted.length} kullanıcı`,
            type: "users",
            dateLabel: "Son Görülme",
            items: formatted,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      case "duration": {
        // Users ranked by total minutes spent on site
        const users = await prisma.user.findMany({
          where: {
            adminProfile: {
              totalMinutes: { gt: 0 },
            },
          },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            image: true,
            hasCompletedOnboarding: true,
            isSuspended: true,
            adminProfile: true,
            _count: {
              select: {
                watched: true,
                watchedEpisodes: true,
              },
            },
          },
          orderBy: {
            adminProfile: {
              totalMinutes: "desc",
            },
          },
          take: 50,
        });

        const formatted = users.map((u) => {
          const mins = u.adminProfile?.totalMinutes || 0;
          return {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            image: u.image,
            hasCompletedOnboarding: u.hasCompletedOnboarding,
            isSuspended: u.isSuspended,
            countryLabel: countryLabel(u.adminProfile?.country),
            date: u.adminProfile?.lastSeenAt?.toISOString() || null,
            formattedDate: mins >= 60 ? `${Math.floor(mins / 60)} sa ${mins % 60} dk` : `${mins} dk`,
            watchedCount: u._count.watched,
            totalMinutes: mins,
          };
        });

        return new Response(
          JSON.stringify({
            title: "Sitede En Çok Vakit Geçiren Üyeler",
            subtitle: "Kullanıcıların toplam aktif kalma süreleri sıralaması",
            type: "users",
            dateLabel: "Geçirilen Süre",
            items: formatted,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      case "users": {
        // Registered users overview & recent accounts
        const [total, suspended, onboarded, recentUsers] = await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { isSuspended: true } }),
          prisma.user.count({ where: { hasCompletedOnboarding: true } }),
          prisma.user.findMany({
            take: 20,
            orderBy: { id: "desc" },
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              hasCompletedOnboarding: true,
              isSuspended: true,
              adminProfile: true,
              _count: {
                select: {
                  watched: true,
                  watchedEpisodes: true,
                },
              },
            },
          }),
        ]);

        const formatted = recentUsers.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          image: u.image,
          hasCompletedOnboarding: u.hasCompletedOnboarding,
          isSuspended: u.isSuspended,
          countryLabel: countryLabel(u.adminProfile?.country),
          date: u.adminProfile?.registeredAt?.toISOString() || null,
          formattedDate: u.adminProfile?.registeredAt
            ? new Intl.DateTimeFormat("tr-TR", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Europe/Istanbul",
              }).format(u.adminProfile.registeredAt)
            : "Kayıt tarihi yok",
          watchedCount: u._count.watched,
        }));

        return new Response(
          JSON.stringify({
            title: "Kayıtlı Kullanıcı Genel Görünümü",
            subtitle: `Toplam ${total} kayıtlı kullanıcı (${suspended} askıda, ${onboarded} kurulumu tamamlamış)`,
            type: "users",
            dateLabel: "Kayıt Tarihi",
            summary: {
              total,
              suspended,
              onboarded,
            },
            items: formatted,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      case "views": {
        // Page view stats for the period
        const [paths, devices, audience] = await Promise.all([
          prisma.analyticsDaily.groupBy({
            by: ["path"],
            where: { day: { gte: since } },
            _sum: { views: true },
            orderBy: { _sum: { views: "desc" } },
            take: 12,
          }),
          prisma.analyticsDaily.groupBy({
            by: ["device"],
            where: { day: { gte: since } },
            _sum: { views: true },
          }),
          prisma.analyticsDaily.groupBy({
            by: ["audience"],
            where: { day: { gte: since } },
            _sum: { views: true },
          }),
        ]);

        return new Response(
          JSON.stringify({
            title: `Sayfa Görüntüleme Dökümü (Son ${days} gün)`,
            subtitle: "Bu dönemde en çok ziyaret edilen sayfalar ve trafik kaynakları",
            type: "views-breakdown",
            paths: paths.map((p) => ({
              path: p.path,
              label: pathLabel(p.path),
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
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Geçersiz metrik tipi" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("[metric-details error]:", error);
    return new Response(
      JSON.stringify({ error: "Veriler alınırken bir hata oluştu" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
