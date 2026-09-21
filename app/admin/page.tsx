import Link from "next/link";
import {
  Users,
  Activity,
  Globe2,
  UserPlus,
  Download,
  Shield,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings2,
  Clock,
} from "lucide-react";
import { getAdmin } from "@/lib/admin/access";
import {
  getOverview,
  getUsers,
  getModeration,
  getAudit,
} from "@/lib/admin/data";
import { dateWindow } from "@/lib/admin/policy";
import { countryLabel, pathLabel } from "@/lib/admin/analytics";
import {
  Panel,
  Metric,
  Bars,
  Empty,
  Pager,
  DailyChart,
  fieldClass,
  number,
  date,
} from "@/components/admin/ui";
import { AdminActionButton } from "@/components/admin/action-button";

type Params = {
  tab?: string;
  days?: string;
  q?: string;
  status?: string;
  country?: string;
  sort?: string;
  page?: string;
};
const tabs = [
  { key: "overview", label: "Genel bakış", icon: LayoutDashboard },
  { key: "users", label: "Kullanıcılar", icon: Users },
  { key: "content", label: "Moderasyon", icon: MessageSquare },
  { key: "audit", label: "İşlem geçmişi", icon: ScrollText },
  { key: "system", label: "Sistem", icon: Settings2 },
];
const actionNames: Record<string, string> = {
  suspend: "Hesap askıya alındı",
  activate: "Hesap etkinleştirildi",
  "redact-comment": "Yorum kaldırıldı",
  "redact-review": "İnceleme kaldırıldı",
  "export-users": "CSV indirildi",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await getAdmin())) return null;
  const rawParams = await searchParams;
  const params: Params = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const tab = tabs.some((item) => item.key === params.tab)
    ? params.tab!
    : "overview";
  const { days, since } = dateWindow(params.days);
  return (
    <>
      <nav
        aria-label="Yönetim bölümleri"
        className="mb-7 flex gap-2 overflow-x-auto border-b border-white/10 pb-4"
      >
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/admin?tab=${item.key}&days=${days}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === item.key ? "bg-amber-400 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "overview" && <Overview tab={tab} days={days} since={since} />}
      {tab === "users" && <UsersTab params={params} />}
      {tab === "content" && <Moderation params={params} />}
      {tab === "audit" && <Audit params={params} />}
      {tab === "system" && <System />}
    </>
  );
}

