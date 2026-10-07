import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "./access";
import { dateWindow, pagination } from "./policy";
import { REMOVED_COMMENTS } from "./format";

export type UserFilters = {
  metric?: string;
  days?: string;
  action?: string;
  kind?: string;
  q?: string;
  status?: string;
  country?: string;
  sort?: string;
  page?: string;
};
export function userWhere(filters: UserFilters): Prisma.UserWhereInput {
  const q = filters.q?.trim().slice(0, 100);
  const parts: Prisma.UserWhereInput[] = [];
  const { since } = dateWindow(filters.days);
  if (filters.metric === "online")
    parts.push({
      isSuspended: false,
      adminProfile: { lastSeenAt: { gte: new Date(Date.now() - 5 * 60_000) } },
    });
  if (filters.metric === "active")
    parts.push({ adminProfile: { lastSeenAt: { gte: since } } });
  if (filters.metric === "new-users")
    parts.push({ adminProfile: { registeredAt: { gte: since } } });
  if (filters.metric === "duration")
    parts.push({ adminProfile: { totalMinutes: { gt: 0 } } });

  if (q)
    parts.push({
      OR: ["name", "username", "email"].map((field) => ({
        [field]: { contains: q, mode: "insensitive" },
      })),
    });
  if (filters.status === "admin")
    parts.push({
      id: {
        in: (process.env.ADMIN_USER_IDS || "")
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      },
    });
  if (filters.status === "suspended") parts.push({ isSuspended: true });
  if (filters.status === "active") parts.push({ isSuspended: false });
  if (filters.status === "onboarding")
    parts.push({ hasCompletedOnboarding: false });
  if (filters.country === "ZZ")
    parts.push({
      OR: [{ adminProfile: null }, { adminProfile: { country: null } }],
    });
  else if (/^[A-Z]{2}$/.test(filters.country || ""))
    parts.push({ adminProfile: { country: filters.country } });
  return { AND: parts };
}

export const adminUserSelect = {
  id: true,
  username: true,
  name: true,
  email: true,
  image: true,
  isSuspended: true,
  isPrivate: true,
  hasCompletedOnboarding: true,
  adminProfile: true,
  accounts: { select: { provider: true } },
  _count: {
    select: {
      watched: true,
      watchedEpisodes: true,
      toWatch: true,
      comments: true,
      activities: true,
    },
  },
};

export async function getUsers(filters: UserFilters) {
  await requireAdmin();
  const where = userWhere(filters);
  const { take, page } = pagination(filters.page);
  const total = await prisma.user.count({ where });
  const pages = Math.max(1, Math.ceil(total / take));
  const currentPage = Math.min(page, pages);
  const orderBy: Prisma.UserOrderByWithRelationInput[] =
    filters.sort === "recent"
      ? [
          { adminProfile: { lastSeenAt: { sort: "desc", nulls: "last" } } },
          { id: "asc" },
        ]
      : filters.sort === "time"
        ? [{ adminProfile: { totalMinutes: "desc" } }, { id: "asc" }]
        : filters.sort === "registered"
          ? [
              {
                adminProfile: { registeredAt: { sort: "desc", nulls: "last" } },
              },
              { id: "asc" },
            ]
          : [{ username: "asc" }, { id: "asc" }];
  const [users, countries] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      take,
      skip: (currentPage - 1) * take,
      orderBy,
    }),
    prisma.userAdminProfile.groupBy({
      by: ["country"],
      where: { country: { not: null } },
      orderBy: { country: "asc" },
    }),
  ]);
  return { users, countries, total, page: currentPage, pages };
}

export async function getOverview(since: Date) {
  await requireAdmin();
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const [
    users,
    suspended,
    onboarded,
    newUsers,
    active,
    onlineCount,
    totalMinutesSum,
    media,
    watched,
    episodes,
    comments,
    messages,
    views,
    countries,
    devices,
    paths,
    audience,
    daily,
    registrations,
    memberCountries,
    popular,
    firstDay,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isSuspended: true } }),
    prisma.user.count({ where: { hasCompletedOnboarding: true } }),
    prisma.userAdminProfile.count({ where: { registeredAt: { gte: since } } }),
    prisma.userAdminProfile.count({ where: { lastSeenAt: { gte: since } } }),
    prisma.userAdminProfile.count({
      where: {
        lastSeenAt: { gte: fiveMinutesAgo },
        user: { isSuspended: false },
      },
    }),
    prisma.userAdminProfile.aggregate({ _sum: { totalMinutes: true } }),
    prisma.mediaItem.count(),
    prisma.watched.count(),
    prisma.watchedEpisode.count(),
    prisma.comment.count(),
    prisma.message.count(),
    prisma.analyticsDaily.aggregate({
      where: { day: { gte: since } },
      _sum: { views: true },
    }),
    prisma.analyticsDaily.groupBy({
      by: ["country"],
      where: { day: { gte: since } },
      _sum: { views: true },
      orderBy: { _sum: { views: "desc" } },
      take: 20,
    }),
    prisma.analyticsDaily.groupBy({
      by: ["device"],
      where: { day: { gte: since } },
      _sum: { views: true },
    }),
    prisma.analyticsDaily.groupBy({
      by: ["path"],
      where: { day: { gte: since } },
      _sum: { views: true },
      orderBy: { _sum: { views: "desc" } },
      take: 8,
    }),
    prisma.analyticsDaily.groupBy({
      by: ["audience"],
      where: { day: { gte: since } },
      _sum: { views: true },
    }),
    prisma.analyticsDaily.groupBy({
      by: ["day"],
      where: { day: { gte: since } },
      _sum: { views: true },
      orderBy: { day: "asc" },
    }),
    prisma.$queryRaw<
      { day: Date; count: bigint }[]
    >`SELECT date_trunc('day', "registeredAt") AS day, COUNT(*) AS count FROM "UserAdminProfile" WHERE "registeredAt" >= ${since} GROUP BY 1 ORDER BY 1`,
    prisma.userAdminProfile.groupBy({
      by: ["country"],
      where: { lastSeenAt: { gte: since } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 12,
    }),
    prisma.mediaItem.findMany({
      orderBy: { watchedBy: { _count: "desc" } },
      take: 5,
      select: {
        id: true,
        tmdbId: true,
        title: true,
        type: true,
        _count: { select: { watchedBy: true } },
      },
    }),
    prisma.analyticsDaily.aggregate({ _min: { day: true } }),
  ]);
  return {
    users,
    suspended,
    onboarded,
    newUsers,
    active,
    onlineCount,
    totalMinutes: totalMinutesSum._sum.totalMinutes || 0,
    media,
    watched,
    episodes,
    comments,
    messages,
    views: views._sum.views || 0,
    countries,
    devices,
    paths,
    audience,
    daily,
    registrations,
    memberCountries,
    popular,
    firstDay: firstDay._min.day,
  };
}

