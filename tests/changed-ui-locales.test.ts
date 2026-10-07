jest.mock("@/lib/i18n/i18n-context", () => ({ useTranslation: jest.fn() }));
jest.mock("@/lib/profile-actions", () => ({
  updateProfile: jest.fn(),
  updatePrivacySettings: jest.fn(),
  deleteAccount: jest.fn(),
  suspendAccount: jest.fn(),
  checkUsernameAvailability: jest.fn(),
  updateUserPreferences: jest.fn(),
}));
jest.mock("@/lib/auth-actions", () => ({ handleSignOut: jest.fn() }));
jest.mock("@/lib/favorite-media-actions", () => ({
  toggleFavoriteMedia: jest.fn(),
}));
jest.mock("@/lib/message-actions", () => ({
  getMessages: jest.fn(),
  markMessagesAsRead: jest.fn(),
}));
jest.mock("@/lib/notification-actions", () => ({
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { SettingsContent } from "@/components/profile/settings-content";
import { ManageFavoritesModal } from "@/components/profile/manage-favorites-modal";
import { ChatHistory } from "@/components/messages/chat-history";
import { PortalNotificationBell } from "@/components/portal/portal-notification-bell";
import { tr } from "@/lib/i18n/dictionaries/tr";
import { en } from "@/lib/i18n/dictionaries/en";
import { mkdirSync, writeFileSync } from "node:fs";

function preview(name: string, locale: string, html: string) {
  if (!process.env.CINELISTS_PREVIEW_DIR) return;
  mkdirSync(process.env.CINELISTS_PREVIEW_DIR, { recursive: true });
  writeFileSync(
    `${process.env.CINELISTS_PREVIEW_DIR}/${name}-${locale}.html`,
    `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="style.css"></head><body style="margin:0;background:#020617;color:white;font-family:Arial,sans-serif"><main style="max-width:1000px;margin:auto;padding:16px">${html}</main></body></html>`,
  );
}
for (const [locale, dict] of [
  ["tr", tr],
  ["en", en],
] as const) {
  test(`changed settings, favorites, messages and notification controls support ${locale}`, () => {
    (useTranslation as jest.Mock).mockReturnValue({
      locale,
      dict,
      setLocale: jest.fn(),
      t: (key: string) =>
        key
          .split(".")
          .reduce(
            (value: unknown, segment) =>
              (value as Record<string, unknown>)[segment],
            dict,
          ),
    });
    const user = {
      id: "test-user",
      name: "Film fan",
      username: "film_fan",
      email: null,
      image: null,
      bio: "",
      isPrivate: false,
      showActivities: true,
      showStats: true,
      favoriteGenres: ["28"],
      platforms: [],
      allGenres: [{ id: 28, name: locale === "tr" ? "Aksiyon" : "Action" }],
      allPlatforms: [],
    };
    for (const tab of [
      "general",
      "privacy",
      "preferences",
      "account",
    ] as const) {
      const html = renderToStaticMarkup(
        React.createElement(SettingsContent, { user, activeTab: tab }),
      );
      expect(html).not.toContain("3 ay");
      if (tab === "general") expect(html).toContain(dict.reviewUi.displayName);
      if (tab === "privacy") expect(html).toContain('role="switch"');
      preview(`settings-${tab}`, locale, html);
    }
    const favorites = renderToStaticMarkup(
      React.createElement(ManageFavoritesModal, {
        isOpen: true,
        onClose: jest.fn(),
        currentFavoriteIds: ["movie:42", "tv:42"],
      }),
    );
    expect(favorites).toContain(dict.reviewUi.manageFavorites);
    expect(favorites).toContain(dict.reviewUi.favoritesPlaceholder);
    expect(favorites).toContain(dict.common.close);
    preview("favorites", locale, favorites);
    const chat = renderToStaticMarkup(
      React.createElement(ChatHistory, {
        initial: [],
        partnerId: "other",
        userId: "self",
      }),
    );
    expect(chat).toContain(dict.reviewUi.startChat);
    preview("chat", locale, chat);
    const bell = renderToStaticMarkup(
      React.createElement(PortalNotificationBell),
    );
    expect(bell).toContain(`aria-label="${dict.reviewUi.notifications}"`);
  });
}
