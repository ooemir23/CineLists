import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PortalHero } from "@/components/portal/portal-hero";
import { PortalNewsGrid } from "@/components/portal/portal-news-grid";
import { PortalCommunityPulse } from "@/components/portal/portal-community-pulse";
import { PortalHomeFeed } from "@/components/portal/portal-home-feed";
import { PortalRightRail } from "@/components/portal/portal-right-rail";
import { PortalHubStrip } from "@/components/portal/portal-hub-strip";

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/comment-actions", () => ({
  addActivityComment: jest.fn(),
  getActivityComments: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/activity-actions", () => ({
  voteActivity: jest.fn(),
}));

jest.mock("@/lib/actions", () => ({
  toggleToWatch: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Merlin-inspired Portal Components", () => {
  test("PortalHero renders featured item title, badge, and ratings", () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalHero, {
        items: [
          {
            id: 101,
            title: "Dune: Part Two",
            overview: "Paul Atreides unites with Chani and the Fremen...",
            backdrop_path: "/dune.jpg",
            vote_average: 8.5,
            media_type: "movie",
            release_date: "2024-03-01",
            vote_count: 5200,
          },
        ],
      })
    );

    expect(html).toContain("Dune: Part Two");
    expect(html).toContain("Öne Çıkan");
    expect(html).toContain("8.5 / 10");
    expect(html).toContain("href=\"/movie/101\"");
  });

  test("PortalNewsGrid renders featured cards and compact list", () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalNewsGrid, {
        title: "Vizyondakiler",
        viewAllHref: "/?type=movie",
        featuredItems: [
          {
            id: 201,
            title: "Oppenheimer",
            backdrop_path: "/oppen.jpg",
            poster_path: "/oppen_poster.jpg",
            vote_average: 8.9,
            release_date: "2023-07-21",
            media_type: "movie",
          },
        ],
        compactItems: [
          {
            id: 202,
            title: "Gladiator II",
            backdrop_path: "/glad.jpg",
            poster_path: "/glad_poster.jpg",
            vote_average: 7.8,
            release_date: "2024-11-22",
            media_type: "movie",
          },
        ],
      })
    );

    expect(html).toContain("Vizyondakiler");
    expect(html).toContain("Yakında");
    expect(html).toContain("Oppenheimer");
    expect(html).toContain("Yeni");
    expect(html).toContain("href=\"/movie/201\"");
  });

  test("PortalHomeFeed renders live feed and stacked binge deck in vertical layout", () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalHomeFeed, {
        layout: "vertical",
        activities: [
          {
            id: "act-1",
            type: "WATCHED",
            createdAt: new Date("2024-01-01"),
            user: { id: "user-1", name: "Mehmet", image: null },
            media: { id: "401", tmdbId: 401, title: "Breaking Bad", posterPath: "/bb.jpg", backdropPath: null, type: "TV" },
            episodeRange: {
              seasonNumber: 1,
              fromEpisode: 1,
              toEpisode: 4,
              count: 4,
              episodeList: [
                { number: 1, title: "Pilot" },
                { number: 2, title: "Cat's in the Bag..." },
                { number: 3, title: "...And the Bag's in the River" },
                { number: 4, title: "Cancer Man" },
              ],
            },
          } as any,
        ],
      })
    );

    expect(html).toContain("Canlı Sosyal Akış");
    expect(html).toContain("Canlı");
    expect(html).toContain("Mehmet");
    expect(html).toContain("Breaking Bad");
    expect(html).toContain("4 Bölüm");
    expect(html).toContain("S1 • B1 - B4");
    expect(html).toContain("Tüm Akışı İncele");
  });

  test("PortalCommunityPulse renders live stats and reader reactions", () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalCommunityPulse, {
        activeUsersCount: 150,
        dailyReviewsCount: 65,
        activeListsCount: 220,
        topContributorName: "Emir_Sinefil",
        focusTitle: "Interstellar",
      })
    );

    expect(html).toContain("CineLists Nabzı");
    expect(html).toContain("Canlı");
    expect(html).toContain("150");
    expect(html).toContain("Sinefil çevrimiçi");
    expect(html).toContain("Emir_Sinefil");
    expect(html).toContain("Günün Sinefili");
    expect(html).toContain("Interstellar");
    expect(html).toContain("Son İzleyici Tepkileri");
  });

  test("PortalRightRail renders ranked trending topics and poll widget", () => {
    const html = renderToStaticMarkup(
      React.createElement(PortalRightRail, {
        trendingTopics: [
          {
            id: 301,
            rank: 1,
            title: "Stranger Things 5",
            heat: 100,
            heatStatus: "Çok sıcak",
            media_type: "tv",
          },
        ],
        recommendations: [
          {
            id: 302,
            title: "The Godfather",
            poster_path: "/godfather.jpg",
            score: 92,
            category: "Kült Başyapıt",
            media_type: "movie",
          },
        ],
      })
    );

    expect(html).toContain("Şu An Konuşulanlar");
    expect(html).toContain("#1");
    expect(html).toContain("Stranger Things 5");
    expect(html).toContain("Çok sıcak");
    expect(html).toContain("Ne İzleyebiliriz?");
    expect(html).toContain("The Godfather");
    expect(html).toContain("92");
    expect(html).toContain("Haftanın Anketi");
  });

  test("PortalHubStrip renders platform hubs", () => {
    const html = renderToStaticMarkup(React.createElement(PortalHubStrip));
    expect(html).toContain("Platform &amp; Yayın Hub&#x27;ları");
    expect(html).toContain("Netflix Yapımları");
    expect(html).toContain("Prime Video");
    expect(html).toContain("Disney+ Evreni");
    expect(html).toContain("BluTV Özel");
  });
});
