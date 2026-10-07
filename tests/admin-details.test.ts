/** @jest-environment jsdom */
import React, { act } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MetricCards } from "@/components/admin/metric-cards";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { tr } from "@/lib/i18n/dictionaries/tr";
import { en } from "@/lib/i18n/dictionaries/en";
jest.mock("@/lib/i18n/i18n-context", () => ({ useTranslation: jest.fn() }));
const data = {
  users: 50,
  suspended: 2,
  onlineCount: 3,
  active: 4,
  newUsers: 5,
  views: 7,
  totalMinutes: 90,
};
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function () {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function () {
      this.open = false;
    },
  });
});
afterEach(cleanup);
test.each([
  ["tr", tr],
  ["en", en],
] as const)("%s: cards and totals are localized", (locale, dict) => {
  (useTranslation as jest.Mock).mockReturnValue({ locale, dict });
  render(React.createElement(MetricCards, { days: 30, data }));
  expect(screen.getByText(dict.admin.registeredUsers)).toBeTruthy();
  expect(screen.getByText(dict.admin.allTime)).toBeTruthy();
  expect(
    screen.getByText(locale === "tr" ? "1 sa 30 dk" : "1 h 30 min"),
  ).toBeTruthy();
});
test("older requests cannot overwrite the currently selected metric", async () => {
  (useTranslation as jest.Mock).mockReturnValue({ locale: "en", dict: en });
  const responses: ((value: unknown) => void)[] = [];
  global.fetch = jest.fn(
    () => new Promise((resolve) => responses.push(resolve)),
  ) as unknown as typeof fetch;
  render(React.createElement(MetricCards, { days: 30, data }));
  fireEvent.click(screen.getByRole("button", { name: /Registered users/ }));
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  fireEvent.click(screen.getByRole("button", { name: /Online/ }));
  expect(responses).toHaveLength(2);
  await act(async () =>
    responses[1]({
      ok: true,
      json: async () => ({
        title: "Current online response",
        type: "users",
        items: [],
        total: 0,
      }),
    }),
  );
  await act(async () =>
    responses[0]({
      ok: true,
      json: async () => ({
        title: "Stale user response",
        type: "users",
        items: [],
        total: 0,
      }),
    }),
  );
  expect(screen.getByText("Current online response")).toBeTruthy();
  expect(screen.queryByText("Stale user response")).toBeNull();
});
