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
        "revoke-sessions": t.revokeSessionsLog,
        "redact-comment": t.commentLog,
        "redact-review": t.reviewLog,
        "export-users": t.exportLog,
        "purge-expired": t.purgeExpiredLog,
      } as Record<string, string>
    )[action] || action
  );
}
export function adminPathLabel(path: string, t: AdminText) {
  return (
    (
      {
        "/": t.pathHome,
        "/in-theatres": t.pathInTheatres,
        "/tv-shows": t.pathTvShows,
        "/top-rated": t.pathTopRated,
        "/movie/[id]": t.pathMovieDetail,
        "/tv/[id]": t.pathTvDetail,
        "/tv/[id]/episode": t.pathEpisodeDetail,
        "/person/[id]": t.pathPersonDetail,
        "/profile": t.pathProfile,
        "/profile/[id]": t.pathProfile,
        "/search": t.pathSearch,
        "/watched": t.pathWatched,
        "/watchlist": t.pathWatchlist,
        "/watching": t.pathWatching,
        "/community": t.pathCommunity,
        "/feed": t.pathFeed,
        "/calendar": t.pathCalendar,
        "/achievements": t.pathAchievements,
        "/upcoming-episodes": t.pathUpcomingEpisodes,
        "/messages": t.pathMessages,
        "/messages/[id]": t.pathMessages,
        "/notifications": t.pathNotifications,
        "/settings": t.pathSettings,
        "/stats": t.pathStats,
        "/taste-match": t.pathTasteMatch,
        "/recommendations": t.pathRecommendations,
        "/explore/[type]/[category]": t.pathExploreCategory,
        "/privacy": t.pathPrivacy,
        "/privacy-policy": t.pathPrivacy,
      } as Record<string, string>
    )[path] || path
  );
}
