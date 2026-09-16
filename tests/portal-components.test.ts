import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PortalHero } from "@/components/portal/portal-hero";
import { PortalNewsGrid } from "@/components/portal/portal-news-grid";
import { PortalCommunityPulse } from "@/components/portal/portal-community-pulse";
import { PortalRightRail } from "@/components/portal/portal-right-rail";
import { PortalHubStrip } from "@/components/portal/portal-hub-strip";

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
    expect(html).toContain("Oppenheimer");
    expect(html).toContain("Gladiator II");
    expect(html).toContain("Yeni");
    expect(html).toContain("href=\"/movie/201\"");
    expect(html).toContain("href=\"/movie/202\"");
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
