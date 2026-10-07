import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Configure only a header overwritten by the trusted reverse proxy. Without it
// all callers share a conservative bucket; arbitrary forwarded headers are ignored.
export function trustedClientIp(headers: Headers) {
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  return header
    ? headers.get(header)?.split(",")[0]?.trim().slice(0, 128) || "unknown"
    : "unknown";
}

export async function allowCredentialAttempt(
  identifier: string,
  headers: Headers,
) {
  const ip = trustedClientIp(headers);
  const account = identifier
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ıİ]/g, "i");
  const now = new Date();
  const expires = new Date(now.getTime() + 5 * 60_000);
  const buckets = [
    [`ip:${ip}`, 50],
    [`account:${account}`, 15],
    [`pair:${ip}:${account}`, 10],
  ] as const;
  return prisma.$transaction(async (tx) => {
    for (const [raw, limit] of buckets) {
      const key = createHash("sha256").update(raw).digest("hex");
      const rows = await tx.$queryRaw<{ count: number }[]>`
                INSERT INTO "AuthRateLimit" ("key", "count", "expires") VALUES (${key}, 1, ${expires})
                ON CONFLICT ("key") DO UPDATE SET
                  "count" = CASE WHEN "AuthRateLimit"."expires" <= ${now} THEN 1 ELSE "AuthRateLimit"."count" + 1 END,
                  "expires" = CASE WHEN "AuthRateLimit"."expires" <= ${now} THEN ${expires} ELSE "AuthRateLimit"."expires" END
                RETURNING "count"`;
      if (rows[0].count > limit) return false;
    }
    await tx.authRateLimit.deleteMany({ where: { expires: { lt: now } } });
    return true;
  });
}
