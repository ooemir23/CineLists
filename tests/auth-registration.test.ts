jest.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
jest.mock("@/auth", () => ({ auth: jest.fn(), signIn: jest.fn(), signOut: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  userAdminProfile: { create: jest.fn() },
} }));
jest.mock("bcryptjs", () => ({ hash: jest.fn().mockResolvedValue("hashed") }));
jest.mock("@/lib/mail", () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock("@/lib/ratelimit", () => ({ checkRateLimit: jest.fn().mockReturnValue({ allowed: true }) }));
jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue(new Headers()) }));
jest.mock("@/lib/i18n/server", () => ({ getServerLocale: jest.fn().mockResolvedValue("en") }));

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerUser, signInWithGoogle } from "@/lib/auth-actions";

test("email registration signs in directly to home while leaving the profile incomplete", async () => {
  (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  (prisma.user.create as jest.Mock).mockResolvedValue({ id: "new-user" });
  const form = new FormData();
  form.set("email", "film@example.com");
  form.set("password", "password123");
  await registerUser(form);
  expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ hasCompletedOnboarding: false, locale: "en" }),
  }));
  expect(signIn).toHaveBeenCalledWith("email", {
    email: "film@example.com", password: "password123", redirectTo: "/",
  });
});

test("Google sign-in returns directly to home", async () => {
  const oldId = process.env.AUTH_GOOGLE_ID;
  const oldSecret = process.env.AUTH_GOOGLE_SECRET;
  try {
    process.env.AUTH_GOOGLE_ID = "test-id";
    process.env.AUTH_GOOGLE_SECRET = "test-secret";
    await signInWithGoogle();
    expect(signIn).toHaveBeenCalledWith("google", { redirectTo: "/" });
  } finally {
    if (oldId === undefined) delete process.env.AUTH_GOOGLE_ID;
    else process.env.AUTH_GOOGLE_ID = oldId;
    if (oldSecret === undefined) delete process.env.AUTH_GOOGLE_SECRET;
    else process.env.AUTH_GOOGLE_SECRET = oldSecret;
  }
});

test("registration retries a concurrent username collision without changing email", async () => {
  jest.clearAllMocks();
  (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
  (prisma.user.create as jest.Mock)
    .mockRejectedValueOnce({ code: "P2002", meta: { target: ["username"] } })
    .mockResolvedValueOnce({ id: "new-user" });
  const form = new FormData();
  form.set("email", "collision@example.com");
  form.set("password", "password123");
  await registerUser(form);
  const attempts = (prisma.user.create as jest.Mock).mock.calls;
  expect(attempts).toHaveLength(2);
  expect(attempts[1][0].data.username).toMatch(/^collision_[a-f0-9]{8}$/);
  expect(attempts[1][0].data.email).toBe("collision@example.com");
});
