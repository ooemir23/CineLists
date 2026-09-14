jest.mock("@/lib/admin/access", () => ({ requireAdmin: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: { $transaction: jest.fn() } }));
import { requireAdmin } from "@/lib/admin/access";
import { prisma } from "@/lib/prisma";
import { performAdminAction } from "@/lib/admin/actions";

const requireMock = requireAdmin as jest.Mock;
const transaction = prisma.$transaction as jest.Mock;
beforeEach(() => {
  requireMock.mockResolvedValue({ id: "admin", username: "admin" });
  process.env.ADMIN_USER_IDS = "admin,other-admin";
});
afterAll(() => {
  delete process.env.ADMIN_USER_IDS;
});
test("denied request never mutates data", async () => {
  requireMock.mockRejectedValueOnce(new Error("denied"));
  expect(
    await performAdminAction({
      action: "suspend",
      targetId: "user",
      reason: "test reason",
    }),
  ).toHaveProperty("error");
  expect(transaction).not.toHaveBeenCalled();
});
test.each(["admin", "other-admin"])(
  "protects administrator %s",
  async (targetId) => {
    expect(
      await performAdminAction({
        action: "suspend",
        targetId,
        reason: "test reason",
      }),
    ).toHaveProperty("error");
    expect(transaction).not.toHaveBeenCalled();
  },
);
test("requires an audit reason", async () => {
  expect(
    await performAdminAction({
      action: "suspend",
      targetId: "user",
      reason: " ",
    }),
  ).toHaveProperty("error");
  expect(transaction).not.toHaveBeenCalled();
});
test("suspension and audit are written in the same transaction", async () => {
  const tx = {
    user: { update: jest.fn() },
    session: { deleteMany: jest.fn() },
    adminAuditLog: { create: jest.fn() },
  };
  transaction.mockImplementationOnce(async (callback) => callback(tx));
  expect(
    await performAdminAction({
      action: "suspend",
      targetId: "user",
      reason: "Spam davranışı",
    }),
  ).toEqual({ success: true });
  expect(tx.user.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ isSuspended: true }),
    }),
  );
  expect(tx.session.deleteMany).toHaveBeenCalledWith({
    where: { userId: "user" },
  });
  expect(tx.adminAuditLog.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      actorId: "admin",
      targetId: "user",
      reason: "Spam davranışı",
    }),
  });
});
test("database failure never returns success", async () => {
  transaction.mockRejectedValueOnce(new Error("audit write failed"));
  expect(
    await performAdminAction({
      action: "activate",
      targetId: "user",
      reason: "İnceleme tamamlandı",
    }),
  ).toHaveProperty("error");
});