async function Overview({ tab, days, since }: { tab: string; days: number; since: Date }) {
  const data = await getOverview(since);
  const rows = Array.from({ length: days }, (_, i) => {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);
    const dateStr = day.toISOString().slice(0, 10);
    return {
      date: dateStr,
      label: day.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      value:
        data.daily.find(
          (row) =>
            row.day.toISOString().slice(0, 10) === dateStr,
        )?._sum.views || 0,
    };
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Platform özeti</h2>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-slate-900 p-1">
          {[7, 30, 90].map((value) => (
            <Link
              key={value}
              href={`/admin?tab=${tab}&days=${value}`}
              aria-current={value === days ? "true" : undefined}
              className={`rounded-lg px-3 py-2 text-xs font-bold ${value === days ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              Son {value} gün
            </Link>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Metric
          label="Kayıtlı kullanıcı"
          value={data.users}
          note={`${number(data.suspended)} hesap askıda`}
          icon={<Users size={18} />}
        />
        <Metric
          label="Anlık Çevrimiçi"
          value={data.onlineCount}
          note="Son 5 dakikada aktif"
          icon={
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          }
        />
        <Metric
          label="Aktif üye"
          value={data.active}
          note={`Son ${days} günde ölçülen`}
          icon={<Activity size={18} />}
        />
        <Metric
          label="Yeni kayıt"
          value={data.newUsers}
          note={`Son ${days} gün`}
          icon={<UserPlus size={18} />}
        />
        <Metric
          label="Sayfa görüntüleme"
          value={data.views}
          note={`Son ${days} gün`}
          icon={<Globe2 size={18} />}
        />
        <Metric
          label="Sitede süre"
          value={data.totalMinutes >= 60 ? `${Math.floor(data.totalMinutes / 60)} sa ${data.totalMinutes % 60} dk` : `${data.totalMinutes} dk`}
          note={data.active > 0 ? `Ortalama ${Math.round(data.totalMinutes / data.active)} dk / aktif üye` : "Toplam aktiflik"}
          icon={<Clock size={18} className="text-amber-400" />}
        />
      </div>
      {!data.firstDay && (
        <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
          Ziyaret ölçümü henüz veri üretmedi. Ülke, cihaz ve trafik grafikleri
          yeni ziyaretlerle dolacak; geçmiş ziyaretler tahmin edilmez.
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Ziyaret hareketi"
          subtitle={`Günlük sayfa görüntülemeleri · UTC gün sınırları${data.firstDay ? ` · ilk ölçüm: ${date(data.firstDay)}` : ""}`}
        >
          <DailyChart rows={rows} />
        </Panel>
        <Panel
          title="Hangi ülkelerden geliniyor?"
          subtitle="Görüntüleme sayısına göre ilk 20 ülke. Güvenilir konum başlığı yoksa bilinmiyor."
        >
          <Bars
            rows={data.countries.map((row) => ({
              label: countryLabel(row.country),
              value: row._sum.views || 0,
            }))}
          />
        </Panel>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Panel title="Cihaz dağılımı">
          <Bars
            rows={[
              { key: "desktop", label: "Masaüstü" },
              { key: "mobile", label: "Mobil" },
              { key: "tablet", label: "Tablet" },
            ].map(({ key, label }) => ({
              label,
              value: data.devices.find((d) => d.device === key)?._sum.views || 0,
            }))}
          />
        </Panel>
        <Panel
          title="Ziyaretçi türü"
          subtitle="Görüntüleme anındaki oturum durumuna göre."
        >
          <Bars
            rows={[
              {
                label: "Üye görüntülemeleri",
                value: data.audience.find((a) => a.audience === "member")?._sum.views || 0,
              },
              {
                label: "Misafir görüntülemeleri",
                value: data.audience.find((a) => a.audience === "guest")?._sum.views || 0,
              },
            ]}
          />
        </Panel>
        <Panel
          title="Aktif üyelerin ülkeleri"
          subtitle="Üye başına son bilinen ülke; vatandaşlık bilgisi değildir."
        >
          <Bars
            rows={data.memberCountries.map((row) => ({
              label: countryLabel(row.country),
              value: row._count.userId,
            }))}
          />
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="En çok görüntülenen sayfalar"
          subtitle="Kişisel kimlikler ve arama metinleri ölçümlere alınmaz."
        >
          <Bars
            rows={data.paths.map((row) => ({
              label: `${pathLabel(row.path)} (${row.path})`,
              value: row._sum.views || 0,
            }))}
          />
        </Panel>
        <Panel
          title="Topluluğun en çok izledikleri"
          subtitle="Tüm zamanlar · izledim kaydı sayısı"
        >
          <Bars
            rows={data.popular
              .filter((row) => row._count.watchedBy > 0)
              .map((row) => ({
                label: `${row.title} · ${row.type === "TV" ? "Dizi" : "Film"}`,
                value: row._count.watchedBy,
              }))}
          />
        </Panel>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="İçerik ve etkileşim" subtitle="Tüm zamanlar">
          <dl className="grid grid-cols-2 gap-5">
            {[
              ["Katalogdaki yapım", data.media],
              ["İzleme kaydı", data.watched],
              ["İzlenen bölüm", data.episodes],
              ["Yorum", data.comments],
              ["Mesaj", data.messages],
              ["Kurulumu tamamlayan", data.onboarded],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 text-xl font-bold">
                  {number(Number(value))}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel
          title="Yeni kayıt günleri"
          subtitle="Eski kullanıcıların kayıt tarihi tutulmadığından bu grafiğe dahil değildir."
        >
          <Bars
            rows={data.registrations.slice(-10).map((row) => ({
              label: row.day.toLocaleDateString("tr-TR", { timeZone: "UTC" }),
              value: Number(row.count),
            }))}
          />
        </Panel>
      </div>
    </div>
  );
}

async function UsersTab({ params }: { params: Params }) {
  const data = await getUsers(params);
  const exportParams = new URLSearchParams();
  for (const key of ["q", "status", "country"] as const)
    if (params[key]) exportParams.set(key, params[key]!);
  return (
    <Panel
      title="Kullanıcı dizini"
      subtitle={`${number(data.total)} kullanıcı · tarih alanları Türkiye saatiyle gösterilir.`}
    >
      <form
        action="/admin"
        className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <input type="hidden" name="tab" value="users" />
        <label className="text-xs text-slate-400">
          Kullanıcı ara
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Ad, kullanıcı adı, e-posta"
            maxLength={100}
            className={`${fieldClass} mt-2`}
          />
        </label>
        <label className="text-xs text-slate-400">
          Durum
          <select
            name="status"
            defaultValue={params.status || ""}
            className={`${fieldClass} mt-2`}
          >
            <option value="">Tüm kullanıcılar</option>
            <option value="active">Aktif hesap</option>
            <option value="suspended">Askıya alınmış</option>
            <option value="onboarding">Kurulumu eksik</option>
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Ülke
          <select
            name="country"
            defaultValue={params.country || ""}
            className={`${fieldClass} mt-2`}
          >
            <option value="">Tüm ülkeler</option>
            <option value="ZZ">Bilinmiyor</option>
            {data.countries.map((row) => (
              <option key={row.country} value={row.country!}>
                {countryLabel(row.country)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Sıralama
          <select
            name="sort"
            defaultValue={params.sort || "name"}
            className={`${fieldClass} mt-2`}
          >
            <option value="name">Kullanıcı adı</option>
            <option value="recent">Son görülme</option>
            <option value="time">Sitede kalma süresi</option>
            <option value="registered">Kayıt tarihi</option>
          </select>
        </label>
        <button className="self-end rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950">
          Filtrele
        </button>
      </form>
      <div className="mb-4 flex flex-wrap justify-between gap-3 text-xs">
        <Link
          href="/admin?tab=users"
          className="text-slate-400 hover:text-white"
        >
          Filtreleri temizle
        </Link>
        <a
          href={`/api/admin/export?${exportParams}`}
          className="flex items-center gap-2 text-amber-300"
        >
          <Download size={15} />
          Filtrelenen kullanıcıları CSV indir (en fazla 5000)
        </a>
      </div>
      {data.users.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs text-slate-500">
              <tr>
                {[
                  "Kullanıcı",
                  "Aktiflik",
                  "Sitede Süre",
                  "Ülke",
                  "Durum",
                  "Kayıt tarihi",
                  "İzleme / Bölüm",
                  "",
                ].map((label, i) => (
                  <th key={i} className="px-3 py-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => {
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

                return (
                  <tr
                    key={user.id}
                    className="border-b border-white/5 hover:bg-white/[.02]"
                  >
                    <td className="max-w-72 px-3 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="block truncate font-bold text-white hover:text-amber-400 font-mono text-sm"
                        title={user.email || user.username}
                      >
                        {user.email || user.name || user.username}
                      </Link>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        <span className="font-mono text-amber-300 font-medium">@{user.username}</span>
                        {user.name && user.name !== user.username && user.name !== user.email && (
                          <span className="text-slate-300"> · {user.name}</span>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 shadow-sm whitespace-nowrap">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          Çevrimiçi
                        </span>
                      ) : diffMins !== null && diffMins < 60 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300 whitespace-nowrap">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                          {diffMins} dk önce
                        </span>
                      ) : diffMins !== null && diffMins < 1440 ? (
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {Math.round(diffMins / 60)} saat önce
                        </span>
                      ) : lastSeen ? (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {date(user.adminProfile?.lastSeenAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600 whitespace-nowrap">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock
                          size={13}
                          className="text-amber-400/80 shrink-0"
                        />
                        <span
                          className={
                            totalMinutes > 0
                              ? "font-semibold text-amber-200"
                              : "text-slate-500"
                          }
                        >
                          {timeFormatted}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-slate-400">
                      {countryLabel(user.adminProfile?.country)}
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs ${user.isSuspended ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300"}`}
                      >
                        {user.isSuspended ? "Askıda" : "Aktif"}
                      </span>
                      {!user.hasCompletedOnboarding && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          Kurulum eksik
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-400">
                      {date(user.adminProfile?.registeredAt)}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs">
                      {user._count.watched} / {user._count.watchedEpisodes}
                    </td>
                    <td className="px-3 py-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-xs text-amber-300 hover:underline"
                      >
                        İncele →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Bu filtrelere uyan kullanıcı bulunamadı.</Empty>
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
  const data = await getModeration(params.page);
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Panel
        title="Yorum moderasyonu"
        subtitle={`${number(data.total)} yorum · kaldırılan yorumun yanıtları korunur.`}
      >
        {data.comments.length ? (
          <div className="space-y-4">
            {data.comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-xl border border-white/10 p-4"
              >
                <div className="flex flex-wrap justify-between gap-2 text-xs">
                  <Link
                    href={`/admin/users/${comment.user.id}`}
                    className="text-amber-300"
                  >
                    @{comment.user.username}
                  </Link>
                  <time className="text-slate-500">
                    {date(comment.createdAt)}
                  </time>
                </div>
                <p className="my-3 max-h-40 overflow-auto whitespace-pre-wrap break-words text-sm text-slate-300">
                  {comment.content}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    {comment.isSpoiler ? "Spoiler işaretli" : "Yorum"}
                  </span>
                  {comment.content !==
                    "[Bu yorum yönetici tarafından kaldırıldı.]" && (
                    <AdminActionButton
                      action="redact-comment"
                      targetId={comment.id}
                      label="Yorumu kaldır"
                      description="Yorum metni kaldırıldı bildirimiyle değiştirilecek. Yanıtlar korunacak. Bu işlem geri alınamaz."
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty />
        )}
        <Pager
          page={data.page}
          pages={data.pages}
          params={{ tab: "content" }}
        />
      </Panel>
      <Panel
        title="Son incelemeler"
        subtitle="En yeni 10 inceleme. Puan ve izleme kaydı korunur."
      >
        {data.reviews.length ? (
          <div className="space-y-5">
            {data.reviews.map((review) => (
              <article key={review.id} className="border-b border-white/5 pb-5">
                <p className="text-sm font-bold">{review.media.title}</p>
                <Link
                  href={`/admin/users/${review.user.id}`}
                  className="text-xs text-amber-300"
                >
                  @{review.user.username}
                </Link>
                <p className="my-3 max-h-40 overflow-auto whitespace-pre-wrap break-words text-sm text-slate-400">
                  {review.review}
                </p>
                <AdminActionButton
                  action="redact-review"
                  targetId={review.id}
                  label="İncelemeyi kaldır"
                  description="İnceleme metni silinecek; izleme kaydı ve puan korunacak. Bu işlem geri alınamaz."
                />
              </article>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Panel>
    </div>
  );
}

async function Audit({ params }: { params: Params }) {
  const data = await getAudit(params.page);
  return (
    <Panel
      title="Yönetici işlem geçmişi"
      subtitle="Hesap işlemleri, moderasyon ve CSV indirmeleri burada kayıt altına alınır."
    >
      {data.logs.length ? (
        <div className="space-y-3">
          {data.logs.map((log) => (
            <article
              key={log.id}
              className="rounded-xl border border-white/10 p-4"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <p className="text-sm font-bold">
                  {actionNames[log.action] || log.action}
                </p>
                <time className="text-xs text-slate-500">
                  {date(log.createdAt)}
                </time>
              </div>
              <p className="mt-2 break-words text-sm text-slate-300">
                {log.reason}
              </p>
              <p className="mt-2 break-all text-xs text-slate-500">
                @{log.actorName} · Hedef: {log.targetId}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <Empty>Henüz yönetici işlemi yapılmadı.</Empty>
      )}
      <Pager page={data.page} pages={data.pages} params={{ tab: "audit" }} />
    </Panel>
  );
}

function System() {
  const checks = [
    [
      "Ziyaret ölçümü",
      process.env.ANALYTICS_ENABLED === "true" ? "Etkin" : "Kapalı",
    ],
    [
      "Ülke kaynağı",
      process.env.ANALYTICS_COUNTRY_HEADER || "Tanımlanmadı · ülke bilinmiyor",
    ],
    [
      "Google girişi",
      (process.env.AUTH_GOOGLE_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_ID) &&
      (process.env.AUTH_GOOGLE_SECRET ||
        process.env.GOOGLE_CLIENT_SECRET ||
        process.env.GOOGLE_SECRET)
        ? "Yapılandırılmış"
        : "Yapılandırılmamış",
    ],
    [
      "E-posta servisi",
      process.env.RESEND_API_KEY ? "Yapılandırılmış" : "Yapılandırılmamış",
    ],
    [
      "TMDB",
      process.env.TMDB_API_KEY ? "Yapılandırılmış" : "Yapılandırılmamış",
    ],
    ["Ortam", process.env.NODE_ENV === "production" ? "Üretim" : "Geliştirme"],
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel
        title="Servis yapılandırması"
        subtitle="Anahtar varlığını gösterir; servislerin anlık erişilebilirlik testi değildir."
      >
        <dl className="space-y-4">
          {checks.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap justify-between gap-3 border-b border-white/5 pb-3 text-sm"
            >
              <dt className="text-slate-400">{label}</dt>
              <dd className="text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>
      <Panel title="Erişim ve veri kapsamı">
        <div className="space-y-4 text-sm leading-relaxed text-slate-400">
          <Shield className="text-amber-400" size={28} />
          <p>
            Yönetici erişimi sunucuda tanımlanan hesap kimlikleriyle verilir.
            Her veri isteği ve işlem için yetki yeniden kontrol edilir.
          </p>
          <p>
            Ülkeler yaklaşık bağlantı konumudur. Dil ayarından ülke tahmini
            yapılmaz. Ölçümde IP, ziyaretçi çerezi, arama metni ve mesaj içeriği
            saklanmaz.
          </p>
          <p>
            Aktif üye sayısı, seçili dönemde ölçülen farklı hesaplardır.
            Görüntüleme sayısı tekil ziyaretçi sayısı değildir. Do Not Track /
            Global Privacy Control talepleri ölçüm dışında tutulur.
          </p>
          <p>
            Eski hesapların kayıt tarihleri bilinmiyor olarak gösterilir.
            Mesajların yalnızca adetleri raporlanır.
          </p>
        </div>
      </Panel>
    </div>
  );
}
