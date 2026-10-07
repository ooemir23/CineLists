import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
const script = path.resolve("start.sh");
test.each(["", "   ", "cinelists-secret-key-development-2026-auth-3891724"])(
  "startup fails closed for an invalid secret",
  (secret) => {
    const result = spawnSync("sh", [script], {
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "production",
        AUTH_SECRET: secret,
      },
      encoding: "utf8",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("must be configured");
  },
);
test("configured startup does not disclose OAuth secret fragments or reuse the auth secret for actions", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "cinelists-start-test-"));
  try {
    writeFileSync(
      path.join(directory, "server.js"),
      "if (process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) process.exit(42);",
    );
    const result = spawnSync("sh", [script], {
      cwd: directory,
      env: {
        PATH: process.env.PATH,
        NODE_ENV: "production",
        AUTH_SECRET: "private-test-value",
        AUTH_GOOGLE_SECRET: "oauth-private-fragment-test",
      },
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("oauth-pr");
    expect(result.stdout).not.toContain("private-test-value");
  } finally {
    rmSync(directory, { recursive: true });
  }
});
