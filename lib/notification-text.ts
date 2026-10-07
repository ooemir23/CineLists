import type { Dictionary } from "@/lib/i18n/types";
export function notificationText(
  notification: { message: string; payload?: unknown },
  dictionary: Dictionary,
) {
  const payload = notification.payload;
  if (!payload || typeof payload !== "object" || !("kind" in payload))
    return notification.message;
  const record = payload as Record<string, unknown>;
  const template =
    dictionary.notificationTemplates[
      record.kind as keyof Dictionary["notificationTemplates"]
    ];
  if (!template) return notification.message;
  const achievement = record.achievementType;
  const title =
    record.kind === "achievement" && typeof achievement === "string"
      ? dictionary.achievementNames[
          achievement as keyof Dictionary["achievementNames"]
        ]
      : undefined;
  return template.replace(/\{(name|title|preview)\}/g, (_, key) =>
    key === "title" && title
      ? title
      : typeof record[key] === "string"
        ? (record[key] as string)
        : dictionary.common.appName,
  );
}
