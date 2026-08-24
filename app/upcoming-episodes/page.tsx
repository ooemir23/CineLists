import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFavoriteActorsUpcoming, getWatchedShowsNextEpisodes } from "@/lib/hero-personalization-actions";
import { Calendar, Tv, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const formatFullDate = (dateStr: string | null) => {
    if (!dateStr) return "Tarih bilinmiyor";
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        weekday: "long",
    });
};

const formatDaysLeft = (dateStr: string | null) => {
    if (!dateStr) return null;
    const today = new Date();
    const target = new Date(dateStr);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diffMs = startOfTarget.getTime() - startOfToday.getTime();
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Bugün";
    if (days === 1) return "Yarın";
    return `${days} gün sonra`;
};

const formatEpisodeInfo = (season?: number | null, episode?: number | null) => {
    if (season && episode) return `${season}. Sezon ${episode}. Bölüm`;
    if (season) return `${season}. Sezon`;
    return "Yeni Bölüm";
};

export default async function UpcomingEpisodesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [upcomingEpisodes, favoriteActorProjects] = await Promise.all([
        getWatchedShowsNextEpisodes(),
        getFavoriteActorsUpcoming(),
    ]);

    return (
        <div className="min-h-screen bg-[#0f1424] text-neutral-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Yakında Çıkacak Bölümler</h1>
                            <p className="text-xs text-neutral-400">İzlediğin dizilerin yeni bölümlerini buradan takip et.</p>
                        </div>
                    </div>
                </div>

                {upcomingEpisodes.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                            <Tv className="w-6 h-6 text-blue-300" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Yakında bölüm yok</h2>
                        <p className="text-xs text-neutral-400 mt-2">İzledikçe yeni bölümler burada görünecek.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {upcomingEpisodes.map((episode) => (
                            <Link
                                key={`${episode.showId}-${episode.nextEpisodeDate ?? "none"}`}
                                href={`/tv/${episode.showId}`}
                                className="group bg-[#131b2c]/70 border border-white/10 rounded-2xl p-4 flex gap-4 hover:border-blue-400/40 transition-all"
                            >
                                <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-neutral-900 shrink-0">
                                    {episode.posterPath ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w300${episode.posterPath}`}
                                            alt={episode.showTitle}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Tv className="w-6 h-6 text-neutral-600" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-200 transition-colors">
                                                {episode.showTitle}
                                            </h3>
                                            <p className="text-[11px] text-blue-200/80 mt-1">
                                                {formatEpisodeInfo(episode.nextEpisodeSeason, episode.nextEpisodeNumber)}
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-neutral-400 whitespace-nowrap">
                                            {formatDaysLeft(episode.nextEpisodeDate) || "Tarih yok"}
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-neutral-400 mt-2">
                                        {formatFullDate(episode.nextEpisodeDate)}
                                    </p>

                                    {episode.platforms.length > 0 && (
                                        <div className="flex items-center gap-2 mt-3">
                                            {episode.platformLogos && episode.platformLogos.length > 0 && (
                                                <div className="flex items-center -space-x-1">
                                                    {episode.platformLogos.map((platform) => (
                                                        <div
                                                            key={platform.name}
                                                            className="relative w-5 h-5 rounded-full overflow-hidden border border-white/10 bg-white/5"
                                                            title={platform.name}
                                                        >
                                                            {platform.logoPath ? (
                                                                <Image
                                                                    src={`https://image.tmdb.org/t/p/w92${platform.logoPath}`}
                                                                    alt={platform.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="text-[10px] text-blue-300 font-bold truncate">
                                                {episode.platforms.join(" · ")}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                <section className="mt-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Star className="w-4 h-4 text-amber-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Favori Oyunculardan Yakında</h2>
                            <p className="text-xs text-neutral-400">Takip ettiğin oyuncuların yeni projeleri.</p>
                        </div>
                    </div>

                    {favoriteActorProjects.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                            <p className="text-xs text-neutral-400">Favori oyuncu ekledikçe burada görünecek.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {favoriteActorProjects.map((item) => (
                                <Link
                                    key={`${item.id}-${item.actorName}`}
                                    href={`/${item.mediaType === "tv" ? "tv" : "movie"}/${item.id}`}
                                    className="group"
                                >
                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-800 mb-2">
                                        {item.posterPath ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
                                                alt={item.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Tv className="w-8 h-8 text-neutral-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-[9px] font-bold text-white px-2 py-1 rounded-full">
                                            <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/10 bg-white/10">
                                                {item.actorProfilePath ? (
                                                    <Image
                                                        src={`https://image.tmdb.org/t/p/w92${item.actorProfilePath}`}
                                                        alt={item.actorName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[9px]">★</div>
                                                )}
                                            </div>
                                            <span className="text-[9px] font-bold text-white truncate max-w-[90px]">
                                                {item.actorName}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                                        {item.title}
                                    </h3>
                                    {item.releaseDate && (
                                        <span className="text-[10px] text-neutral-500">
                                            {new Date(item.releaseDate).toLocaleDateString("tr-TR", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
