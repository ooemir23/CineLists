import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const base = process.env.ADMIN_TEST_BASE_URL || "http://localhost:3100";
const database = new URL(
  process.env.DATABASE_URL || "postgresql://invalid/invalid",
);
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  !["localhost", "127.0.0.1"].includes(database.hostname) ||
  database.pathname !== "/cinelists_admin_test"
)
  throw new Error("Local test environment required.");
const prisma = new PrismaClient();
let checks = 0;
function verify(condition, message) {
  assert.ok(condition, message);
  checks++;
}
function client() {
  const jar = new Map();
  return async (path, options = {}) => {
    const response = await fetch(`${base}${path}`, {
      ...options,
      redirect: "manual",
      headers: {
        cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
        ...options.headers,
      },
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const index = pair.indexOf("=");
      jar.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  };
}
async function login(request, username) {
  const { csrfToken } = await (await request("/api/auth/csrf")).json();
  await request("/api/auth/callback/email", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email: username,
      password: "AdminTest-2026!",
      callbackUrl: `${base}/admin`,
    }),
  });
  return csrfToken;
}
try {
  const anonymous = client();
  verify(
    (await anonymous("/api/admin/export")).status === 403,
    "Anonymous CSV must be denied",
  );
  const protectedPage = await anonymous("/admin");
  verify(
    protectedPage.status === 307 &&
      protectedPage.headers.get("location").includes("/login"),
    "Anonymous page must redirect to login",
  );
  const member = client();
  const csrfToken = await login(member, "test_uye_03");
  verify(
    (await member("/api/admin/export")).status === 403,
    "Member CSV must be denied",
  );
  const memberPage = await (await member("/admin")).text();
  verify(
    memberPage.includes("Bu alan yöneticilere özel") &&
      !memberPage.includes("admin_test@example.test"),
    "Member must not receive admin data",
  );
  await member("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      csrfToken,
      data: {
        sub: "admin-test",
        email: "admin_test@example.test",
        role: "ADMIN",
      },
    }),
  });
  const updatedSession = await (await member("/api/auth/session")).json();
  verify(
    updatedSession.user?.id === "member-test-03",
    "Session update must not change identity",
  );
  verify(
    (await member("/api/admin/export")).status === 403,
    "Session update must not grant admin",
  );

  const admin = client();
  await login(admin, "admin_test");
  const csv = await admin("/api/admin/export?q=test_uye_02");
  const csvText = await csv.text();
  verify(
    csv.status === 200 && csv.headers.get("content-type").includes("text/csv"),
    "CSV export",
  );
  verify(
    csvText.includes("test_uye_02@example.test") &&
      !csvText.includes("test_uye_03@example.test"),
    "Export respects filters",
  );
  verify(
    !csvText.includes("$2") && !csvText.includes("password"),
    "CSV contains no password data",
  );
  verify(
    (await prisma.adminAuditLog.count({
      where: { action: "export-users", actorId: "admin-test" },
    })) > 0,
    "CSV is audited",
  );
  for (const path of [
    "/admin?tab=users&page=2",
    "/admin?tab=users&sort=recent",
    "/admin?tab=users&sort=registered",
    "/admin?tab=users&country=ZZ",
    "/admin?tab=users&q=test_uye_02&q=duplicate",
    "/admin?tab=system",
    "/admin?tab=audit",
    "/admin?days=7",
    "/admin?days=90",
    "/admin/users/member-test-02",
  ]) {
    const response = await admin(path);
    const body = await response.text();
    verify(
      response.status === 200 && !body.includes("Yönetim verileri yüklenemedi"),
      `Page renders: ${path}`,
    );
    verify(!/\$2[aby]\$\d\d\$/.test(body), `No password hash in ${path}`);
  }
  const missing = await (await admin("/admin/users/no-such-test-user")).text();
  verify(
    missing.includes("404") || missing.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
    "Unknown user has not-found state",
  );

  const before = await prisma.analyticsDaily.aggregate({
    _sum: { views: true },
  });
  const event = (headers = {}, path = "/search") =>
    anonymous("/api/analytics/pageview", {
      method: "POST",
      headers: {
        origin: base,
        "content-type": "application/json",
        "x-country-code": "DE",
        ...headers,
      },
      body: JSON.stringify({ path }),
    });
  verify((await event()).status === 204, "Page view accepted");
  const malformed = await anonymous("/api/analytics/pageview", {
    method: "POST",
    headers: { origin: base, "content-type": "application/json" },
    body: "{",
  });
  verify(malformed.status === 400, "Malformed analytics request rejected");
  const oversized = await anonymous("/api/analytics/pageview", {
    method: "POST",
    headers: { origin: base, "content-type": "application/json" },
    body: "x".repeat(2048),
  });
  verify(oversized.status === 413, "Oversized analytics request rejected");
  const after = await prisma.analyticsDaily.aggregate({
    _sum: { views: true },
  });
  verify(after._sum.views === before._sum.views + 1, "Pageview counted once");
  verify(
    (await event({ origin: "https://untrusted.test" })).status === 403,
    "Foreign origin rejected",
  );
  await event({ dnt: "1" });
  await event({ "sec-gpc": "1" });
  await event({}, "/admin");
  await event({}, "/search?q=private");
  const afterExcluded = await prisma.analyticsDaily.aggregate({
    _sum: { views: true },
  });
  verify(
    afterExcluded._sum.views === after._sum.views,
    "Privacy opt-outs and sensitive paths excluded",
  );
  await member("/api/analytics/pageview", {
    method: "POST",
    headers: {
      origin: base,
      "content-type": "application/json",
      "x-country-code": "NL",
    },
    body: JSON.stringify({ path: "/watchlist" }),
  });
  verify(
    (
      await prisma.userAdminProfile.findUnique({
        where: { userId: "member-test-03" },
      })
    ).country === "NL",
    "Member last country updated",
  );
  const revoked = client();
  await login(revoked, "test_uye_04");
  await prisma.user.update({
    where: { id: "member-test-04" },
    data: { isSuspended: true },
  });
  verify(
    !(await (await revoked("/api/auth/session")).json()).user,
    "Existing JWT stops granting access after suspension",
  );
  await prisma.user.update({
    where: { id: "member-test-04" },
    data: { isSuspended: false },
  });
  verify(
    (await (await revoked("/api/auth/session")).json()).user?.id ===
      "member-test-04",
    "Reactivation restores access",
  );
  console.log(`${checks} HTTP / database integration checks passed.`);
} finally {
  await prisma.$disconnect();
}
