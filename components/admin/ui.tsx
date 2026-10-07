import Link from "next/link";
import type { ReactNode } from "react";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { adminNumber, adminDate } from "@/lib/admin/format";
export const fieldClass =
  "w-full min-w-0 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400";
export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {subtitle}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
export async function Empty({ children }: { children?: ReactNode }) {
  const t = getDictionary(await getServerLocale()).admin;
  return (
    <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
      {children || t.empty}
    </p>
  );
}
export async function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: number | string;
  note: string;
  icon: ReactNode;
}) {
  const locale = await getServerLocale();
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex justify-between gap-2 text-sm text-slate-400">
        {label}
        {icon}
      </div>
      <p className="mt-4 break-words text-2xl font-black">
        {typeof value === "number" ? adminNumber(value, locale) : value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  );
}
export async function Bars({
  rows,
}: {
  rows: { label: string; value: number }[];
}) {
  const locale = await getServerLocale();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return rows.length ? (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="truncate" title={r.label}>
              {r.label}
            </span>
            <span>{adminNumber(r.value, locale)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-amber-400/80"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Empty />
  );
}
export async function Pager({
  page,
  pages,
  params,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}) {
  const locale = await getServerLocale(),
    t = getDictionary(locale).admin;
  const href = (n: number) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && k !== "page") qs.set(k, v);
    });
    qs.set("page", String(n));
    return "/admin?" + qs;
  };
  return (
    <nav
      aria-label={t.pagination}
      className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="rounded-xl border border-white/10 px-3 py-2"
        >
          ← {t.previous}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-slate-400">
        {adminNumber(page, locale)} / {adminNumber(pages, locale)}
      </span>
      {page < pages ? (
        <Link
          href={href(page + 1)}
          className="rounded-xl border border-white/10 px-3 py-2"
        >
          {t.next} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
// Legacy helper exports kept for consumers outside the rewritten screens.
export const number = (value: number) => adminNumber(value, "tr");
export const date = (value: Date | null | undefined) =>
  adminDate(value, "tr", "—");