export async function getUserDetail(id: string) {
  await requireAdmin();
  return prisma.user.findUnique({
    where: { id },
    select: {
      ...adminUserSelect,
      bio: true,
      emailVerified: true,
      suspendedAt: true,
      favoriteGenres: true,
      platforms: true,
      showActivities: true,
      showStats: true,
      _count: {
        select: {
          watched: true,
          watchedEpisodes: true,
          toWatch: true,
          comments: true,
          activities: true,
          following: true,
          followedBy: true,
          achievements: true,
          sentMessages: true,
          receivedMessages: true,
        },
      },
      activities: {
        take: 12,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          rating: true,
          createdAt: true,
          media: { select: { title: true, type: true, tmdbId: true } },
        },
      },
      watched: {
        take: 12,
        orderBy: { watchedAt: "desc" },
        select: {
          id: true,
          rating: true,
          watchedAt: true,
          media: { select: { title: true } },
        },
      },
      toWatch: {
        take: 12,
        orderBy: { addedAt: "desc" },
        select: { id: true, status: true, media: { select: { title: true } } },
      },
    },
  });
}

export async function getModeration(filters: UserFilters) {
  await requireAdmin();
  const q = filters.q?.trim().slice(0, 100);
  const kind = filters.kind === "reviews" ? "reviews" : "comments";
  const where: Prisma.CommentWhereInput = {
    ...(q
      ? {
          OR: [
            { content: { contains: q, mode: "insensitive" } },
            { user: { username: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.status === "removed"
      ? { content: { in: REMOVED_COMMENTS } }
      : filters.status === "all"
        ? {}
        : { content: { notIn: REMOVED_COMMENTS } }),
  };
  const reviewWhere: Prisma.ActivityWhereInput = {
    review: { not: null },
    ...(q
      ? {
          OR: [
            { review: { contains: q, mode: "insensitive" } },
            { user: { username: { contains: q, mode: "insensitive" } } },
            { media: { title: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const total =
    kind === "reviews"
      ? await prisma.activity.count({ where: reviewWhere })
      : await prisma.comment.count({ where });
  const { take, page } = pagination(filters.page),
    pages = Math.max(1, Math.ceil(total / take)),
    currentPage = Math.min(page, pages);
  const comments =
    kind === "comments"
      ? await prisma.comment.findMany({
          where,
          take,
          skip: (currentPage - 1) * take,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            content: true,
            createdAt: true,
            isSpoiler: true,
            user: { select: { id: true, username: true } },
          },
        })
      : [];
  const reviews =
    kind === "reviews"
      ? await prisma.activity.findMany({
          where: reviewWhere,
          take,
          skip: (currentPage - 1) * take,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            review: true,
            createdAt: true,
            user: { select: { id: true, username: true } },
            media: { select: { title: true } },
          },
        })
      : [];
  return { comments, reviews, total, page: currentPage, pages, kind };
}
export async function getAudit(filters: UserFilters) {
  await requireAdmin();
  const q = filters.q?.trim().slice(0, 100);
  const actions = [
    "suspend",
    "activate",
    "redact-comment",
    "redact-review",
    "export-users",
  ];
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(q
      ? {
          OR: ["actorName", "targetId", "reason"].map((field) => ({
            [field]: { contains: q, mode: "insensitive" },
          })),
        }
      : {}),
    ...(actions.includes(filters.action || "")
      ? { action: filters.action }
      : {}),
  };
  const total = await prisma.adminAuditLog.count({ where });
  const { take, page } = pagination(filters.page),
    pages = Math.max(1, Math.ceil(total / take)),
    currentPage = Math.min(page, pages);
  const logs = await prisma.adminAuditLog.findMany({
    where,
    take,
    skip: (currentPage - 1) * take,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return { logs, total, page: currentPage, pages };
}
