import "server-only";
import { getAdmin } from "./access";
import { checkRateLimit } from "@/lib/ratelimit";
import { getDictionary } from "@/lib/i18n/server";
import { resolveLocale } from "@/lib/i18n/resolve-locale";
export function privateJson(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function adminRequest(request: Request) {
  const locale = resolveLocale(request.headers);
  const t = getDictionary(locale).admin;
  const admin = await getAdmin();
  return {
    locale,
    t,
    admin,
    error: !admin
      ? privateJson({ error: t.unauthorized }, 403)
      : !checkRateLimit(`admin-read:${admin.id}`, 120, 60_000).allowed
        ? privateJson({ error: t.rateLimited }, 429)
        : null,
  };
}
