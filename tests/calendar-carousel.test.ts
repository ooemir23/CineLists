/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { UpcomingEpisodesCarousel } from "@/components/home/carousels/upcoming-episodes-carousel";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { tr } from "@/lib/i18n/dictionaries/tr";
import { en } from "@/lib/i18n/dictionaries/en";
import type { UpcomingEpisode } from "@/lib/calendar-types";
import { writeFileSync, mkdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
jest.mock("@/lib/i18n/i18n-context", () => ({ useTranslation: jest.fn() }));
afterEach(cleanup);
const episodes: UpcomingEpisode[] = [
  {
    showId: 1,
    showTitle: "Today release",
    nextEpisodeDate: "2026-10-07",
    mediaType: "tv",
    platforms: [],
    posterPath: null,
    voteAverage: 0,
  },
  {
    showId: 2,
    showTitle: "Sunday release",
    nextEpisodeDate: "2026-10-11",
    mediaType: "movie",
    platforms: [],
    posterPath: null,
    voteAverage: 0,
  },
  {
    showId: 3,
    showTitle: "Awaited release",
    nextEpisodeDate: "2026-10-15",
    mediaType: "movie",
    platforms: [],
    posterPath: null,
    voteAverage: 0,
    favoritePeople: ["Favorite Director"],
  },
];
for (const [locale, dict] of [
  ["tr", tr],
  ["en", en],
] as const) {
  test(`${locale}: each tab shows only its own release period`, () => {
    (useTranslation as jest.Mock).mockReturnValue({ locale, dict });
    render(
      React.createElement(UpcomingEpisodesCarousel, {
        episodes,
        today: "2026-10-07",
      }),
    );
    expect(screen.getByRole("link", { name: /Awaited release/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Today release/ })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: `${dict.calendarUi.today} 1` }),
    );
    expect(screen.getByRole("link", { name: /Today release/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Awaited release/ })).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: `${dict.calendarUi.week} 2` }),
    );
    expect(screen.getByRole("link", { name: /Sunday release/ })).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Awaited release/ })).toBeNull();
    if (process.env.CINELISTS_PREVIEW_DIR) {
      mkdirSync(process.env.CINELISTS_PREVIEW_DIR, { recursive: true });
      const html = renderToStaticMarkup(
        React.createElement(UpcomingEpisodesCarousel, {
          episodes,
          today: "2026-10-07",
        }),
      );
      writeFileSync(
        `${process.env.CINELISTS_PREVIEW_DIR}/calendar-${locale}.html`,
        `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="style.css"></head><body style="background:#020617;color:white;margin:0;padding:12px"><section class="rounded-3xl p-3 border border-amber-400/20">${html}</section></body></html>`,
      );
    }
  });
}
