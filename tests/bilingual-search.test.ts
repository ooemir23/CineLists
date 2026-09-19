import { tr } from "@/lib/i18n/dictionaries/tr";
import { en } from "@/lib/i18n/dictionaries/en";

describe("Bilingual & i18n dictionary completeness", () => {
  test("both tr and en have all required nav keys", () => {
    const requiredNavKeys = [
      "home",
      "explore",
      "movies",
      "tvShows",
      "watchlist",
      "watched",
      "watching",
      "stats",
      "community",
      "feed",
      "messages",
      "notifications",
      "profile",
      "settings",
      "login",
      "register",
      "inTheatres",
      "topRated",
      "achievements",
      "platforms",
      "popularGenres",
      "suggestedResults",
      "resultsCount",
      "viewAllResults",
      "noResultsFound",
      "searchHint",
      "goToAdvancedSearch",
      "person",
      "member",
    ] as const;

    for (const key of requiredNavKeys) {
      expect((tr.nav as any)[key]).toBeTruthy();
      expect((en.nav as any)[key]).toBeTruthy();
    }
  });

  test("English translations differ meaningfully from Turkish", () => {
    expect(tr.nav.home).toBe("Ana Sayfa");
    expect(en.nav.home).toBe("Home");

    expect(tr.nav.inTheatres).toBe("Vizyondakiler");
    expect(en.nav.inTheatres).toBe("In Theatres");

    expect(tr.nav.watched).toBe("İzlenenler");
    expect(en.nav.watched).toBe("Watched");

    expect(tr.nav.watchlist).toBe("İzlenecekler");
    expect(en.nav.watchlist).toBe("Watchlist");

    expect(tr.nav.watching).toBe("İzliyorum");
    expect(en.nav.watching).toBe("Watching");
  });

  test("Country localization and badge labels match user expectation", async () => {
    const { getCountryName, getCountryLocative, getCountryBadgeLabel } = await import("@/lib/country");

    expect(getCountryName("GB", "tr")).toBe("İngiltere");
    expect(getCountryName("GB", "en")).toBe("United Kingdom");
    expect(getCountryLocative("GB")).toBe("İngiltere'de");

    expect(getCountryBadgeLabel("GB", "tr")).toBe("İngiltere'de Yok");
    expect(getCountryBadgeLabel("GB", "en")).toBe("Not in UK");

    expect(getCountryName("TR", "tr")).toBe("Türkiye");
    expect(getCountryLocative("TR")).toBe("Türkiye'de");
    expect(getCountryBadgeLabel("TR", "tr")).toBe("Türkiye'de Yok");

    expect(getCountryName("US", "tr")).toBe("ABD");
    expect(getCountryLocative("US")).toBe("ABD'de");
    expect(getCountryBadgeLabel("US", "tr")).toBe("ABD'de Yok");
    expect(getCountryBadgeLabel("US", "en")).toBe("Not in US");

    expect(getCountryName("DE", "tr")).toBe("Almanya");
    expect(getCountryLocative("DE")).toBe("Almanya'da");
    expect(getCountryBadgeLabel("DE", "tr")).toBe("Almanya'da Yok");
  });
});

