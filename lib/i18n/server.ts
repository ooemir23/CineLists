import { cookies } from "next/headers";
import { Locale, DEFAULT_LOCALE, Dictionary } from "./types";
import { tr } from "./dictionaries/tr";
import { en } from "./dictionaries/en";

const dictionaries: Record<Locale, Dictionary> = {
  tr,
  en,
};

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;
    if (localeCookie === "tr" || localeCookie === "en") {
      return localeCookie;
    }
  } catch {
    // If cookies() is called outside request scope
  }
  return DEFAULT_LOCALE;
}

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}
