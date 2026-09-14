jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAdmin, requireAdmin } from "@/lib/admin/access";

const mockAuth = auth as jest.Mock;
const findUser = prisma.user.findUnique as jest.Mock;
beforeEach(() => {
  process.env.ADMIN_USER_IDS = "admin-id";
});
afterAll(() => {
  delete process.env.ADMIN_USER_IDS;
});

test("anonymous and ordinary members cannot query admin data", async () => {
  mockAuth
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ user: { id: "member", role: "ADMIN" } });
  expect(await getAdmin()).toBeNull();
  expect(await getAdmin()).toBeNull();
  expect(findUser).not.toHaveBeenCalled();
});
test("suspended or removed administrator cannot get access", async () => {
  mockAuth.mockResolvedValue({ user: { id: "admin-id" } });
  findUser
    .mockResolvedValueOnce({ id: "admin-id", isSuspended: true })
    .mockResolvedValueOnce(null);
  expect(await getAdmin()).toBeNull();
  await expect(requireAdmin()).rejects.toThrow();
});
test("administrator is validated against database every time", async () => {
  mockAuth.mockResolvedValue({ user: { id: "admin-id" } });
  findUser.mockResolvedValue({ id: "admin-id", isSuspended: false });
  expect((await requireAdmin()).id).toBe("admin-id");
  expect(findUser.mock.calls[0][0].select).not.toHaveProperty("password");
});
