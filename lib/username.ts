export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}
export function isValidUsername(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9_]{1,30}$/.test(value);
}
