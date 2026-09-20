import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin/access";
import { getUserDetail } from "@/lib/admin/data";
import { isAdminId } from "@/lib/admin/policy";
import { countryLabel } from "@/lib/admin/analytics";
import { Panel, Metric, Empty, date } from "@/components/admin/ui";
import { AdminActionButton } from "@/components/admin/action-button";
import { Film, Tv, MessageSquare, Users, Clock } from "lucide-react";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getAdmin())) return null;
  const { id } = await params;
  const user = await getUserDetail(id);
  if (!user) notFound();

  const lastSeen = user.adminProfile?.lastSeenAt
    ? new Date(user.adminProfile.lastSeenAt).getTime()
    : 0;
  const diffMins = lastSeen
    ? Math.round((Date.now() - lastSeen) / 60000)
    : null;
  const isOnline = diffMins !== null && diffMins <= 4;
  const totalMinutes = user.adminProfile?.totalMinutes || 0;
  const timeFormatted =
    totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)} sa ${totalMinutes % 60} dk`
      : totalMinutes > 0
        ? `${totalMinutes} dk`
        : "< 1 dk";

  const details = [
    ["Kullanıcı kimliği", user.id],
    ["E-posta", user.email || "Belirtilmemiş"],
    [
      "Aktiflik durumu",
      isOnline
        ? "🟢 Çevrimiçi (Şu an sitede aktif)"
        : diffMins !== null && diffMins < 60
          ? `🟡 ${diffMins} dakika önce aktifti`
          : user.adminProfile?.lastSeenAt
            ? `Çevrimdışı (${date(user.adminProfile.lastSeenAt)})`
            : "Hiç görülmedi",
    ],
    [
      "Sitede geçirilen süre",
      `${totalMinutes} dakika (${timeFormatted})`,
    ],
    [
      "E-posta doğrulaması",
      user.emailVerified ? date(user.emailVerified) : "Doğrulama kaydı yok",
    ],
    [
      "Bağlı giriş sağlayıcıları",
      user.accounts.map((account) => account.provider).join(", ") ||
        "OAuth bağlantısı yok",
    ],
    ["Kayıt tarihi", date(user.adminProfile?.registeredAt)],
    ["Son görülme", date(user.adminProfile?.lastSeenAt)],
    ["Son bilinen ülke", countryLabel(user.adminProfile?.country)],
    ["Profil görünürlüğü", user.isPrivate ? "Gizli" : "Herkese açık"],
    [
      "Aktiviteler / İstatistikler",
      `${user.showActivities ? "Açık" : "Kapalı"} / ${user.showStats ? "Açık" : "Kapalı"}`,
    ],
    [
      "İlk kurulum",
      user.hasCompletedOnboarding ? "Tamamlandı" : "Tamamlanmadı",
    ],
    ["Askıya alınma tarihi", user.isSuspended ? date(user.suspendedAt) : "—"],
  ];
  return (
    <div className="space-y-6">
      <Link href="/admin?tab=users" className="text-sm text-amber-300">
        ← Kullanıcı dizinine dön
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Kullanıcı ayrıntısı
          </p>
          <h2 className="mt-2 break-words text-2xl font-black">
            {user.name || user.username}
          </h2>
          <p className="mt-1 break-all text-sm text-slate-400">
            @{user.username} {isAdminId(user.id) ? "· Yönetici" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isOnline && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Şu an Çevrimiçi
            </span>
          )}
          <span
            className={`rounded-lg px-3 py-2 text-xs ${user.isSuspended ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300"}`}
          >
            {user.isSuspended ? "Hesap askıda" : "Hesap aktif"}
          </span>
          <Link
            href={`/profile/${user.id}`}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
          >
            Profili görüntüle
          </Link>
          {!isAdminId(user.id) && (
            <AdminActionButton
              action={user.isSuspended ? "activate" : "suspend"}
              targetId={user.id}
              label={
                user.isSuspended ? "Hesabı etkinleştir" : "Hesabı askıya al"
              }
              description={
                user.isSuspended
                  ? `@${user.username} yeniden giriş yapabilecek.`
                  : `@${user.username} hesabının erişimi durdurulacak. Verileri korunacak; daha sonra yeniden etkinleştirebilirsiniz.`
              }
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          label="İzlenen yapım"
          value={user._count.watched}
          note={`${user._count.toWatch} yapım takip listesinde`}
          icon={<Film size={18} />}
        />
        <Metric
          label="İzlenen bölüm"
          value={user._count.watchedEpisodes}
          note={`${user._count.achievements} başarım kazanılmış`}
          icon={<Tv size={18} />}
        />
        <Metric
          label="Yorum"
          value={user._count.comments}
          note={`${user._count.activities} aktivite kaydı`}
          icon={<MessageSquare size={18} />}
        />
        <Metric
          label="Takipçi"
          value={user._count.followedBy}
          note={`${user._count.following} kullanıcıyı takip ediyor`}
          icon={<Users size={18} />}
        />
        <Metric
          label="Sitede Geçirilen Süre"
          value={timeFormatted}
          note={
            isOnline
              ? "Şu an sitede aktif"
              : diffMins !== null && diffMins < 60
                ? `${diffMins} dk önce aktifti`
                : "Toplam aktiflik süresi"
          }
          icon={<Clock size={18} className="text-amber-400" />}
        />
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel title="Hesap bilgileri">
          <dl className="space-y-4">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 border-b border-white/5 pb-3 text-sm sm:grid-cols-2"
              >
                <dt className="text-slate-500">{label}</dt>
                <dd className="break-words text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <div className="space-y-5">
          <Panel title="Profil ve tercihler">
            <p className="whitespace-pre-wrap break-words text-sm text-slate-300">
              {user.bio || "Biyografi eklenmemiş."}
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Favori türler</dt>
                <dd className="mt-1 break-words">
                  {user.favoriteGenres.join(", ") || "Belirtilmemiş"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">
                  Platform tercihleri (kayıtlı değerler)
                </dt>
                <dd className="mt-1 break-words">
                  {user.platforms.join(", ") || "Belirtilmemiş"}
                </dd>
              </div>
            </dl>
          </Panel>
          <Panel
            title="Mesaj istatistiği"
            subtitle="Mesaj içerikleri bu panelde gösterilmez."
          >
            <div className="flex gap-10">
              <p className="text-sm text-slate-400">
                Gönderilen{" "}
                <strong className="ml-2 text-white">
                  {user._count.sentMessages}
                </strong>
              </p>
              <p className="text-sm text-slate-400">
                Alınan{" "}
                <strong className="ml-2 text-white">
                  {user._count.receivedMessages}
                </strong>
              </p>
            </div>
          </Panel>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Son aktiviteler" subtitle="Son 12 kayıt">
          {user.activities.length ? (
            <div className="space-y-4">
              {user.activities.map((activity) => (
                <div key={activity.id} className="border-b border-white/5 pb-3">
                  <p className="text-sm font-semibold">
                    {activity.media.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {
                      {
                        WATCHED: "İzledi",
                        RATED: "Puanladı",
                        REVIEWED: "İnceledi",
                      }[activity.type]
                    }{" "}
                    {activity.rating !== null ? `· ${activity.rating}/10` : ""}
                  </p>
                  <time className="text-xs text-slate-500">
                    {date(activity.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel title="Son izlenenler" subtitle="Son 12 kayıt">
          {user.watched.length ? (
            <div className="space-y-4">
              {user.watched.map((item) => (
                <div key={item.id} className="border-b border-white/5 pb-3">
                  <p className="text-sm">{item.media.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {date(item.watchedAt)} · {item.rating ?? "—"}/10
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Panel>
        <Panel title="Takip listesi" subtitle="Son eklenen 12 yapım">
          {user.toWatch.length ? (
            <div className="space-y-4">
              {user.toWatch.map((item) => (
                <div key={item.id} className="border-b border-white/5 pb-3">
                  <p className="text-sm">{item.media.title}</p>
                  <p className="mt-1 text-xs text-amber-300">
                    {item.status === "WATCHING"
                      ? "İzliyor"
                      : "İzlemeyi planlıyor"}
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
