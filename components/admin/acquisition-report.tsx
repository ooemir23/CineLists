import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin/access";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import { acquisitionLabel } from "@/lib/acquisition-format";
import { adminNumber, interpolate } from "@/lib/admin/format";
import { dateWindow } from "@/lib/admin/policy";
import { Panel, Empty } from "@/components/admin/ui";
export async function AcquisitionReport({ days }: { days?: string }) {
  await requireAdmin();
  const locale = await getServerLocale(),
    dict = getDictionary(locale),
    t = dict.acquisition;
  const since = days === "all" ? null : dateWindow(days).since;
  const where = since ? { registeredAt: { gte: since } } : {};
  const [sources, answers, campaigns, mediums, referrers, total] =
    await Promise.all([
      prisma.userAdminProfile.groupBy({
        by: ["acquisitionSource"],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 50,
      }),
      prisma.userAdminProfile.groupBy({
        by: ["discoveryAnswer"],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 12,
      }),
      prisma.userAdminProfile.groupBy({
        by: ["acquisitionCampaign"],
        where: { ...where, acquisitionCampaign: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 15,
      }),
      prisma.userAdminProfile.groupBy({
        by: ["acquisitionMedium"],
        where: { ...where, acquisitionMedium: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 15,
      }),
      prisma.userAdminProfile.groupBy({
        by: ["referrerHost"],
        where: { ...where, referrerHost: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: "desc" } },
        take: 15,
      }),
      prisma.user.count({
        where: since ? { adminProfile: { registeredAt: { gte: since } } } : {},
      }),
    ]);
  const withoutProfile = since
    ? 0
    : await prisma.user.count({ where: { adminProfile: null } });
  const sourceRows = sources.map((row) => ({
    value: row.acquisitionSource,
    count: row._count.userId,
  }));
  const answerRows = answers.map((row) => ({
    value: row.discoveryAnswer,
    count: row._count.userId,
  }));
  for (const rows of [sourceRows, answerRows])
    if (withoutProfile) {
      const unknown = rows.find((row) => row.value === null);
      if (unknown) unknown.count += withoutProfile;
      else rows.push({ value: null, count: withoutProfile });
    }
  const n = (value: number) => adminNumber(value, locale);
  const pct = (count: number) =>
    new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(total ? count / total : 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t.summary}</h2>
        <div className="flex flex-wrap gap-2">
          {["7", "30", "90", "all"].map((value) => (
            <Link
              key={value}
              href={`/admin?tab=sources&days=${value}`}
              aria-current={(days || "30") === value ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-xs ${(days || "30") === value ? "bg-white/10" : "text-slate-400"}`}
            >
              {value === "all"
                ? t.allTime
                : interpolate(dict.admin.lastDays, { days: value })}
            </Link>
          ))}
        </div>
      </div>
      <p className="text-sm text-slate-400">{t.hint}</p>
      <p className="text-xs text-slate-500">{t.historyHint}</p>
      {sources.length === 50 && (
        <p className="text-xs text-slate-500">{t.limitHint}</p>
      )}
      <p className="text-sm font-semibold">
        {dict.admin.registeredUsers}: {n(total)}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {[
          { title: t.automatic, rows: sourceRows, param: "source" as const },
          { title: t.survey, rows: answerRows, param: "answer" as const },
        ].map((section) => (
          <Panel key={section.title} title={section.title}>
            {section.rows.length ? (
              <ul className="space-y-3">
                {section.rows
                  .sort((a, b) => b.count - a.count)
                  .map((row) => (
                    <li
                      key={row.value || "unknown"}
                      className="flex items-start justify-between gap-3 border-b border-white/5 py-2 text-sm"
                    >
                      <span className="min-w-0 break-words">
                        <Link
                          className="text-amber-300 hover:underline"
                          href={`/admin?tab=users&${section.param}=${encodeURIComponent(row.value || "unknown")}${since ? `&metric=new-users&days=${days || "30"}` : ""}`}
                        >
                          {acquisitionLabel(row.value, t)}
                        </Link>
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {n(row.count)} · {pct(row.count)}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <Empty />
            )}
          </Panel>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: dict.admin.referrers,
            rows: referrers.map((r) => ({
              label: r.referrerHost || t.unknown,
              count: r._count.userId,
            })),
          },
          {
            title: dict.admin.campaigns,
            rows: campaigns.map((r) => ({
              label: r.acquisitionCampaign || t.unknown,
              count: r._count.userId,
            })),
          },
          {
            title: dict.admin.mediums,
            rows: mediums.map((r) => ({
              label: r.acquisitionMedium || t.unknown,
              count: r._count.userId,
            })),
          },
        ].map((section) => (
          <Panel key={section.title} title={section.title}>
            {section.rows.length ? (
              <ul className="space-y-3">
                {section.rows.map((row) => (
                  <li
                    key={row.label}
                    className="flex items-start justify-between gap-3 border-b border-white/5 py-2 text-sm"
                  >
                    <span className="min-w-0 break-all">{row.label}</span>
                    <span className="shrink-0 text-slate-400">
                      {n(row.count)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty />
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
