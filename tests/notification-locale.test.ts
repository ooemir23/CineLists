import { notificationText } from "@/lib/notification-text";
import { en } from "@/lib/i18n/dictionaries/en";
import { tr } from "@/lib/i18n/dictionaries/tr";

test("structured notifications follow the reading language, including badge names", () => {
  const badge = {
    message: "old-language",
    payload: { kind: "achievement", achievementType: "FIRST_WATCH" },
  };
  expect(notificationText(badge, en)).toContain(
    en.achievementNames.FIRST_WATCH,
  );
  expect(notificationText(badge, tr)).toContain(
    tr.achievementNames.FIRST_WATCH,
  );
  const follower = {
    message: "old-language",
    payload: { kind: "follower", name: "Alex" },
  };
  expect(notificationText(follower, en)).toBe("Alex started following you.");
  expect(notificationText(follower, tr)).not.toBe(
    notificationText(follower, en),
  );
});
test("legacy notifications without structured data keep their original message", () => {
  expect(notificationText({ message: "Legacy" }, en)).toBe("Legacy");
});
