"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/i18n-context";
import {
  adminNumber,
  adminDuration,
  adminDate,
  interpolate,
} from "@/lib/admin/format";
import { DetailsDialog, useAdminDetails } from "./details-dialog";
export type DailyChartRow = { date: string; label: string; value: number };
type DayDetails = {
  formattedDate: string;
  totalViews: number;
  memberViews: number;
  guestViews: number;
  total: number;
  page: number;
  pages: number;
  paths: { path: string; label: string; views: number }[];
  countries: { country: string; label: string; views: number }[];
  users: {
    id: string;
    name: string | null;
    username: string;
    countryLabel: string;
    totalMinutes: number;
    lastSeenAt: string;
    viewsOnDate: number;
  }[];
};
export function DailyChart({ rows }: { rows: DailyChartRow[] }) {
  const { dict, locale } = useTranslation(),
    t = dict.admin;
  const [selected, setSelected] = useState<string | null>(null),
    [page, setPage] = useState(1);
  const details = useAdminDetails<DayDetails>(
    selected
      ? `/api/admin/daily-visitors?date=${selected}&page=${page}&locale=${locale}`
      : null,
  );
  const d = details.data,
    max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <>
      <p className="mb-3 text-xs text-slate-400">
        {t.peak}:{" "}
        {adminNumber(max === 1 && !rows.some((r) => r.value) ? 0 : max, locale)}{" "}
        {t.pageviewsDaily}
      </p>
      <div className="overflow-x-auto pb-3">
        <div className="flex h-48 min-w-max items-end gap-1">
          {rows.map((row) => (
            <button
              key={row.date}
              type="button"
              onClick={() => {
                setSelected(row.date);
                setPage(1);
              }}
              aria-label={`${row.label}: ${adminNumber(row.value, locale)} ${t.views}`}
              title={`${row.date}: ${row.value}`}
              className="flex h-full w-8 shrink-0 flex-col justify-end gap-2 rounded focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <span
                className="block w-full rounded-t bg-amber-400/75 hover:bg-amber-300"
                style={{ height: `${Math.max(3, (row.value / max) * 140)}px` }}
              />
              <span className="h-8 text-[9px] text-slate-400">{row.label}</span>
            </button>
          ))}
        </div>
      </div>
      {!rows.some((r) => r.value > 0) && (
        <p className="text-xs text-slate-500">{t.noMeasurements}</p>
      )}
      <DetailsDialog
        open={!!selected}
        title={d?.formattedDate || t.dailyDetails}
        onClose={() => setSelected(null)}
      >
        {details.loading ? (
          <p role="status">{t.loading}</p>
        ) : details.error ? (
          <div role="alert">
            <p>{details.error}</p>
            <button onClick={details.retry} className="mt-3 text-amber-300">
              {t.retry}
            </button>
          </div>
        ) : d ? (
          <div className="space-y-5">
            <p className="text-sm">
              {t.views}: {adminNumber(d.totalViews, locale)} · {t.member}:{" "}
              {adminNumber(d.memberViews, locale)} · {t.guest}:{" "}
              {adminNumber(d.guestViews, locale)}
            </p>
            <section>
              <h3 className="font-bold">{t.paths}</h3>
              {d.paths.map((p) => (
                <p
                  key={p.path}
                  className="mt-2 flex justify-between gap-3 text-sm"
                >
                  <span className="break-all">{p.label}</span>
                  <span>{adminNumber(p.views, locale)}</span>
                </p>
              ))}
            </section>
            <section>
              <h3 className="font-bold">{t.countries}</h3>
              {d.countries.map((c) => (
                <p key={c.country} className="mt-1 text-sm">
                  {c.label}: {adminNumber(c.views, locale)}
                </p>
              ))}
            </section>
            <section>
              <h3 className="font-bold">{t.recordedUsers}</h3>
              <p className="mt-1 text-xs text-slate-400">{t.dailyUsersHint}</p>
              <p className="mt-2 text-xs">
                {interpolate(t.showing, {
                  count: d.users.length,
                  total: d.total,
                })}
              </p>
              <div className="mt-3 space-y-3">
                {d.users.length ? (
                  d.users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/admin/users/${u.id}`}
                      className="block rounded-xl border border-white/10 p-3"
                    >
                      <p className="break-words">
                        {u.name || u.username} · @{u.username}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {u.countryLabel} · {t.views}:{" "}
                        {adminNumber(u.viewsOnDate, locale)} ·{" "}
                        {adminDuration(u.totalMinutes, locale, t)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {adminDate(u.lastSeenAt, locale, t.unknown)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p>{t.empty}</p>
                )}
              </div>
              {d.pages > 1 && (
                <div className="mt-4 flex justify-between">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((n) => n - 1)}
                    className="disabled:opacity-30"
                  >
                    {t.previous}
                  </button>
                  <span>
                    {d.page} / {d.pages}
                  </span>
                  <button
                    disabled={page >= d.pages}
                    onClick={() => setPage((n) => n + 1)}
                    className="disabled:opacity-30"
                  >
                    {t.next}
                  </button>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </DetailsDialog>
    </>
  );
}
