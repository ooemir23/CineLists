/** @jest-environment jsdom */
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: () => new URLSearchParams(),
}));
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { DailyChart } from "@/components/admin/daily-chart";
import { Pageview } from "@/components/analytics/pageview";
import { usePathname } from "next/navigation";

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  jest.useFakeTimers();
  (usePathname as jest.Mock).mockReturnValue("/");
  Object.defineProperty(navigator, "doNotTrack", {
    configurable: true,
    value: "0",
  });
  Object.defineProperty(navigator, "globalPrivacyControl", {
    configurable: true,
    value: false,
  });
  global.fetch = jest.fn(async () => ({ ok: true })) as unknown as typeof fetch;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});

test("daily chart can transition between empty and populated data without changing hook order", () => {
  act(() => root.render(React.createElement(DailyChart, { rows: [] })));
  act(() =>
    root.render(
      React.createElement(DailyChart, {
        rows: [{ date: "2026-10-06", label: "6 Eki", value: 5 }],
      }),
    ),
  );
  expect(container.querySelectorAll("button").length).toBeGreaterThan(0);
  act(() => root.render(React.createElement(DailyChart, { rows: [] })));
  expect(
    container.querySelectorAll('button[aria-label*="görüntüleme"]'),
  ).toHaveLength(0);
  expect(container.textContent).toContain("Seçili dönemde ölçüm bulunmuyor.");
});

test.each(["do-not-track", "global-privacy-control", "admin"])(
  "%s disables both pageviews and heartbeats",
  (scenario) => {
    if (scenario === "do-not-track")
      Object.defineProperty(navigator, "doNotTrack", {
        configurable: true,
        value: "1",
      });
    else if (scenario === "global-privacy-control")
      Object.defineProperty(navigator, "globalPrivacyControl", {
        configurable: true,
        value: true,
      });
    else (usePathname as jest.Mock).mockReturnValue("/admin");
    act(() => root.render(React.createElement(Pageview)));
    act(() => jest.advanceTimersByTime(100000));
    expect(fetch).not.toHaveBeenCalled();
  },
);

test("navigating to admin cleans up existing heartbeat timers", () => {
  act(() => root.render(React.createElement(Pageview)));
  (fetch as jest.Mock).mockClear();
  (usePathname as jest.Mock).mockReturnValue("/admin");
  act(() => root.render(React.createElement(Pageview)));
  act(() => jest.advanceTimersByTime(100000));
  expect(fetch).not.toHaveBeenCalled();
});
