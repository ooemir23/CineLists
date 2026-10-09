import type { Dictionary } from "@/lib/i18n/types";
export function acquisitionLabel(
  value: string | null | undefined,
  t: Dictionary["acquisition"],
) {
  return value
    ? Object.prototype.hasOwnProperty.call(t.channels, value)
      ? t.channels[value as keyof typeof t.channels]
      : value
    : t.unknown;
}
