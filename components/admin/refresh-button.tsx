"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/i18n-context";
export function AdminRefreshButton() {
  const { dict } = useTranslation(),
    router = useRouter(),
    [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
      className="rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-40"
    >
      {pending ? dict.admin.loading : dict.admin.refresh}
    </button>
  );
}
