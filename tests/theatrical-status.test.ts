import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getTheatricalStatus } from "@/lib/theatrical";
import { WatchProviders } from "@/components/media/watch-providers";

describe("Theatrical Status Detection", () => {
  test("identifies movies recently released in theaters as isInTheaters", () => {
    // 5 days ago in theaters
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const movieData = {
      media_type: "movie",
      release_dates: {
        results: [
          {
            iso_3166_1: "TR",
            release_dates: [
              { type: 3, release_date: fiveDaysAgo },
            ],
          },
        ],
      },
    };

    const status = getTheatricalStatus(movieData, "TR");
    expect(status.isInTheaters).toBe(true);
    expect(status.isUpcoming).toBe(false);
  });

  test("identifies movies releasing in the near future as upcoming in theaters", () => {
    // 5 days in future
    const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const movieData = {
      media_type: "movie",
      release_dates: {
        results: [
          {
            iso_3166_1: "TR",
            release_dates: [
              { type: 3, release_date: fiveDaysLater },
            ],
          },
        ],
      },
    };

    const status = getTheatricalStatus(movieData, "TR");
    expect(status.isInTheaters).toBe(true);
    expect(status.isUpcoming).toBe(true);
  });

  test("marks movie as not in theaters if digital release has already passed", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const movieData = {
      media_type: "movie",
      release_dates: {
        results: [
          {
            iso_3166_1: "TR",
            release_dates: [
              { type: 3, release_date: thirtyDaysAgo },
              { type: 4, release_date: tenDaysAgo }, // digital released
            ],
          },
        ],
      },
    };

    const status = getTheatricalStatus(movieData, "TR");
    expect(status.isInTheaters).toBe(false);
  });

  test("returns false for TV shows", () => {
    const status = getTheatricalStatus({ media_type: "tv", number_of_seasons: 2 }, "TR");
    expect(status.isInTheaters).toBe(false);
  });
});

describe("WatchProviders Theatrical Rendering", () => {
  test("renders 'Sinemalarda' when movie has no streaming providers but is in theaters", () => {
    const html = renderToStaticMarkup(
      React.createElement(WatchProviders, {
        providers: null,
        countryCode: "TR",
        mediaTitle: "Resident Evil",
        theatricalStatus: {
          isInTheaters: true,
          isUpcoming: false,
        },
      })
    );

    expect(html).toContain("Sinemalarda");
    expect(html).not.toContain("Türkiye&#x27;de Yayın Yok");
    expect(html).not.toContain("Türkiye'de Yayın Yok");
  });

  test("renders 'Yakında Sinemalarda' when movie is upcoming in theaters", () => {
    const html = renderToStaticMarkup(
      React.createElement(WatchProviders, {
        providers: null,
        countryCode: "TR",
        mediaTitle: "Resident Evil",
        theatricalStatus: {
          isInTheaters: true,
          isUpcoming: true,
        },
      })
    );

    expect(html).toContain("Yakında Sinemalarda");
    expect(html).not.toContain("Türkiye&#x27;de Yayın Yok");
  });

  test("renders 'Türkiye'de Yayın Yok' when movie is not in theaters and has no providers for TR", () => {
    const html = renderToStaticMarkup(
      React.createElement(WatchProviders, {
        providers: null,
        countryCode: "TR",
        mediaTitle: "Old Movie",
        theatricalStatus: {
          isInTheaters: false,
          isUpcoming: false,
        },
      })
    );

    expect(html).toContain("Türkiye&#x27;de Yayın Yok");
    expect(html).not.toContain("Sinemalarda");
  });

  test("renders 'İngiltere'de Yayın Yok' when user is in GB and content has no providers", () => {
    const html = renderToStaticMarkup(
      React.createElement(WatchProviders, {
        providers: null,
        countryCode: "GB",
        mediaTitle: "UK Film",
        theatricalStatus: {
          isInTheaters: false,
          isUpcoming: false,
        },
      })
    );

    expect(html).toContain("İngiltere&#x27;de Yayın Yok");
    expect(html).not.toContain("Türkiye");
  });

  test("renders UK theatrical release when in theaters in GB", () => {
    const html = renderToStaticMarkup(
      React.createElement(WatchProviders, {
        providers: null,
        countryCode: "GB",
        mediaTitle: "UK Film",
        theatricalStatus: {
          isInTheaters: true,
          isUpcoming: false,
        },
      })
    );

    expect(html).toContain("Sinemalarda");
    expect(html).toContain("İngiltere&#x27;de Sinemalarda Gösterimde");
  });
});
