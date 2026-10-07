jest.mock("@/lib/admin/access", () => ({
  getAdmin: jest.fn(),
  requireAdmin: jest.fn(),
}));
jest.mock("@/lib/ratelimit", () => ({
  checkRateLimit: () => ({ allowed: true }),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: jest.fn(), findMany: jest.fn() },
    memberDailyVisit: { count: jest.fn(), findMany: jest.fn() },
    analyticsDaily: { groupBy: jest.fn() },
  },
}));
import { getAdmin } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";
import { GET as metric } from "@/app/api/admin/metric-details/route";
import { GET as daily } from "@/app/api/admin/daily-visitors/route";
import { validAdminDay } from "@/lib/admin/policy";
import { onlineAt } from "@/lib/admin/format";
beforeEach(() => {
  (getAdmin as jest.Mock).mockResolvedValue({ id: "admin" });
});
test("anonymous details return 403, private headers and no queries", async () => {
  (getAdmin as jest.Mock).mockResolvedValue(null);
  const response = await metric(
    new Request("https://cinelists.com/api/admin/metric-details?type=users", {
      headers: { cookie: "NEXT_LOCALE=en" },
    }),
  );
  expect(response.status).toBe(403);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect((await response.json()).error).toBe("Access denied");
  expect(prisma.user.findMany).not.toHaveBeenCalled();
});
test.each(["2026-02-30", "2026-13-01", "2999-01-01", "bad"])(
  "rejects invalid or future day %s without querying",
  async (date) => {
    const response = await daily(
      new Request(
        "https://cinelists.com/api/admin/daily-visitors?date=" + date,
      ),
    );
    expect(response.status).toBe(400);
    expect(prisma.memberDailyVisit.findMany).not.toHaveBeenCalled();
  },
);
test("metric pagination exposes real totals instead of silently truncating", async () => {
  (prisma.user.count as jest.Mock).mockResolvedValue(61);
  (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
  const response = await metric(
    new Request(
      "https://cinelists.com/api/admin/metric-details?type=users&page=99",
      { headers: { cookie: "NEXT_LOCALE=en" } },
    ),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    total: 61,
    page: 3,
    pages: 3,
    title: "Registered users",
  });
  expect(prisma.user.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ skip: 50, take: 25 }),
  );
});
test("daily members come only from measured visits with bounded queries", async () => {
  (prisma.memberDailyVisit.count as jest.Mock).mockResolvedValue(45);
  (prisma.memberDailyVisit.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.analyticsDaily.groupBy as jest.Mock).mockResolvedValue([]);
  const response = await daily(
    new Request(
      "https://cinelists.com/api/admin/daily-visitors?date=2026-01-01&page=2",
    ),
  );
  expect(await response.json()).toMatchObject({
    total: 45,
    page: 2,
    pages: 2,
    totalViews: 0,
  });
  expect(prisma.memberDailyVisit.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ take: 25, skip: 25 }),
  );
  expect(prisma.user.findMany).not.toHaveBeenCalled();
});
test("online boundary is the same five minute window and excludes suspended users", () => {
  const now = Date.parse("2026-10-07T12:00:00Z");
  expect(onlineAt("2026-10-07T11:55:01Z", false, now)).toBe(true);
  expect(onlineAt("2026-10-07T11:55:00Z", false, now)).toBe(false);
  expect(onlineAt("2026-10-07T12:01:00Z", false, now)).toBe(false);
  expect(onlineAt("2026-10-07T11:59:00Z", true, now)).toBe(false);
  expect(validAdminDay("2024-02-29")).not.toBeNull();
});
