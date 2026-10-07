"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { adminDuration, adminNumber, interpolate } from "@/lib/admin/format";
import { DetailsDialog, useAdminDetails } from "./details-dialog";
type MetricData = {
  users: number;
  suspended: number;
  onlineCount: number;
  active: number;
  newUsers: number;
  views: number;
  totalMinutes: number;
};
type Detail = {
  title: string;
  subtitle: string;
  type: "users" | "views-breakdown";
  dateLabel?: string;
  total?: number;
  page?: number;
  pages?: number;
  directoryHref?: string;
  items?: {
    id: string;
    username: string;
    name: string | null;
    email: string | null;
    isSuspended: boolean;
    countryLabel: string;
    formattedDate: string;
  }[];
  paths?: { path: string; label: string; views: number }[];
  devices?: { device: string; views: number }[];
  audience?: { audience: string; views: number }[];
};
export function MetricCards({
  days,
  data,
}: {
  days: number;
  data: MetricData;
}) {
  const { dict, locale } = useTranslation(),
    t = dict.admin;
  const [type, setType] = useState<string | null>(null),
    [page, setPage] = useState(1);
  const details = useAdminDetails<Detail>(
    type
      ? `/api/admin/metric-details?type=${type}&days=${days}&page=${page}&locale=${locale}`
      : null,
  );
  const rows = [
    {
      type: "users",
      label: t.registeredUsers,
      value: adminNumber(data.users, locale),
      note: interpolate(t.suspendedNote, {
        count: adminNumber(data.suspended, locale),
      }),
    },
    {
      type: "online",
      label: t.online,
      value: adminNumber(data.onlineCount, locale),
      note: t.onlineHint,
    },
    {
      type: "active",
      label: t.activeMembers,
      value: adminNumber(data.active, locale),
      note: interpolate(t.lastDays, { days }),
    },
    {
      type: "new-users",
      label: t.newUsers,
      value: adminNumber(data.newUsers, locale),
      note: interpolate(t.lastDays, { days }),
    },
    {
      type: "views",
      label: t.views,
      value: adminNumber(data.views, locale),
      note: interpolate(t.lastDays, { days }),
    },
    {
      type: "duration",
      label: t.duration,
      value: adminDuration(data.totalMinutes, locale, t),
      note: t.allTime,
    },
  ];
  const d = details.data;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {rows.map((row) => (
          <button
            key={row.type}
            type="button"
            onClick={() => {
              setType(row.type);
              setPage(1);
            }}
            className="min-w-0 rounded-2xl border border-white/10 bg-slate-900 p-4 text-left hover:border-amber-400/50 focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <span className="text-sm text-slate-400">{row.label}</span>
            <strong className="mt-4 block break-words text-2xl">
              {row.value}
            </strong>
            <span className="mt-2 block text-xs text-slate-500">
              {row.note}
            </span>
            <span className="mt-2 block text-xs text-amber-300">
              {t.details} ↗
            </span>
          </button>
        ))}
      </div>
      <DetailsDialog
        open={!!type}
        title={d?.title || t.details}
        onClose={() => setType(null)}
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
          <>
            <p className="mb-5 text-sm text-slate-400">{d.subtitle}</p>
            {d.type === "users" ? (
              <>
                {d.directoryHref && (
                  <Link
                    href={d.directoryHref}
                    className="text-sm text-amber-300"
                  >
                    {t.fullDirectory} ↗
                  </Link>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {interpolate(t.showing, {
                    count: d.items?.length || 0,
                    total: d.total || 0,
                  })}
                </p>
                <div className="mt-4 space-y-3">
                  {d.items?.length ? (
                    d.items.map((u) => (
                      <Link
                        key={u.id}
                        href={`/admin/users/${u.id}`}
                        className="block min-w-0 rounded-xl border border-white/10 p-3 hover:border-amber-400/30"
                      >
                        <p className="break-words font-semibold">
                          {u.name || u.username}{" "}
                          <span className="text-xs text-amber-300">
                            @{u.username}
                          </span>
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-400">
                          {u.email}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">
                          {u.countryLabel} ·{" "}
                          {u.isSuspended ? t.suspended : t.active}
                        </p>
                        <p className="mt-1 text-xs">
                          {d.dateLabel}: {u.formattedDate}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p>{t.empty}</p>
                  )}
                </div>
                {(d.pages || 1) > 1 && (
                  <div className="mt-4 flex justify-between gap-3">
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
                      disabled={page >= (d.pages || 1)}
                      onClick={() => setPage((n) => n + 1)}
                      className="disabled:opacity-30"
                    >
                      {t.next}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-5">
                <section>
                  <h3 className="font-bold">{t.paths}</h3>
                  {d.paths?.map((p) => (
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
                  <h3 className="font-bold">{t.devices}</h3>
                  {d.devices?.map((r) => (
                    <p key={r.device} className="mt-2 text-sm">
                      {(
                        {
                          desktop: t.desktop,
                          mobile: t.mobile,
                          tablet: t.tablet,
                        } as Record<string, string>
                      )[r.device] || r.device}
                      : {adminNumber(r.views, locale)}
                    </p>
                  ))}
                </section>
                <section>
                  <h3 className="font-bold">{t.audience}</h3>
                  {d.audience?.map((r) => (
                    <p key={r.audience} className="mt-2 text-sm">
                      {r.audience === "member" ? t.member : t.guest}:{" "}
                      {adminNumber(r.views, locale)}
                    </p>
                  ))}
                </section>
              </div>
            )}
          </>
        ) : null}
      </DetailsDialog>
    </>
  );
}
