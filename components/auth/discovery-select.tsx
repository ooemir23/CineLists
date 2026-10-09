"use client";
import { useTranslation } from "@/lib/i18n/i18n-context";
// Keep the options in this tiny client component; crypto stays server-side.
const options = [
  "google",
  "instagram",
  "youtube",
  "tiktok",
  "x",
  "facebook",
  "friend",
  "other",
] as const;
export function DiscoverySelect({
  defaultValue = "",
  disabled = false,
}: {
  defaultValue?: string;
  disabled?: boolean;
}) {
  const { dict } = useTranslation(),
    t = dict.acquisition;
  return (
    <div className="space-y-2">
      <label
        htmlFor="discoveryAnswer"
        className="block text-xs font-semibold text-slate-300"
      >
        {t.question}
      </label>
      <select
        id="discoveryAnswer"
        name="discoveryAnswer"
        defaultValue={defaultValue}
        disabled={disabled}
        aria-describedby="discovery-hint"
        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"
      >
        <option value="">{t.optional}</option>
        {options.map((value) => (
          <option key={value} value={value}>
            {t.channels[value]}
          </option>
        ))}
      </select>
      <p id="discovery-hint" className="text-xs text-slate-400">
        {t.questionHint}
      </p>
    </div>
  );
}
