import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin/access";
import { getUserDetail } from "@/lib/admin/data";
import { isAdminId } from "@/lib/admin/policy";
import { countryLabel } from "@/lib/admin/analytics";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";
import {
  adminDate,
  adminDuration,
  adminNumber,
  botSignalLabel,
  onlineAt,
  REMOVED_COMMENTS,
} from "@/lib/admin/format";
import { evaluateAccountBotSignals } from "@/lib/bot-protection";
import { Panel, Metric, Empty } from "@/components/admin/ui";
import { AdminActionButton } from "@/components/admin/action-button";
import { Film, Tv, MessageSquare, Users, Clock } from "lucide-react";
import { acquisitionLabel } from "@/lib/acquisition-format";
export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getAdmin())) return null;
  const { id } = await params,
    user = await getUserDetail(id);
  if (!user) notFound();
  const locale = await getServerLocale(),
    dict = getDictionary(locale),
    t = dict.admin,
    d = (v: Date | null | undefined) => adminDate(v, locale, t.unknown),
    n = (v: number) => adminNumber(v, locale),
    isOnline = onlineAt(user.adminProfile?.lastSeenAt, user.isSuspended),
    minutes = user.adminProfile?.totalMinutes || 0;
  const acquisition = dict.acquisition;
  const botAnalysis = evaluateAccountBotSignals(user);
  const botVerdictText =
    botAnalysis.verdict === "bot"
      ? `${t.botAccount} (${botAnalysis.signals.map((s) => botSignalLabel(s, t)).join(", ")})`
      : botAnalysis.verdict === "suspicious"
        ? `${t.suspiciousAccount} (${botAnalysis.signals.map((s) => botSignalLabel(s, t)).join(", ")})`
        : t.humanAccount;
  const details = [
    [t.userId, user.id],
    [t.botStatus, botVerdictText],
    [t.email, user.email || t.notSpecified],
    [t.lastSeen, isOnline ? t.online : d(user.adminProfile?.lastSeenAt)],
    [t.duration, adminDuration(minutes, locale, t)],
    [t.verified, d(user.emailVerified)],
    [
      t.providers,
      user.accounts.map((a) => a.provider).join(", ") || t.noProviders,
    ],
    [t.registeredAt, d(user.adminProfile?.registeredAt)],
    [
      acquisition.source,
      acquisitionLabel(user.adminProfile?.acquisitionSource, acquisition),
    ],
    [
      acquisition.medium,
      user.adminProfile?.acquisitionMedium || acquisition.unknown,
    ],
    [
      acquisition.campaign,
      user.adminProfile?.acquisitionCampaign || acquisition.unknown,
    ],
    [
      acquisition.referrer,
      user.adminProfile?.referrerHost || acquisition.unknown,
    ],
    [acquisition.capturedAt, d(user.adminProfile?.acquisitionCapturedAt)],
    [
      acquisition.answer,
      acquisitionLabel(user.adminProfile?.discoveryAnswer, acquisition),
    ],
    [t.country, countryLabel(user.adminProfile?.country, locale, t.unknown)],
    [t.visibility, user.isPrivate ? t.private : t.public],
    [
      t.activitiesStats,
      `${user.showActivities ? t.enabled : t.disabled} / ${user.showStats ? t.enabled : t.disabled}`,
    ],
    [t.onboarding, user.hasCompletedOnboarding ? t.completed : t.incomplete],
    [t.suspendedAt, user.isSuspended ? d(user.suspendedAt) : "—"],
  ];
  return (
    <div className="space-y-6">
      <Link href="/admin?tab=users" className="text-sm text-amber-300">
        ← {t.backUsers}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{t.userDetail}</p>
          <h2 className="mt-2 break-words text-2xl font-black">
            {user.name || user.username}
          </h2>
          <p className="mt-1 break-all text-sm text-slate-400">
            @{user.username} · {user.email}{" "}
            {isAdminId(user.id) ? `· ${t.admin}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={user.isSuspended ? "text-rose-300" : "text-emerald-300"}
          >
            {user.isSuspended ? t.suspended : t.active}
          </span>
          {isOnline && (
            <span className="text-xs text-emerald-400">{t.online}</span>
          )}
          <Link
            href={`/profile/${user.id}`}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
          >
            {t.profile}
          </Link>
          <Link
            href={`/admin?tab=content&q=${encodeURIComponent(user.username)}`}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
          >
            {t.viewUserModeration}
          </Link>
          <Link
            href={`/admin?tab=audit&q=${encodeURIComponent(user.id)}`}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
          >
            {t.viewUserAudit}
          </Link>
          {!isAdminId(user.id) && (
            <>
              {!user.isSuspended && (
                <AdminActionButton
                  action="revoke-sessions"
                  targetId={user.id}
                  label={t.revokeSessions}
                  description={t.revokeSessionsHint}
                />
              )}
              <AdminActionButton
                action={user.isSuspended ? "activate" : "suspend"}
                targetId={user.id}
                label={user.isSuspended ? t.activate : t.suspend}
                description={user.isSuspended ? t.activateHint : t.suspendHint}
              />
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          label={t.watched}
          value={user._count.watched}
          note={`${t.watchlist}: ${n(user._count.toWatch)}`}
          icon={<Film size={18} />}
        />
        <Metric
          label={t.episodes}
          value={user._count.watchedEpisodes}
          note={`${t.achievements}: ${n(user._count.achievements)}`}
          icon={<Tv size={18} />}
        />
        <Metric
          label={t.comments}
          value={user._count.comments}
          note={`${t.activities}: ${n(user._count.activities)}`}
          icon={<MessageSquare size={18} />}
        />
        <Metric
          label={t.followers}
          value={user._count.followedBy}
          note={`${t.following}: ${n(user._count.following)}`}
          icon={<Users size={18} />}
        />
        <Metric
          label={t.duration}
          value={adminDuration(minutes, locale, t)}
          note={t.allTime}
          icon={<Clock size={18} />}
        />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel title={t.accountInfo}>
          <dl className="space-y-4">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 border-b border-white/5 pb-3 text-sm sm:grid-cols-2"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <div className="space-y-5">
          <Panel title={t.profilePreferences}>
            <p className="whitespace-pre-wrap break-words text-sm">
              {user.bio || t.noBio}
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">{t.genres}</dt>
                <dd className="mt-1 break-words">
                  {user.favoriteGenres.join(", ") || t.notSpecified}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t.platforms}</dt>
                <dd className="mt-1 break-words">
                  {user.platforms.join(", ") || t.notSpecified}
                </dd>
              </div>
            </dl>
          </Panel>
          <Panel title={t.messages} subtitle={t.messagesHint}>
            <div className="flex flex-wrap gap-6 text-sm">
              <p>
                {t.sent}: {n(user._count.sentMessages)}
              </p>
              <p>
                {t.received}: {n(user._count.receivedMessages)}
              </p>
            </div>
          </Panel>
          <Panel title={t.achievements} subtitle={t.recentHint}>
            {user.achievements.length ? (
              <div className="flex flex-wrap gap-2">
                {user.achievements.map((ach) => (
                  <span
                    key={ach.id}
                    title={d(ach.unlockedAt)}
                    className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200"
                  >
                    {dict.achievementNames[ach.type] || ach.type}
                  </span>
                ))}
              </div>
            ) : (
              <Empty />
            )}
          </Panel>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.recentActivities} subtitle={t.recentHint}>
          {user.activities.length ? (
            <div className="space-y-4">
              {user.activities.map((a) => (
                <div key={a.id} className="border-b border-white/5 pb-3">
                  <Link
                    href={`/${a.media.type === "TV" ? "tv" : "movie"}/${a.media.tmdbId}`}
                    className="text-sm font-semibold hover:text-amber-300"
                  >
                    {a.media.title} ↗
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {
                      {
                        WATCHED: t.watchedAction,
                        RATED: t.ratedAction,
                        REVIEWED: t.reviewedAction,
                      }[a.type]
                    }{" "}
                    {a.rating !== null ? `· ${n(a.rating)}/10` : ""}
                  </p>
                  {a.review && (
                    <div className="mt-2 space-y-2 rounded-lg border border-white/5 bg-slate-950/60 p-3">
                      <p className="max-h-32 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-300">
                        {a.review}
                      </p>
                      <AdminActionButton
                        action="redact-review"
                        targetId={a.id}
                        label={t.redactReview}
                        description={t.redactHint}
                      />
                    </div>
                  )}
                  <time className="mt-1 block text-xs text-slate-500">
                    {d(a.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel title={t.recentComments} subtitle={t.recentHint}>
          {user.comments.length ? (
            <div className="space-y-4">
              {user.comments.map((c) => {
                const contextTarget = c.episode
                  ? {
                      href: `/tv/${c.episode.media.tmdbId}/season/${c.episode.seasonNumber}/episode/${c.episode.episodeNumber}`,
                      label: `${c.episode.media.title} · S${c.episode.seasonNumber}E${c.episode.episodeNumber}`,
                    }
                  : c.activity?.media
                    ? {
                        href: `/${c.activity.media.type === "TV" ? "tv" : "movie"}/${c.activity.media.tmdbId}`,
                        label: c.activity.media.title,
                      }
                    : c.personId
                      ? {
                          href: `/person/${c.personId}`,
                          label: `${t.pathPersonDetail} #${c.personId}`,
                        }
                      : null;
                return (
                  <div key={c.id} className="border-b border-white/5 pb-3">
                    <div className="flex flex-wrap justify-between gap-2 text-xs">
                      {contextTarget ? (
                        <Link
                          href={contextTarget.href}
                          className="font-semibold text-amber-300 hover:underline"
                        >
                          {contextTarget.label} ↗
                        </Link>
                      ) : (
                        <span className="text-slate-500">{t.comment}</span>
                      )}
                      <time className="text-slate-500">{d(c.createdAt)}</time>
                    </div>
                    <p className="my-2 max-h-32 overflow-auto whitespace-pre-wrap break-words text-sm">
                      {REMOVED_COMMENTS.includes(c.content)
                        ? t.removedComment
                        : c.content}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t.recentWatched} subtitle={t.recentHint}>
          {user.watched.length ? (
            <div className="space-y-4">
              {user.watched.map((w) => (
                <div key={w.id} className="border-b border-white/5 pb-3">
                  <Link
                    href={`/${w.media.type === "TV" ? "tv" : "movie"}/${w.media.tmdbId}`}
                    className="text-sm hover:text-amber-300"
                  >
                    {w.media.title} ↗
                  </Link>
                  <p className="mt-1 text-xs text-slate-400">
                    {d(w.watchedAt)} · {w.rating === null ? "—" : n(w.rating)}
                    /10
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel title={t.watchlist} subtitle={t.recentHint}>
          {user.toWatch.length ? (
            <div className="space-y-4">
              {user.toWatch.map((w) => (
                <div key={w.id} className="border-b border-white/5 pb-3">
                  <Link
                    href={`/${w.media.type === "TV" ? "tv" : "movie"}/${w.media.tmdbId}`}
                    className="text-sm hover:text-amber-300"
                  >
                    {w.media.title} ↗
                  </Link>
                  <p className="mt-1 text-xs text-amber-300">
                    {w.status === "WATCHING" ? t.watching : t.planToWatch}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
      </div>
    </div>
  );
}
