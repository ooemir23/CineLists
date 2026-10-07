const originalEnvironment = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnvironment };
  delete process.env.AUTH_SECRET;
  delete process.env.NEXTAUTH_SECRET;
});
afterEach(() => { process.env = originalEnvironment; });

test("production requires a configured secret rather than the public development key", async () => {
  Object.assign(process.env, { NODE_ENV: "production" });
  const { authConfig } = await import("@/auth.config");
  expect(authConfig.secret).toBeUndefined();
});

test("production supports the legacy secret and trims whitespace", async () => {
  Object.assign(process.env, { NODE_ENV: "production", AUTH_SECRET: "  ", NEXTAUTH_SECRET: "  configured-secret  " });
  const { authConfig } = await import("@/auth.config");
  expect(authConfig.secret).toBe("configured-secret");
});

test("development remains usable without a configured secret", async () => {
  Object.assign(process.env, { NODE_ENV: "development" });
  const { authConfig } = await import("@/auth.config");
  expect(authConfig.secret).toBeTruthy();
});

test("production rejects an explicitly supplied public development key", async () => {
  Object.assign(process.env, { NODE_ENV: "production", AUTH_SECRET: "cinelists-secret-key-development-2026-auth-3891724" });
  await expect(import("@/auth.config")).rejects.toThrow("public development auth secret");
});
