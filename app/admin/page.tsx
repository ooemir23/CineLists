import Link from "next/link";
import { getAdmin } from "@/lib/admin/access";
import {
  getOverview,
  getUsers,
  getModeration,
  getAudit,
  type UserFilters,
} from "@/lib/admin/data";
import { dateWindow } from "@/lib/admin/policy";
import { countryLabel } from "@/lib/admin/analytics";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import {
  adminNumber,
  adminDate,
  adminDuration,
  adminActionLabel,
  adminPathLabel,
  onlineAt,
  interpolate,
  REMOVED_COMMENTS,
} from "@/lib/admin/format";
import { Panel, Bars, Empty, Pager, fieldClass } from "@/components/admin/ui";
import { DailyChart } from "@/components/admin/daily-chart";
import { MetricCards } from "@/components/admin/metric-cards";
import { AdminActionButton } from "@/components/admin/action-button";
import { prisma } from "@/lib/prisma";
type Params = UserFilters & { tab?: string };
async function context() {
  const locale = await getServerLocale(),
    t = getDictionary(locale).admin;
  return {
    locale,
    t,
    n: (v: number) => adminNumber(v, locale),
    d: (v: Date | null | undefined) => adminDate(v, locale, t.unknown),
    country: (v: string | null | undefined) =>
      countryLabel(v, locale, t.unknown),
  };
}
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await getAdmin())) return null;
  const { t } = await context(),
    raw = await searchParams,
    params: Params = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    );
  const tabs = [
      { key: "overview", label: t.overview },
      { key: "users", label: t.users },
      { key: "content", label: t.content },
      { key: "audit", label: t.audit },
      { key: "system", label: t.system },
    ],
    tab = tabs.some((item) => item.key === params.tab)
      ? params.tab
      : "overview",
    { days, since } = dateWindow(params.days);
  return (
    <>
      <nav
        aria-label={t.sections}
        className="mb-7 flex gap-2 overflow-x-auto border-b border-white/10 pb-4"
      >
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/admin?tab=${item.key}&days=${days}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === item.key ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:bg-white/5"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "overview" ? (
        <Overview days={days} since={since} />
      ) : tab === "users" ? (
        <UsersTab params={params} />
      ) : tab === "content" ? (
        <Moderation params={params} />
      ) : tab === "audit" ? (
        <Audit params={params} />
      ) : (
        <System />
      )}
    </>
  );
}
async function Overview({ days, since }: { days: number; since: Date }) {
  const { t, locale, n, d, country } = await context(),
    data = await getOverview(since);
  const rows = Array.from({ length: days }, (_, i) => {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    return {
      date,
      label: new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(day),
      value:
        data.daily.find((r) => r.day.toISOString().slice(0, 10) === date)?._sum
          .views || 0,
    };
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-lg font-bold">{t.summary}</h2>
        <div className="flex gap-1">
          {[7, 30, 90].map((value) => (
            <Link
              key={value}
              href={`/admin?tab=overview&days=${value}`}
              aria-current={days === value ? "true" : undefined}
              className={`rounded-lg px-3 py-2 text-xs ${days === value ? "bg-white/10" : "text-slate-500"}`}
            >
              {interpolate(t.lastDays, { days: value })}
            </Link>
          ))}
        </div>
      </div>
      <MetricCards days={days} data={data} />
      {process.env.ANALYTICS_ENABLED !== "true" && (
        <p
          role="status"
          className="rounded-xl border border-amber-400/20 p-4 text-sm text-amber-200"
        >
          {t.analyticsOff}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel title={t.traffic} subtitle={t.trafficHint}>
          <DailyChart rows={rows} />
        </Panel>
        <Panel title={t.countries} subtitle={t.countriesHint}>
          <Bars
            rows={data.countries.map((r) => ({
              label: country(r.country),
              value: r._sum.views || 0,
            }))}
          />
        </Panel>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Panel title={t.devices}>
          <Bars
            rows={[
              { key: "desktop", label: t.desktop },
              { key: "mobile", label: t.mobile },
              { key: "tablet", label: t.tablet },
            ].map((r) => ({
              label: r.label,
              value:
                data.devices.find((v) => v.device === r.key)?._sum.views || 0,
            }))}
          />
        </Panel>
        <Panel title={t.audience}>
          <Bars
            rows={[
              {
                label: t.member,
                value:
                  data.audience.find((r) => r.audience === "member")?._sum
                    .views || 0,
              },
              {
                label: t.guest,
                value:
                  data.audience.find((r) => r.audience === "guest")?._sum
                    .views || 0,
              },
            ]}
          />
        </Panel>
        <Panel title={t.memberCountries} subtitle={t.countriesHint}>
          <Bars
            rows={data.memberCountries.map((r) => ({
              label: country(r.country),
              value: r._count.userId,
            }))}
          />
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.paths}>
          <Bars
            rows={data.paths.map((r) => ({
              label: adminPathLabel(r.path, t),
              value: r._sum.views || 0,
            }))}
          />
        </Panel>
        <Panel title={t.library} subtitle={t.messagesHint}>
          <dl className="space-y-3 text-sm">
            {[
              [t.media, data.media],
              [t.watched, data.watched],
              [t.episodes, data.episodes],
              [t.comments, data.comments],
              [t.messages, data.messages],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-slate-400">{label}</dt>
                <dd>{n(Number(value))}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel title={t.popular}>
          <Bars
            rows={data.popular.map((r) => ({
              label: r.title,
              value: r._count.watchedBy,
            }))}
          />
        </Panel>
        <Panel title={t.registrationDays} subtitle={t.registrationHint}>
          <Bars
            rows={data.registrations
              .slice(-10)
              .map((r) => ({ label: d(r.day), value: Number(r.count) }))}
          />
        </Panel>
      </div>
    </div>
  );
}
async function UsersTab({ params }: { params: Params }) {
  const { t, locale, n, d, country } = await context(),
    data = await getUsers(params);
  const exports = new URLSearchParams();
  for (const k of ["q", "status", "country", "metric", "days"] as const)
    if (params[k]) exports.set(k, params[k]!);
  return (
    <Panel
      title={t.userDirectory}
      subtitle={interpolate(t.countRecords, { count: n(data.total) })}
    >
      <form
        action="/admin"
        className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <input type="hidden" name="tab" value="users" />
        {params.metric && (
          <input type="hidden" name="metric" value={params.metric} />
        )}
        <input type="hidden" name="days" value={params.days || "30"} />
        <label className="text-xs text-slate-400">
          {t.search}
          <input
            name="q"
            defaultValue={params.q}
            placeholder={t.userSearchHint}
            maxLength={100}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="text-xs text-slate-400">
          {t.status}
          <select
            name="status"
            defaultValue={params.status || ""}
            className={`${fieldClass} mt-2`}
          >
            <option value="">{t.all}</option>
            <option value="active">{t.active}</option>
            <option value="suspended">{t.suspended}</option>
            <option value="onboarding">{t.onboarding}</option>
            <option value="admin">{t.admin}</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          {t.country}
          <select
            name="country"
            defaultValue={params.country || ""}
            className={`${fieldClass} mt-2`}
          >
            <option value="">{t.all}</option>
            <option value="ZZ">{t.unknown}</option>
            {data.countries.map((r) => (
              <option key={r.country} value={r.country!}>
                {country(r.country)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          {t.sort}
          <select
            name="sort"
            defaultValue={params.sort || "name"}
            className={`${fieldClass} mt-2`}
          >
            <option value="name">{t.username}</option>
            <option value="recent">{t.lastSeen}</option>
            <option value="time">{t.duration}</option>
            <option value="registered">{t.registeredAt}</option>
          </select>
        </label>
        <button className="self-end rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950">
          {t.filter}
        </button>
      </form>
      <div className="mb-4 flex flex-wrap justify-between gap-3 text-xs">
        <Link href="/admin?tab=users" className="text-slate-400">
          {t.clearFilters}
        </Link>
        <a href={`/api/admin/export?${exports}`} className="text-amber-300">
          {t.export} ↓
        </a>
      </div>
      <p className="mb-4 text-xs text-slate-500">{t.exportHint}</p>
      {data.users.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-slate-500">
              <tr>
                {[
                  t.users,
                  t.lastSeen,
                  t.duration,
                  t.country,
                  t.status,
                  t.registeredAt,
                  t.watched + " / " + t.episodes,
                  t.details,
                ].map((label) => (
                  <th key={label} className="px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="max-w-64 px-3 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="block truncate font-bold"
                      title={user.email || user.username}
                    >
                      {user.name || user.username}
                    </Link>
                    <p className="mt-1 truncate text-xs text-amber-300">
                      @{user.username}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {user.email}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-xs">
                    {onlineAt(
                      user.adminProfile?.lastSeenAt,
                      user.isSuspended,
                    ) ? (
                      <span className="text-emerald-400">{t.online}</span>
                    ) : (
                      d(user.adminProfile?.lastSeenAt)
                    )}
                  </td>
                  <td className="px-3 py-4 text-xs">
                    {adminDuration(
                      user.adminProfile?.totalMinutes || 0,
                      locale,
                      t,
                    )}
                  </td>
                  <td className="px-3 py-4 text-xs">
                    {country(user.adminProfile?.country)}
                  </td>
                  <td className="px-3 py-4 text-xs">
                    <span
                      className={
                        user.isSuspended ? "text-rose-300" : "text-emerald-300"
                      }
                    >
                      {user.isSuspended ? t.suspended : t.active}
                    </span>
                    {!user.hasCompletedOnboarding && (
                      <p className="mt-2 text-slate-500">{t.onboarding}</p>
                    )}
                  </td>
                  <td className="px-3 py-4 text-xs">
                    {d(user.adminProfile?.registeredAt)}
                  </td>
                  <td className="px-3 py-4">
                    {n(user._count.watched)} / {n(user._count.watchedEpisodes)}
                  </td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs text-amber-300"
                    >
                      {t.inspect} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>{t.noMatch}</Empty>
      )}
      <Pager
        page={data.page}
        pages={data.pages}
        params={{ ...params, tab: "users" }}
      />
    </Panel>
  );
}
async function Moderation({ params }: { params: Params }) {
  const { t, d, n } = await context(),
    data = await getModeration(params);
  return (
    <Panel title={t.content} subtitle={t.moderationHint}>
      <form
        action="/admin"
        className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"
      >
        <input type="hidden" name="tab" value="content" />
        <label className="text-xs text-slate-400">
          {t.search}
          <input
            name="q"
            defaultValue={params.q}
            placeholder={t.moderationSearchHint}
            maxLength={100}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="text-xs text-slate-400">
          {t.kind}
          <select
            name="kind"
            defaultValue={data.kind}
            className={`${fieldClass} mt-2`}
          >
            <option value="comments">{t.comments}</option>
            <option value="reviews">{t.reviews}</option>
          </select>
        </label>
        {data.kind === "comments" ? (
          <label className="text-xs text-slate-400">
            {t.status}
            <select
              name="status"
              defaultValue={params.status || "visible"}
              className={`${fieldClass} mt-2`}
            >
              <option value="visible">{t.visible}</option>
              <option value="removed">{t.removed}</option>
              <option value="all">{t.all}</option>
            </select>
          </label>
        ) : (
          <span />
        )}
        <button className="self-end rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">
          {t.filter}
        </button>
      </form>
      <p className="mb-4 text-xs text-slate-400">
        {interpolate(t.countRecords, { count: n(data.total) })}
      </p>
      <div className="space-y-4">
        {data.comments.map((c) => (
          <article key={c.id} className="rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap justify-between gap-2 text-xs">
              <Link
                href={`/admin/users/${c.user.id}`}
                className="text-amber-300"
              >
                @{c.user.username}
              </Link>
              <time>{d(c.createdAt)}</time>
            </div>
            <p className="my-3 max-h-40 overflow-auto whitespace-pre-wrap break-words text-sm">
              {REMOVED_COMMENTS.includes(c.content)
                ? t.removedComment
                : c.content}
            </p>
            <div className="flex flex-wrap justify-between gap-3">
              <span className="text-xs text-slate-500">
                {c.isSpoiler ? t.spoiler : t.comment}
              </span>
              {!REMOVED_COMMENTS.includes(c.content) && (
                <AdminActionButton
                  action="redact-comment"
                  targetId={c.id}
                  label={t.redactComment}
                  description={t.redactHint}
                />
              )}
            </div>
          </article>
        ))}
        {data.reviews.map((r) => (
          <article key={r.id} className="rounded-xl border border-white/10 p-4">
            <p className="text-sm font-bold">{r.media.title}</p>
            <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs">
              <Link
                href={`/admin/users/${r.user.id}`}
                className="text-amber-300"
              >
                @{r.user.username}
              </Link>
              <time>{d(r.createdAt)}</time>
            </div>
            <p className="my-3 max-h-40 overflow-auto whitespace-pre-wrap break-words text-sm">
              {r.review}
            </p>
            <AdminActionButton
              action="redact-review"
              targetId={r.id}
              label={t.redactReview}
              description={t.redactHint}
            />
          </article>
        ))}
        {!data.total && <Empty>{t.noMatch}</Empty>}
      </div>
      <Pager
        page={data.page}
        pages={data.pages}
        params={{ ...params, tab: "content" }}
      />
    </Panel>
  );
}
async function Audit({ params }: { params: Params }) {
  const { t, d, n } = await context(),
    data = await getAudit(params);
  return (
    <Panel title={t.audit} subtitle={t.auditHint}>
      <form
        action="/admin"
        className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_auto]"
      >
        <input type="hidden" name="tab" value="audit" />
        <label className="text-xs text-slate-400">
          {t.search}
          <input
            name="q"
            defaultValue={params.q}
            maxLength={100}
            placeholder={t.auditSearchHint}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="text-xs text-slate-400">
          {t.action}
          <select
            name="action"
            defaultValue={params.action || ""}
            className={`${fieldClass} mt-2`}
          >
            <option value="">{t.all}</option>
            {[
              "suspend",
              "activate",
              "redact-comment",
              "redact-review",
              "export-users",
            ].map((a) => (
              <option key={a} value={a}>
                {adminActionLabel(a, t)}
              </option>
            ))}
          </select>
        </label>
        <button className="self-end rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">
          {t.filter}
        </button>
      </form>
      <p className="mb-4 text-xs text-slate-400">
        {interpolate(t.countRecords, { count: n(data.total) })}
      </p>
      <div className="space-y-3">
        {data.logs.map((log) => (
          <article
            key={log.id}
            className="rounded-xl border border-white/10 p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <p className="text-sm font-bold">
                {adminActionLabel(log.action, t)}
              </p>
              <time className="text-xs text-slate-500">{d(log.createdAt)}</time>
            </div>
            <p className="mt-2 break-words text-sm">{log.reason}</p>
            <p className="mt-2 break-all text-xs text-slate-500">
              @{log.actorName} · {t.target}: {log.targetId}
            </p>
          </article>
        ))}
      </div>
      {!data.total && <Empty />}
      <Pager
        page={data.page}
        pages={data.pages}
        params={{ ...params, tab: "audit" }}
      />
    </Panel>
  );
}
async function System() {
  const { t } = await context();
  let healthy = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthy = true;
  } catch {}
  const configured = (ok: boolean) => (ok ? t.configured : t.notConfigured);
  const checks = [
    [t.health, healthy ? t.healthy : t.unhealthy],
    [t.version, (process.env.APP_COMMIT_SHA || "").slice(0, 12) || t.unknown],
    [
      t.analytics,
      process.env.ANALYTICS_ENABLED === "true" ? t.enabled : t.disabled,
    ],
    [t.countrySource, process.env.ANALYTICS_COUNTRY_HEADER || t.notConfigured],
    [
      t.google,
      configured(
        !!(
          (process.env.AUTH_GOOGLE_ID ||
            process.env.GOOGLE_CLIENT_ID ||
            process.env.GOOGLE_ID) &&
          (process.env.AUTH_GOOGLE_SECRET ||
            process.env.GOOGLE_CLIENT_SECRET ||
            process.env.GOOGLE_SECRET)
        ),
      ),
    ],
    [t.mail, configured(!!process.env.RESEND_API_KEY)],
    ["TMDB", configured(!!process.env.TMDB_API_KEY)],
    [
      t.environment,
      process.env.NODE_ENV === "production" ? t.production : t.development,
    ],
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel title={t.services} subtitle={t.servicesHint}>
        <dl className="space-y-4">
          {checks.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap justify-between gap-3 border-b border-white/5 pb-3 text-sm"
            >
              <dt className="text-slate-400">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title={t.accessScope}>
        <div className="space-y-4 text-sm text-slate-400">
          <p>{t.accessHint}</p>
          <p>{t.privacyHint}</p>
          <p>{t.registrationHint}</p>
          <p>{t.countriesHint}</p>
          <p>{t.messagesHint}</p>
        </div>
      </Panel>
    </div>
  );
}
