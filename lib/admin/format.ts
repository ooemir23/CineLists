import type { Dictionary, Locale } from "@/lib/i18n/types";
export type AdminText = Dictionary["admin"];
export function interpolate(
  text: string,
  values: Record<string, string | number>,
) {
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    String(values[key] ?? match),
  );
}
export function adminNumber(value: number, locale: Locale) {
  return value.toLocaleString(locale === "tr" ? "tr-TR" : "en-US");
}
export function adminDate(
  value: Date | string | null | undefined,
  locale: Locale,
  unknown: string,
) {
  if (!value) return unknown;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return unknown;
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(date);
}
export function adminDuration(
  minutes: number,
  locale: Locale,
  text: AdminText,
) {
  const n = Math.max(0, Math.floor(minutes));
  return n >= 60
    ? interpolate(text.hoursMinutes, {
        hours: adminNumber(Math.floor(n / 60), locale),
        minutes: adminNumber(n % 60, locale),
      })
    : interpolate(text.minutes, { count: adminNumber(n, locale) });
}
export function onlineAt(
  lastSeen: Date | string | null | undefined,
  suspended = false,
  now = Date.now(),
) {
  if (suspended || !lastSeen) return false;
  const delta = now - new Date(lastSeen).getTime();
  return delta >= 0 && delta < 5 * 60_000;
}
export const REMOVED_COMMENTS = [
  "[Bu yorum yönetici tarafından kaldırıldı.]",
  "[This comment was removed by an administrator.]",
];
export function adminActionLabel(action: string, t: AdminText) {
  return (
    (
      {
        suspend: t.suspendLog,
        activate: t.activateLog,
        "redact-comment": t.commentLog,
        "redact-review": t.reviewLog,
        "export-users": t.exportLog,
      } as Record<string, string>
    )[action] || action
  );
}
export function adminPathLabel(path: string, t: AdminText) {
  return (
    (
      {
        "/": t.home,
        "/search": t.search,
        "/calendar": t.traffic,
        "/watched": t.watched,
        "/watchlist": t.watchlist,
        "/watching": t.watching,
        "/community": t.users,
        "/feed": t.activities,
        "/messages": t.messages,
        "/messages/[id]": t.messages,
        "/profile/[id]": t.profile,
        "/settings": t.profilePreferences,
        "/stats": t.summary,
        "/achievements": t.achievements,
      } as Record<string, string>
    )[path] || path
  );
}
