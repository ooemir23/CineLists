// This fixture is deliberately restricted to a dedicated local test database.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (
  !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
  !url.pathname.endsWith("/cinelists_admin_test")
) {
  throw new Error(
    "Only the local cinelists_admin_test database may be seeded.",
  );
}
const prisma = new PrismaClient();
try {
  const password = await bcrypt.hash("AdminTest-2026!", 12);
  const countries = ["TR", "DE", "US", "GB", "NL", null];
  for (let i = 0; i < 32; i++) {
    const id =
      i === 0 ? "admin-test" : `member-test-${String(i).padStart(2, "0")}`;
    const username =
      i === 0 ? "admin_test" : `test_uye_${String(i).padStart(2, "0")}`;
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        username,
        name: i === 0 ? "Test Yöneticisi" : `Örnek Kullanıcı ${i}`,
        email: `${username}@example.test`,
        password,
        hasCompletedOnboarding: i % 4 !== 1,
        isSuspended: i === 31,
        favoriteGenres: ["Dram", "Bilim Kurgu"],
        platforms: ["Netflix"],
        adminProfile: {
          create: {
            registeredAt: i < 2 ? null : new Date(Date.now() - i * 86400000),
            lastSeenAt: new Date(Date.now() - i * 3600000),
            country: countries[i % countries.length],
          },
        },
      },
    });
  }
  for (let i = 0; i < 30; i++) {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - i);
    for (const [index, code] of countries.entries()) {
      const country = code || "ZZ";
      const device = index % 2 === 0 ? "mobile" : "desktop";
      const path = index % 2 === 0 ? "/" : "/search";
      const audience = index % 3 === 0 ? "guest" : "member";
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
        create: {
          day,
          country,
          device,
          path,
          audience,
          views: (32 - i) * (6 - index),
        },
        update: {},
      });
    }
  }
  const media = await prisma.mediaItem.upsert({
    where: { tmdbId: 27205 },
    create: {
      tmdbId: 27205,
      title: "Başlangıç",
      type: "MOVIE",
      genres: ["Bilim Kurgu"],
    },
    update: {},
  });
  await prisma.watched.upsert({
    where: { userId_mediaId: { userId: "member-test-02", mediaId: media.id } },
    create: { userId: "member-test-02", mediaId: media.id, rating: 9 },
    update: {},
  });
  await prisma.activity.upsert({
    where: { id: "test-review" },
    create: {
      id: "test-review",
      userId: "member-test-02",
      mediaId: media.id,
      type: "REVIEWED",
      review: "Bu, moderasyon testi için örnek bir inceleme.",
      rating: 9,
    },
    update: {},
  });
  await prisma.comment.upsert({
    where: { id: "test-comment" },
    create: {
      id: "test-comment",
      userId: "member-test-02",
      personId: 6193,
      content: "Bu, moderasyon testi için örnek bir yorum.",
    },
    update: {},
  });
  console.log(
    "32 synthetic users and 30 days of analytics prepared in the isolated test database.",
  );
} finally {
  await prisma.$disconnect();
}
