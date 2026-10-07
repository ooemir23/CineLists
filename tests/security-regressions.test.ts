jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: jest.fn() },
    follow: { findMany: jest.fn() },
    watched: { findMany: jest.fn(), count: jest.fn() },
    watchedEpisode: { count: jest.fn() },
    activity: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}));
jest.mock("@/lib/i18n/server", () => ({
  getServerLocale: jest.fn().mockResolvedValue("en"),
  getDictionary: () => jest.requireActual("@/lib/i18n/dictionaries/en").en,
}));
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { accessibleProfileId, visibleUserWhere } from "@/lib/profile-access";
import { getUserStats } from "@/lib/stats-actions";
import { getHomeFeedActivities } from "@/lib/feed-actions";
import {
  getCommunityRatingsBulk,
  getUserRatingsBulk,
} from "@/lib/rating-actions";
import { setVote } from "@/lib/votes";
import { trustedClientIp, allowCredentialAttempt } from "@/lib/auth-rate-limit";

beforeEach(() => {
  jest.clearAllMocks();
  (auth as jest.Mock).mockResolvedValue({ user: { id: "viewer" } });
});
test("private or hidden stats are refused before history queries", async () => {
  (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
  expect(await getUserStats("hidden-user")).toBeNull();
  expect(auth).toHaveBeenCalled();
  expect(prisma.watched.count).not.toHaveBeenCalled();
  expect(prisma.user.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: "hidden-user",
        ...visibleUserWhere("viewer", "showStats"),
      }),
    }),
  );
});
test("anonymous profile access includes only public nonsuspended users with the feature enabled", async () => {
  (auth as jest.Mock).mockResolvedValue(null);
  await accessibleProfileId("target", "showActivities");
  expect(prisma.user.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        isSuspended: false,
        OR: [{ showActivities: true, OR: [{ isPrivate: false }] }],
      }),
    }),
  );
});
test("a forged home feed user ID never selects that user's followed accounts", async () => {
  (prisma.follow.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.activity.findMany as jest.Mock).mockResolvedValue([]);
  await getHomeFeedActivities("victim");
  expect(prisma.follow.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ where: { followerId: "viewer" } }),
  );
  expect(prisma.activity.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        user: { isPrivate: false, isSuspended: false, showActivities: true },
      }),
    }),
  );
});
test("movie and TV ratings with the same numeric ID remain distinct", async () => {
  (prisma.watched.findMany as jest.Mock).mockResolvedValue([
    { rating: 2, media: { tmdbId: 42, type: "MOVIE" } },
    { rating: 10, media: { tmdbId: 42, type: "TV" } },
  ]);
  const identities = [
    { id: 42, type: "movie" },
    { id: 42, type: "tv" },
  ] as const;
  expect(await getUserRatingsBulk([...identities])).toEqual({
    "movie:42": 2,
    "tv:42": 10,
  });
  expect(await getCommunityRatingsBulk([...identities])).toEqual({
    "movie:42": { average: 2, count: 1 },
    "tv:42": { average: 10, count: 1 },
  });
});
test("vote intent is bounded, repeated votes are idempotent and removal is reversible", async () => {
  let value: number | null = null;
  let count = 0;
  const tx = {
    $queryRaw: jest.fn(),
    activity: {
      findFirst: jest.fn().mockResolvedValue({ id: "a" }),
      update: jest.fn(async ({ data }) => {
        count += data.votes.increment;
        return { votes: count };
      }),
    },
    activityVote: {
      findUnique: jest.fn(async () => (value === null ? null : { value })),
      upsert: jest.fn(async ({ update }) => {
        value = update.value;
      }),
      deleteMany: jest.fn(async () => {
        value = null;
      }),
    },
  };
  (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(tx));
  expect(await setVote("viewer", "a", 1000000, "activity")).toBeNull();
  expect(prisma.$transaction).not.toHaveBeenCalled();
  expect(await setVote("viewer", "a", 1, "activity")).toBe(1);
  expect(await setVote("viewer", "a", 1, "activity")).toBe(1);
  expect(await setVote("viewer", "a", -1, "activity")).toBe(-1);
  expect(await setVote("viewer", "a", 0, "activity")).toBe(0);
  expect(await setVote("viewer", "a", 0, "activity")).toBe(0);
});
test("arbitrary forwarded headers are ignored without a trusted proxy configuration", () => {
  const previous = process.env.TRUSTED_CLIENT_IP_HEADER;
  delete process.env.TRUSTED_CLIENT_IP_HEADER;
  expect(
    trustedClientIp(new Headers({ "x-forwarded-for": "attacker-chosen" })),
  ).toBe("unknown");
  if (previous !== undefined) process.env.TRUSTED_CLIENT_IP_HEADER = previous;
});
test("credential throttling applies separate IP, account and pair buckets", async () => {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ count: 1 }]),
    authRateLimit: { deleteMany: jest.fn() },
  };
  (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(tx));
  expect(await allowCredentialAttempt("Alice", new Headers())).toBe(true);
  expect(tx.$queryRaw).toHaveBeenCalledTimes(3);
  const firstKeys = tx.$queryRaw.mock.calls.map((c) => c[1]);
  tx.$queryRaw.mockClear();
  expect(await allowCredentialAttempt("ALICE", new Headers())).toBe(true);
  expect(tx.$queryRaw.mock.calls.map((c) => c[1])).toEqual(firstKeys);
  tx.$queryRaw.mockResolvedValue([{ count: 51 }]);
  expect(await allowCredentialAttempt("another-user", new Headers())).toBe(
    false,
  );
});
