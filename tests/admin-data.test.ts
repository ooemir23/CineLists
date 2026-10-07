jest.mock("@/lib/admin/access", () => ({
  requireAdmin: jest.fn().mockResolvedValue({ id: "admin" }),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { count: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    userAdminProfile: { groupBy: jest.fn() },
    comment: { count: jest.fn(), findMany: jest.fn() },
    activity: { count: jest.fn(), findMany: jest.fn() },
    adminAuditLog: { count: jest.fn(), findMany: jest.fn() },
  },
}));
import { prisma } from "@/lib/prisma";
import { getUsers, getAudit, getModeration } from "@/lib/admin/data";
test("reading users never changes their identities and clamps page bounds", async () => {
  (prisma.user.count as jest.Mock).mockResolvedValue(31);
  (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.userAdminProfile.groupBy as jest.Mock).mockResolvedValue([]);
  const result = await getUsers({ page: "999" });
  expect(result.page).toBe(2);
  expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
  expect(prisma.user.findMany).toHaveBeenCalledWith(
    expect.objectContaining({ take: 25, skip: 25 }),
  );
  expect(prisma.user.update).not.toHaveBeenCalled();
});
test("reviews have searchable pagination beyond the old ten item limit", async () => {
  (prisma.activity.count as jest.Mock).mockResolvedValue(30);
  (prisma.activity.findMany as jest.Mock).mockResolvedValue([]);
  const result = await getModeration({
    kind: "reviews",
    q: "cinema",
    page: "2",
  });
  expect(result.pages).toBe(2);
  expect(prisma.activity.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      take: 25,
      skip: 25,
      where: expect.objectContaining({ OR: expect.any(Array) }),
    }),
  );
});
test("audit search and action filter are applied to counts and pages", async () => {
  (prisma.adminAuditLog.count as jest.Mock).mockResolvedValue(1);
  (prisma.adminAuditLog.findMany as jest.Mock).mockResolvedValue([]);
  const result = await getAudit({ q: "spam", action: "suspend", page: "500" });
  expect(result.page).toBe(1);
  expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      skip: 0,
      where: expect.objectContaining({
        action: "suspend",
        OR: expect.any(Array),
      }),
    }),
  );
});
