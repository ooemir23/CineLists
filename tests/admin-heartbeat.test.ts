jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/ratelimit", () => ({
  checkRateLimit: () => ({ allowed: true }),
}));
jest.mock("@/lib/prisma", () => ({ prisma: { $transaction: jest.fn() } }));
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/analytics/heartbeat/route";
const request = (headers: Record<string, string> = {}, seconds = 900) =>
  new Request("https://cinelists.com/api/analytics/heartbeat", {
    method: "POST",
    headers: {
      origin: "https://cinelists.com",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ seconds }),
  });
beforeEach(() => {
  process.env.ANALYTICS_ENABLED = "true";
  process.env.AUTH_URL = "https://cinelists.com";
  jest.useFakeTimers().setSystemTime(new Date("2026-10-07T12:00:00Z"));
  (auth as jest.Mock).mockResolvedValue({ user: { id: "member" } });
});
afterEach(() => {
  jest.useRealTimers();
  delete process.env.ANALYTICS_ENABLED;
  delete process.env.AUTH_URL;
});
const privacyHeaders: Record<string, string>[] = [
  { dnt: "1" },
  { "sec-gpc": "1" },
  { "user-agent": "Googlebot" },
];
test.each(privacyHeaders)(
  "privacy opt-outs and bots do not read member identity or write time",
  async (headers) => {
    expect((await POST(request(headers))).status).toBe(204);
    expect(auth).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  },
);
test.each([
  ["2026-10-07T11:59:15Z", 45],
  ["2026-10-07T11:00:00Z", 0],
  [null, 0],
] as const)("time comes from the server baseline %s", async (last, count) => {
  const tx = {
    userAdminProfile: {
      upsert: jest.fn(),
      update: jest.fn().mockResolvedValue({ activeSeconds: 120 + count }),
    },
    $queryRaw: jest
      .fn()
      .mockResolvedValue([{ heartbeatAt: last ? new Date(last) : null }]),
    memberDailyVisit: { upsert: jest.fn() },
  };
  (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) =>
    callback(tx),
  );
  expect((await POST(request())).status).toBe(204);
  expect(tx.userAdminProfile.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ activeSeconds: { increment: count } }),
    }),
  );
  expect(tx.memberDailyVisit.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      update: expect.objectContaining({ activeSeconds: { increment: count } }),
    }),
  );
});
