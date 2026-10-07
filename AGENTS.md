# Language support

- Every new or changed user-facing feature must support both Turkish and English in the same change. This includes labels, placeholders, validation errors, tooltips, accessibility labels, empty states, notifications, and emails.
- Use the typed dictionaries in `lib/i18n/dictionaries/tr.ts` and `lib/i18n/dictionaries/en.ts`. Add matching, nonempty keys to both dictionaries and `lib/i18n/types.ts`; do not hardcode user-facing strings in one language.
- Client components use `useTranslation()`. Server components and actions use `getServerLocale()` and `getDictionary()`. Request handlers can use `resolveLocale(request.headers, request.cookies)`.
- An explicit `NEXT_LOCALE` choice takes priority. Without a choice, Turkey defaults to Turkish and other detected countries default to English. Keep UI, TMDB content, dates, numbers, and emails consistent with that locale.
- Verify both languages and responsive layouts for changed screens. Run the locale/dictionary tests and follow the build and performance requirements in `AI_INSTRUCTIONS.md`.
