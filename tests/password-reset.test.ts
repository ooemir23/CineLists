jest.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
jest.mock("@/auth", () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: jest.fn(), update: jest.fn() },
    verificationToken: {
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    session: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("new-hash"),
}));
jest.mock("@/lib/mail", () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock("@/lib/ratelimit", () => ({
  checkRateLimit: jest.fn().mockReturnValue({ allowed: true }),
}));
jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));
jest.mock("@/lib/i18n/server", () => ({
  getServerLocale: jest.fn().mockResolvedValue("en"),
}));
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";
import { requestPasswordReset, resetPassword } from "@/lib/auth-actions";

const token = "a".repeat(64);
const digest = createHash("sha256").update(token).digest("hex");
beforeEach(() => {
  jest.clearAllMocks();
  (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
  (prisma.user.findFirst as jest.Mock).mockResolvedValue({
    id: "u",
    email: "test@example.com",
  });
  (prisma.verificationToken.findUnique as jest.Mock).mockResolvedValue({
    token: digest,
    identifier: "test@example.com",
    expires: new Date(Date.now() + 60_000),
  });
});
test("reset requests persist a digest while emailing the original link token", async () => {
  const form = new FormData();
  form.set("email", "test@example.com");
  await expect(requestPasswordReset(form)).rejects.toThrow("success=sent");
  const emailed = (sendPasswordResetEmail as jest.Mock).mock.calls[0][1];
  expect(prisma.verificationToken.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        token: createHash("sha256").update(emailed).digest("hex"),
      }),
    }),
  );
  expect(
    (prisma.verificationToken.create as jest.Mock).mock.calls[0][0].data.token,
  ).not.toBe(emailed);
  expect(prisma.$queryRaw).toHaveBeenCalled();
});
test("a consumed token cannot change the password a second time", async () => {
  const form = new FormData();
  form.set("token", token);
  form.set("password", "newpassword");
  form.set("confirmPassword", "newpassword");
  (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({
    count: 0,
  });
  await expect(resetPassword(form)).rejects.toThrow("error=invalid");
  expect(prisma.user.update).not.toHaveBeenCalled();
});
test("password change consumes the token and revokes existing sessions atomically", async () => {
  const form = new FormData();
  form.set("token", token);
  form.set("password", "newpassword");
  form.set("confirmPassword", "newpassword");
  (prisma.verificationToken.deleteMany as jest.Mock).mockResolvedValue({
    count: 1,
  });
  await expect(resetPassword(form)).rejects.toThrow("reset=success");
  expect(prisma.user.update).toHaveBeenCalledWith({
    where: { id: "u" },
    data: { password: "new-hash", sessionVersion: { increment: 1 } },
  });
  expect(prisma.session.deleteMany).toHaveBeenCalledWith({
    where: { userId: "u" },
  });
  expect(prisma.verificationToken.findUnique).toHaveBeenCalledWith({
    where: { token: digest },
  });
});
