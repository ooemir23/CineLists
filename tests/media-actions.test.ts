import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaActions } from "@/components/media/media-actions";

jest.mock("@/lib/actions", () => ({
  toggleToWatch: jest.fn(),
}));

jest.mock("@/components/media/recommend-modal", () => ({
  RecommendModal: () => null,
}));

jest.mock("@/lib/activity-actions", () => ({
  toggleWatchedStatus: jest.fn(),
  setWatchStatus: jest.fn(),
  saveWatchDetails: jest.fn(),
}));

jest.mock("@/lib/social-actions", () => ({
  getFriends: jest.fn().mockResolvedValue([]),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("MediaActions", () => {
  test("does not render 'İzliyorum' button when type is 'movie'", () => {
    const html = renderToStaticMarkup(
      React.createElement(MediaActions, {
        tmdbId: 101,
        type: "movie",
        title: "Inception",
        posterPath: "/inception.jpg",
        initialInWatchlist: false,
      })
    );

    expect(html).toContain("Takip Et");
    expect(html).toContain("İzledim");
    expect(html).not.toContain("İzliyorum");
  });

  test("renders 'İzliyorum' button when type is 'tv'", () => {
    const html = renderToStaticMarkup(
      React.createElement(MediaActions, {
        tmdbId: 202,
        type: "tv",
        title: "Breaking Bad",
        posterPath: "/bb.jpg",
        initialInWatchlist: false,
      })
    );

    expect(html).toContain("Takip Et");
    expect(html).toContain("İzliyorum");
    expect(html).toContain("İzledim");
  });
});
