import Link from "next/link";
import type { ReactNode } from "react";

export const fieldClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400";
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
      <h2 className="font-bricolage text-lg font-bold text-white">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          {subtitle}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}
export function Empty({
  children = "Henüz kayıt yok.",
}: {
  children?: ReactNode;
}) {
  return (
    <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
export const number = (value: number) => value.toLocaleString("tr-TR");
export const date = (value: Date | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Istanbul",
      }).format(value)
    : "Bilinmiyor";

export function Metric({
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
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
        {label}
        <span className="text-amber-400">{icon}</span>
      </div>
      <p className="mt-4 font-bricolage text-3xl font-black tracking-tight text-white">
        {typeof value === "number" ? number(value) : value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{note}</p>
    </div>
  );
}

export function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return rows.length ? (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1.5 flex justify-between gap-4 text-sm">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="font-mono text-white">{number(row.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-amber-400/80"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <Empty />
  );
}

export function Pager({
  page,
  pages,
  params,
}: {
  page: number;
  pages: number;
  params: Record<string, string | undefined>;
}) {
  const href = (next: number) => {
    const values = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && key !== "page") values.set(key, value);
    });
    values.set("page", String(next));
    return `/admin?${values}`;
  };
  return (
    <nav
      aria-label="Sayfalama"
      className="mt-5 flex items-center justify-between text-sm"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/5"
        >
          ← Önceki
        </Link>
      ) : (
        <span />
      )}
      <span className="text-slate-500">
        {page} / {pages}
      </span>
      {page < pages ? (
        <Link
          href={href(page + 1)}
          className="rounded-xl border border-white/10 px-4 py-2 hover:bg-white/5"
        >
          Sonraki →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function DailyChart({
  rows,
}: {
  rows: { label: string; value: number }[];
}) {
  if (!rows.some((row) => row.value > 0))
    return <Empty>Seçili dönemde ölçüm bulunmuyor.</Empty>;
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div>
      <div
        className="flex h-40 items-end gap-1"
        role="img"
        aria-label={`Günlük sayfa görüntülemeleri. Toplam ${number(rows.reduce((sum, row) => sum + row.value, 0))}.`}
      >
        {rows.map((row) => (
          <div
            key={row.label}
            className="group relative flex h-full min-w-0 flex-1 items-end"
            title={`${row.label}: ${number(row.value)}`}
          >
            <div
              className="w-full rounded-t bg-gradient-to-t from-amber-600/70 to-amber-300"
              style={{
                height: row.value
                  ? `${Math.max(2, (row.value / max) * 100)}%`
                  : "1px",
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>{rows[0]?.label}</span>
        <span>{rows.at(-1)?.label}</span>
      </div>
      <details className="mt-4 text-xs text-slate-400">
        <summary className="cursor-pointer">Günlük değerleri göster</summary>
        <div className="mt-3 grid max-h-48 grid-cols-2 gap-2 overflow-auto">
          {rows.map((row) => (
            <p key={row.label}>
              {row.label}:{" "}
              <span className="text-white">{number(row.value)}</span>
            </p>
          ))}
        </div>
      </details>
    </div>
  );
}
