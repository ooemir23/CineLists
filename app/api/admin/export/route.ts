import { getAdmin } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";
import { userWhere } from "@/lib/admin/data";
import { csvCell } from "@/lib/admin/policy";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return new Response("Yetkisiz erişim", { status: 403 });
  if (!checkRateLimit(`admin-export:${admin.id}`, 5, 60000).allowed)
    return new Response("Lütfen bir dakika sonra tekrar deneyin.", {
      status: 429,
    });
  const params = new URL(request.url).searchParams;
  const where = userWhere({
    q: params.get("q") || "",
    country: params.get("country") || "",
    status: params.get("status") || "",
  });
  try {
    if ((await prisma.user.count({ where })) > 5000)
      return new Response(
        "En fazla 5000 kullanıcı dışa aktarılabilir. Filtreleri daraltın.",
        { status: 422 },
      );
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
        "Kimlik",
        "Kullanıcı adı",
        "Ad",
        "E-posta",
        "Durum",
        "Kurulum tamamlandı",
        "Kayıt tarihi (UTC)",
        "Son görülme (UTC)",
        "Sitede geçirilen süre (dk)",
        "Son bilinen ülke",
      ],
      ...users.map((user) => [
        user.id,
        user.username,
        user.name,
        user.email,
        user.isSuspended ? "Askıda" : "Aktif",
        user.hasCompletedOnboarding ? "Evet" : "Hayır",
        user.adminProfile?.registeredAt?.toISOString(),
        user.adminProfile?.lastSeenAt?.toISOString(),
        user.adminProfile?.totalMinutes || 0,
        user.adminProfile?.country || "Bilinmiyor",
      ]),
    ];
    await prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        actorName: admin.username,
        action: "export-users",
        targetId: "users",
        reason: `${users.length} kullanıcı CSV olarak dışa aktarıldı.`,
      },
    });
    return new Response(
      "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="cinelists-kullanicilar.csv"',
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  } catch {
    return new Response("Dışa aktarma tamamlanamadı.", { status: 503 });
  }
}
