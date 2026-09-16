/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
jest.mock("next/navigation", () => ({usePathname: () => "/movie/12", useSearchParams: () => new URLSearchParams()}));
jest.mock("@/components/media/cast-list", () => ({CastList: () => null}));
jest.mock("@/components/media/season-list", () => ({__esModule: true, default: () => null}));
jest.mock("@/components/media/comments", () => ({CommentsSection: () => null}));
jest.mock("@/components/media/tv-heatmap", () => ({TvHeatmap: () => null}));
jest.mock("@/components/media/media-card", () => ({MediaCard: ({title}: {title: string}) => React.createElement("p", null, title)}));
import { DetailTabs } from "@/components/media/detail-tabs";

afterEach(cleanup);
test("recommendations wait for tab selection and are not aborted by the loading-state render", async () => {
  let finish!: (value: unknown) => void;
  const fetchMock = jest.fn().mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  global.fetch = fetchMock;
  const history = jest.spyOn(window.history, "pushState");
  render(React.createElement(DetailTabs, {type: "movie", tmdbId: 12, title: "Test", cast: [], watchedEpisodes: [], initialComments: []}));
  expect(fetchMock).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", {name: /Benzer/}));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  expect(history).toHaveBeenCalledWith(null, "", "/movie/12?tab=similar");
  finish({ok: true, json: async () => ({results: [{id: 14, title: "Öneri testi"}]})});
  await screen.findByText("Öneri testi");
  fireEvent.click(screen.getByRole("button", {name: /Oyuncular/}));
  fireEvent.click(screen.getByRole("button", {name: /Benzer/}));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  history.mockRestore();
});
