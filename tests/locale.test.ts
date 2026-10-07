import { resolveLocale } from "@/lib/i18n/resolve-locale";
import { tr } from "@/lib/i18n/dictionaries/tr";
import { en } from "@/lib/i18n/dictionaries/en";

const cookieStore = (values: Record<string, string> = {}) => ({
  get: (name: string) => values[name] ? { value: values[name] } : undefined,
});

test.each(["TR", "tr"])("Turkey (%s) defaults to Turkish", country => {
  expect(resolveLocale(new Headers({ "cf-ip-country": country }), cookieStore())).toBe("tr");
});
test.each(["US", "DE", "GB", "FR", "AZ", "JP", "SA"])("%s defaults to English", country => {
  expect(resolveLocale(new Headers({ "cf-ip-country": country }), cookieStore())).toBe("en");
});
test.each([["US", "tr"], ["TR", "en"]])("explicit choice overrides %s country", (country, locale) => {
  expect(resolveLocale(new Headers({ "cf-ip-country": country }), cookieStore({ NEXT_LOCALE: locale }))).toBe(locale);
});
test("saved country and browser-region fallback also select English", () => {
  expect(resolveLocale(new Headers(), cookieStore({ NEXT_COUNTRY: "DE" }))).toBe("en");
  expect(resolveLocale(new Headers({ "accept-language": "fr-FR,fr;q=0.9" }), cookieStore())).toBe("en");
});
test("invalid language choice does not override country", () => {
  expect(resolveLocale(new Headers({ "cf-ip-country": "US" }), cookieStore({ NEXT_LOCALE: "de" }))).toBe("en");
});

function stringEntries(value: object, prefix = ""): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof item === "string" ? [[path, item]] : Object.entries(stringEntries(item, path));
  }));
}
test("every dictionary key has a nonempty translation in both languages", () => {
  const turkish = stringEntries(tr);
  const english = stringEntries(en);
  expect(Object.keys(english).sort()).toEqual(Object.keys(turkish).sort());
  for (const [key, value] of Object.entries(turkish)) {
    expect(value.trim()).not.toBe("");
    expect(english[key].trim()).not.toBe("");
    expect(english[key].match(/\{\w+\}/g) || []).toEqual(value.match(/\{\w+\}/g) || []);
  }
});
