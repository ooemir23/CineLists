jest.mock("@/lib/ratelimit", () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
}));
import { NextRequest } from "next/server";
import { POST } from "@/app/api/analytics/acquisition/route";
import {
  ACQUISITION_COOKIE,
  normalizeAcquisition,
  readAcquisition,
  signAcquisition,
} from "@/lib/acquisition";
import { checkRateLimit } from "@/lib/ratelimit";
function req(data: unknown = {}, headers: Record<string, string> = {}) {
  return new NextRequest("https://cinelists.com/api/analytics/acquisition", {
    method: "POST",
    headers: {
      origin: "https://cinelists.com",
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 Chrome",
      ...headers,
    },
    body: JSON.stringify(data),
  });
}
beforeEach(() => {
  process.env.AUTH_SECRET = "test-acquisition";
  process.env.AUTH_URL = "https://cinelists.com";
  (checkRateLimit as jest.Mock).mockReturnValue({ allowed: true });
});
test("sets signed HttpOnly first touch without database or auth lookup", async () => {
  const r = await POST(req({ source: "instagram", campaign: "launch" }));
  expect(r.status).toBe(204);
  const cookie = r.cookies.get(ACQUISITION_COOKIE);
  expect(readAcquisition(cookie?.value)).toMatchObject({
    source: "instagram",
    campaign: "launch",
  });
  expect(r.headers.get("set-cookie")).toMatch(/HttpOnly/);
  expect(r.headers.get("set-cookie")).toMatch(/SameSite=lax/);
  expect(r.headers.get("cache-control")).toBe("private, no-store");
});
test("later visits cannot overwrite the first source", async () => {
  const token = signAcquisition(
    normalizeAcquisition({ source: "instagram" }, "https://cinelists.com")!,
  )!;
  const r = await POST(
    req({ source: "google" }, { cookie: `${ACQUISITION_COOKIE}=${token}` }),
  );
  expect(r.headers.get("set-cookie")).toBeNull();
  expect(checkRateLimit).not.toHaveBeenCalled();
});
test.each([
  { dnt: "1" },
  { "sec-gpc": "1" },
  { "user-agent": "Googlebot" },
] as Record<string, string>[])(
  "privacy and robots skip attribution",
  async (headers) => {
    const r = await POST(req({ source: "instagram" }, headers));
    expect(r.status).toBe(204);
    expect(r.cookies.get(ACQUISITION_COOKIE)?.value).toBe("");
    expect(checkRateLimit).not.toHaveBeenCalled();
  },
);
test("foreign origin cannot set the cookie", async () => {
  expect((await POST(req({}, { origin: "https://evil.test" }))).status).toBe(
    403,
  );
});
test("rate limit and oversized payloads remain bounded", async () => {
  (checkRateLimit as jest.Mock).mockReturnValue({ allowed: false });
  expect((await POST(req())).status).toBe(429);
  (checkRateLimit as jest.Mock).mockReturnValue({ allowed: true });
  expect((await POST(req({ campaign: "x".repeat(2000) }))).status).toBe(413);
});
