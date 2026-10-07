jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    auth: jest.fn(),
    handlers: {},
    signIn: jest.fn(),
    signOut: jest.fn(),
  })),
}));
jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
}));
jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: jest.fn((config) => config),
}));
jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), findFirst: jest.fn() },
    account: { findFirst: jest.fn() },
  },
}));
jest.mock("@/lib/auth-rate-limit", () => ({
  allowCredentialAttempt: jest.fn().mockResolvedValue(false),
}));
import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import { allowCredentialAttempt } from "@/lib/auth-rate-limit";
import "@/auth";
const config = (NextAuth as jest.Mock).mock.calls[0][0];
beforeEach(() => jest.clearAllMocks());

test("a deleted-account JWT cannot attach to a new account with the same email", async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.user.findFirst as jest.Mock).mockResolvedValue({
    id: "replacement",
    sessionVersion: 0,
  });
  const result = await config.callbacks.session({
    session: { user: {}, expires: "later" },
    token: { sub: "deleted", email: "reused@example.com", sessionVersion: 0 },
  });
  expect(result.user).toBeUndefined();
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
  expect(prisma.account.findFirst).not.toHaveBeenCalled();
});
test("password reset revokes JWTs with an earlier session version", async () => {
  (prisma.user.findUnique as jest.Mock).mockResolvedValue({
    id: "u",
    sessionVersion: 1,
    isSuspended: false,
  });
  const result = await config.callbacks.session({
    session: { user: {}, expires: "later" },
    token: { sub: "u", sessionVersion: 0 },
  });
  expect(result.user).toBeUndefined();
});
test("a direct credentials callback is rate limited before account lookup", async () => {
  const provider = config.providers.find(
    (item: { authorize?: unknown }) => item.authorize,
  );
  expect(
    await provider.authorize(
      { email: "user@example.com", password: "password123" },
      new Request("http://localhost/api/auth/callback/email"),
    ),
  ).toBeNull();
  expect(allowCredentialAttempt).toHaveBeenCalled();
  expect(prisma.user.findFirst).not.toHaveBeenCalled();
});
