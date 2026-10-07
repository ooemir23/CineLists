/** @jest-environment jsdom */
import React, { act } from "react";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalMobileDrawer } from "@/components/portal/portal-mobile-drawer";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { tr } from "@/lib/i18n/dictionaries/tr";
import { en } from "@/lib/i18n/dictionaries/en";

jest.mock("next-auth/react", () => ({ signOut: jest.fn() }));
jest.mock("sonner", () => ({ toast: { error: jest.fn() } }));
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/lib/i18n/i18n-context", () => ({ useTranslation: jest.fn() }));
jest.mock("@/components/layout/language-selector", () => ({ LanguageSelector: () => React.createElement("button", {}, "Language selector") }));
jest.mock("@/components/portal/portal-notification-bell", () => ({ PortalNotificationBell: () => null }));

const user = { id: "qa-user", name: "QA", email: "qa@example.invalid", image: null };
afterEach(cleanup);
beforeEach(() => {
  (useTranslation as jest.Mock).mockReturnValue({ dict: tr, locale: "tr" });
  (signOut as jest.Mock).mockReset();
});

for (const [locale, dict] of [["tr", tr], ["en", en]] as const) {
  test(`authenticated portal navigation exposes inbox and logout in ${locale}`, () => {
    (useTranslation as jest.Mock).mockReturnValue({ dict, locale });
    const topbar = render(React.createElement(PortalTopbar, { user }));
    const header = within(screen.getByRole("banner"));
    expect(header.getByRole("link", { name: dict.nav.messages }).getAttribute("href")).toBe("/messages");
    expect(header.queryByRole("button", { name: dict.nav.logout })).toBeNull();
    expect(header.queryByRole("button", { name: "Language selector" })).toBeNull();
    expect(topbar.container.querySelector('a[href="/profile"]')).toBeNull();
    topbar.unmount();
    const sidebar = render(React.createElement(PortalSidebar, { user }));
    expect(screen.getByRole("link", { name: dict.nav.messages }).getAttribute("href")).toBe("/messages");
    expect(screen.getByRole("button", { name: dict.nav.logout })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Language selector" })).toBeTruthy();
    expect(sidebar.container.querySelector('a[href="/profile"]')).toBeTruthy();
    sidebar.unmount();
    render(React.createElement(PortalMobileDrawer, { user, isOpen: true, onClose: jest.fn() }));
    expect(screen.getByRole("link", { name: dict.nav.messages }).getAttribute("href")).toBe("/messages");
    expect(screen.getByRole("button", { name: dict.nav.logout })).toBeTruthy();
  });
}

test("logout uses auth endpoint navigation, blocks repeat clicks and reports network failure", async () => {
  let rejectLogout!: (error: Error) => void;
  (signOut as jest.Mock).mockReturnValue(new Promise((_resolve, reject) => { rejectLogout = reject; }));
  render(React.createElement(SignOutButton));
  const button = screen.getByRole("button", { name: tr.nav.logout }) as HTMLButtonElement;
  fireEvent.click(button);
  fireEvent.click(button);
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(signOut).toHaveBeenCalledWith({ redirectTo: "/" });
  expect(button.disabled).toBe(true);
  await act(async () => rejectLogout(new Error("offline")));
  expect(button.disabled).toBe(false);
  expect(toast.error).toHaveBeenCalledWith(tr.common.errorOccurred);
});

test("anonymous header does not expose account-only controls", () => {
  render(React.createElement(PortalTopbar));
  expect(screen.queryByRole("link", { name: tr.nav.messages })).toBeNull();
  expect(screen.queryByRole("button", { name: tr.nav.logout })).toBeNull();
});
