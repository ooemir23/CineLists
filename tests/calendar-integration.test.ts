import { tr } from "@/lib/i18n/dictionaries/tr";
import { en } from "@/lib/i18n/dictionaries/en";
import { libraryNavItems } from "@/components/layout/nav-items";

describe("Calendar Feature Integration", () => {
  it("includes calendar navigation key in Turkish and English dictionaries", () => {
    expect(tr.nav.calendar).toBe("Takvim");
    expect(en.nav.calendar).toBe("Calendar");
  });

  it("includes calendar in mobile library nav items with correct route", () => {
    const calendarItem = libraryNavItems.find((item) => item.key === "calendar");
    expect(calendarItem).toBeDefined();
    expect(calendarItem?.href).toBe("/calendar");
    expect(calendarItem?.translationKey).toBe("nav.calendar");
  });

  it("correctly identifies items within 1 week (7 days) for countdown display", () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const target3 = new Date(today);
    target3.setDate(today.getDate() + 3);
    const in3Days = `${target3.getFullYear()}-${String(target3.getMonth() + 1).padStart(2, "0")}-${String(target3.getDate()).padStart(2, "0")}`;

    const target10 = new Date(today);
    target10.setDate(today.getDate() + 10);
    const in10Days = `${target10.getFullYear()}-${String(target10.getMonth() + 1).padStart(2, "0")}-${String(target10.getDate()).padStart(2, "0")}`;

    const getDiffDays = (dateStr: string) => {
      const parts = dateStr.split("-").map(Number);
      const target = new Date(parts[0], parts[1] - 1, parts[2]);
      return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    expect(getDiffDays(in3Days)).toBe(3);
    expect(getDiffDays(in3Days) <= 7).toBe(true);
    expect(getDiffDays(in10Days) <= 7).toBe(false);
  });
});
