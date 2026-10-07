import { detectUserCountry } from "@/lib/country";
import type { Locale } from "./types";

/** An explicit language choice wins; otherwise Turkey uses Turkish. */
export function resolveLocale(
  headers: Headers,
  cookies: { get: (name: string) => { value: string } | undefined } = {
    get: name => {
      const value = headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1);
      return value ? { value } : undefined;
    },
  },
): Locale {
  const preference = cookies.get("NEXT_LOCALE")?.value;
  if (preference === "tr" || preference === "en") return preference;
  return detectUserCountry(headers, cookies) === "TR" ? "tr" : "en";
}
