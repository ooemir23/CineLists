jest.mock("@/lib/onboarding-actions", () => ({ completeOnboarding: jest.fn(), skipOnboarding: jest.fn() }));
jest.mock("@/lib/i18n/i18n-context", () => ({ useTranslation: jest.fn() }));
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { en } from "@/lib/i18n/dictionaries/en";
import { tr } from "@/lib/i18n/dictionaries/tr";
import { mkdirSync, writeFileSync } from "node:fs";

for (const [locale, dict] of [["tr", tr], ["en", en]] as const) {
  test(`onboarding renders ${locale} labels, existing preferences and accessible selection state`, () => {
    (useTranslation as jest.Mock).mockReturnValue({ locale, dict });
    const html = renderToStaticMarkup(React.createElement(OnboardingForm, {
      genres: [{ id: 28, name: locale === "tr" ? "Aksiyon" : "Action" }, { id: 35, name: locale === "tr" ? "Komedi" : "Comedy" }],
      platforms: [{ id: "8", name: "Netflix", icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" }],
      defaultUsername: "filmsever", defaultGenres: ["28"], defaultPlatforms: ["8"],
    }));
    expect(html).toContain(dict.onboarding.title);
    expect(html).toContain(dict.onboarding.username);
    expect(html).toContain('for="onboarding-username"');
    expect(html).toContain('value="filmsever"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
    expect(html).toContain('name="genres" value="28"');
    expect(html).toContain('name="platforms" value="8"');
    if (process.env.CINELISTS_PREVIEW_DIR) {
      mkdirSync(process.env.CINELISTS_PREVIEW_DIR, { recursive: true });
      writeFileSync(`${process.env.CINELISTS_PREVIEW_DIR}/${locale}.html`, `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="style.css"></head><body style="background:#020617;margin:0;font-family:Arial,sans-serif"><main class="min-h-screen py-10 px-4 md:px-6">${html}</main></body></html>`);
    }
  });
}
