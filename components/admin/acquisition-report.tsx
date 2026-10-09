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
  const [sources, answers, total] = await Promise.all([
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
          { title: t.automatic, rows: sourceRows, links: true },
          { title: t.survey, rows: answerRows, links: false },
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
                        {section.links ? (
                          <Link
                            className="text-amber-300"
                            href={`/admin?tab=users&source=${encodeURIComponent(row.value || "unknown")}${since ? `&metric=new-users&days=${days || "30"}` : ""}`}
                          >
                            {acquisitionLabel(row.value, t)}
                          </Link>
                        ) : (
                          acquisitionLabel(row.value, t)
                        )}
                      </span>
                      <span className="shrink-0 text-slate-400">
                        {n(row.count)} ·{" "}
                        {new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", { style: "percent", maximumFractionDigits: 0 }).format(total ? row.count / total : 0)}
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
