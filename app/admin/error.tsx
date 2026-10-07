"use client";
import { useTranslation } from "@/lib/i18n/i18n-context";
export default function AdminError({ reset }: { reset: () => void }) {
  const { dict } = useTranslation(),
    t = dict.admin;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-6"
    >
      <h2 className="text-xl font-bold">{t.errorTitle}</h2>
      <p className="mt-3 text-sm text-slate-400">{t.errorHint}</p>
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950"
      >
        {t.retry}
      </button>
    </div>
  );
}
