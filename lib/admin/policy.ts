export function isAdminId(
  id: string | null | undefined,
  configured = process.env.ADMIN_USER_IDS,
): boolean {
  return (
    !!id &&
    (configured || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .includes(id)
  );
}

export function safeInternalRedirect(value: string): string {
  return /^\/(?!\/)/.test(value) && !/[\\\r\n]/.test(value) ? value : "/";
}

export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  // Prevent spreadsheet formula execution, including leading whitespace.
  const safe =
    /^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function dateWindow(value?: string) {
  const days = value === "7" ? 7 : value === "90" ? 90 : 30;
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  return { days, since };
}

export function pagination(value?: string) {
  const parsed = Number(value);
  const page =
    Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 10000) : 1;
  return { page, take: 25, skip: (page - 1) * 25 };
}
