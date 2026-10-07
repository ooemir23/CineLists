export type CalendarFilter = "awaiting" | "today" | "week";
const DAY = 86_400_000;

// TMDB supplies release dates, not timestamps. Use one calendar clock on the
// server and client so UTC parsing/DST never moves a release into another day.
export function calendarToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function calendarDay(date: string | null | undefined): number | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const value = Date.parse(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(value) ||
    new Date(value).toISOString().slice(0, 10) !== date
  )
    return null;
  return value / DAY;
}

export function calendarDaysLeft(
  date: string | null | undefined,
  today: string,
): number | null {
  const target = calendarDay(date),
    current = calendarDay(today);
  return target === null || current === null ? null : target - current;
}

export function matchesCalendarFilter(
  date: string | null | undefined,
  filter: CalendarFilter,
  today: string,
): boolean {
  const day = calendarDay(date),
    current = calendarDay(today);
  if (day === null || current === null || day < current) return false;
  if (filter === "awaiting") return day - current > 7;
  if (filter === "today") return day === current;
  const weekday = new Date(current * DAY).getUTCDay();
  const monday = current - ((weekday + 6) % 7);
  return day >= monday && day <= monday + 6;
}
