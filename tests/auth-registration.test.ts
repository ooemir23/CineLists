jest.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
jest.mock("@/lib/acquisition-server", () => ({ registrationAcquisition: jest.fn().mockResolvedValue({}) }));
jest.mock("@/auth", () => ({ auth: jest.fn(), signIn: jest.fn(), signOut: jest.fn() }));
jest.mock("@/lib/prisma", () => ({ prisma: {
  user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  userAdminProfile: { create: jest.fn() },
} }));
jest.mock("bcryptjs", () => ({ hash: jest.fn().mockResolvedValue("hashed") }));
jest.mock("@/lib/mail", () => ({ sendPasswordResetEmail: jest.fn() }));
jest.mock("@/lib/ratelimit", () => ({ checkRateLimit: jest.fn().mockReturnValue({ allowed: true }) }));
jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue(new Headers()), cookies: jest.fn().mockResolvedValue({ set: jest.fn(), delete: jest.fn() }) }));
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

test('email registration preserves captured campaign separately from survey response',async()=>{
 const {registrationAcquisition}=await import('@/lib/acquisition-server');
 (registrationAcquisition as jest.Mock).mockResolvedValue({acquisitionSource:'instagram',acquisitionCampaign:'launch'});
 (prisma.user.create as jest.Mock).mockResolvedValue({id:'attributed-user'});
 const form=new FormData();form.set('email','source@example.com');form.set('password','password123');form.set('discoveryAnswer','friend');
 await registerUser(form);
 expect(prisma.userAdminProfile.create).toHaveBeenCalledWith({data:expect.objectContaining({userId:'attributed-user',acquisitionSource:'instagram',acquisitionCampaign:'launch',discoveryAnswer:'friend'})});
});
test('Google signup carries the optional response across OAuth without labeling Google as the arrival source',async()=>{
 const {cookies}=await import('next/headers');
 const beforeId=process.env.AUTH_GOOGLE_ID,beforeSecret=process.env.AUTH_GOOGLE_SECRET;
 try {
 process.env.AUTH_GOOGLE_ID='test';process.env.AUTH_GOOGLE_SECRET='test';
 const form=new FormData();form.set('discoveryAnswer','friend');await signInWithGoogle(form);
 expect((await cookies()).set).toHaveBeenCalledWith('cinelists_discovery','friend',expect.objectContaining({httpOnly:true,maxAge:600}));
 }finally{if(beforeId===undefined)delete process.env.AUTH_GOOGLE_ID;else process.env.AUTH_GOOGLE_ID=beforeId;if(beforeSecret===undefined)delete process.env.AUTH_GOOGLE_SECRET;else process.env.AUTH_GOOGLE_SECRET=beforeSecret;}
});
