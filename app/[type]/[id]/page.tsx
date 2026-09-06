import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { tmdb } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import { getToWatchStatus } from "@/lib/actions";
import { getWatchStatus } from "@/lib/activity-actions";
import { getWatchedEpisodes } from "@/lib/tv-actions";
import { MediaActions } from "@/components/media/media-actions";
import { WatchProviders } from "@/components/media/watch-providers";
import { RatingDisplay } from "@/components/media/rating-display";
import { getReceivedRecommendation } from "@/lib/recommendation-actions";
import { Star, ArrowLeft, Globe, Film, Tv } from "lucide-react";
import { ExpandableImage } from "@/components/ui/expandable-image";
import { TrailerButton } from "@/components/media/trailer-button";
import { DetailTabs } from "@/components/media/detail-tabs";
import { Metadata } from "next";
import { headers } from "next/headers";
import { BackButton } from "@/components/ui/back-button";
import { detectUserCountry } from "@/lib/country";

import { ActionNotification } from "@/components/media/action-notification";

function isValidMediaRoute(type: string, id: string) {
    return (type === "movie" || type === "tv") && /^\d+$/.test(id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { type, id } = await params;
    if (!isValidMediaRoute(type, id)) return {};

    const data = await tmdb.getDetails(type as "movie" | "tv", id).catch(() => null);
    if (!data) return { title: "İçerik Bulunamadı" };
    const title = data.title || data.name;
    const description = data.overview || `${title} hakkında detaylar.`;
    const image = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;
    return {
        title,
        description,
        openGraph: { title, description, images: image ? [{ url: image }] : [], type: "video.movie" },
        twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] }
    };
}

type Props = { params: Promise<{ type: string; id: string }> };

export default async function DetailsPage(props: Props) {
    const params = await props.params;
    const { type, id } = params;
    if (!isValidMediaRoute(type, id)) notFound();

    const mediaId = parseInt(id);
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;
    const isGuest = (session?.user as any)?.isGuest;

    const safe = async <T,>(p: Promise<T>, fb: T): Promise<T> => {
        try { return await p; } catch { return fb; }
    };

    const [
        data, credits, videos, inWatchlist, watchStatus, watchedEpisodes,
        providersData, userRating, friendsRatings,
        activeRecommendation, dbMedia, recommendationsData
    ] = await Promise.all([
        tmdb.getDetails(type as "movie" | "tv", id).catch(() => null),
        tmdb.getCredits(type as "movie" | "tv", id).catch(() => null),
        tmdb.getVideos(type as "movie" | "tv", id).catch(() => null),
        safe(getToWatchStatus(mediaId), false),
        safe(getWatchStatus(mediaId), null),
        type === "tv" ? safe(getWatchedEpisodes(mediaId), []) : Promise.resolve([]),
        tmdb.getWatchProviders(type as "movie" | "tv", id).catch(() => null),
        safe((async () => { const { getUserRating } = await import("@/lib/rating-actions"); return getUserRating(mediaId, type as "movie" | "tv"); })(), null),
        safe((async () => { const { getFriendsRatings } = await import("@/lib/rating-actions"); return getFriendsRatings(mediaId, type as "movie" | "tv"); })(), []),
        safe(getReceivedRecommendation(mediaId), null),
        safe((async () => {
            try {
                return await prisma.mediaItem.findUnique({
                    where: { tmdbId: mediaId },
                    include: { 
                        activities: { 
                            where: {
                                OR: [
                                    { type: "REVIEWED" },
                                    { review: { not: null } },
                                    { comments: { some: {} } }
                                ]
                            }, 
                            include: { 
                                user: true,
                                comments: {
                                    include: { user: true },
                                    orderBy: { createdAt: "asc" }
                                }
                            }, 
                            orderBy: { createdAt: "desc" } 
                        } 
                    }
                });
            } catch {
                return null;
            }
        })(), null),
        safe((async () => {
            const [recs, sim] = await Promise.allSettled([
                tmdb.getRecommendations(type as "movie" | "tv", id).catch(() => null),
                tmdb.getSimilar(type as "movie" | "tv", id).catch(() => null),
            ]);
            const recList = recs.status === "fulfilled" && recs.value?.results ? recs.value.results : [];
            const simList = sim.status === "fulfilled" && sim.value?.results ? sim.value.results : [];
            const combined = [...recList, ...simList];
            const seen = new Set<number>();
            const unique = combined.filter((item: any) => {
                if (!item || !item.id || item.id === mediaId || seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            });
            return unique;
        })(), [])
    ]) as [any, any, any, boolean, any, any, any, number | null, any[], any, any, any[]];

    if (!data) notFound();

    const comments = dbMedia?.activities.map((a: any) => ({
        id: a.id, 
        content: a.review || "", 
        createdAt: a.createdAt,
        isSpoiler: a.isSpoiler,
        votes: a.votes || 0,
        userId: a.userId,
        user: { name: a.user.name, image: a.user.image },
        replies: a.comments?.map((c: any) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt,
            isSpoiler: c.isSpoiler,
            votes: c.votes || 0,
            userId: c.userId,
            user: { name: c.user.name, image: c.user.image }
        })) || []
    })) || [];

    const headersList = await headers();
    const userCountry = detectUserCountry(headersList);

    let activeProviders = providersData?.results?.[userCountry] || null;
    let isGlobal = false;
    if (!activeProviders || (!activeProviders.flatrate && !activeProviders.buy)) {
        if (providersData?.results?.TR?.flatrate || providersData?.results?.TR?.buy) {
            activeProviders = providersData.results.TR;
        } else {
            const other = Object.entries(providersData?.results || {}).find(([, v]: [string, any]) => v.flatrate || v.buy);
            if (other) { activeProviders = other[1]; isGlobal = true; }
        }
    }

    const title = data.title || data.name;
    const releaseDate = data.release_date || data.first_air_date;
    const runtime = data.runtime || (data.episode_run_time?.[0]) || (data.last_episode_to_air?.runtime) || null;
    const runtimeFmt = runtime
        ? (Math.floor(runtime / 60) > 0 ? `${Math.floor(runtime / 60)}s ${runtime % 60}dk` : `${runtime}dk`)
        : null;
    const voteCount = data.vote_count ? data.vote_count.toLocaleString("tr-TR") : null;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null;
    const directors = credits?.crew?.filter((c: any) => c.job === "Director").slice(0, 2) || [];
    const creators = (data.created_by || []).slice(0, 2);

    const statusMap: Record<string, { label: string; cls: string }> = {
        "Released":         { label: "Yayınlandı",          cls: "text-neutral-400 border-neutral-500/20 bg-neutral-500/10" },
        "Ended":            { label: "Tamamlandı",           cls: "text-neutral-400 border-neutral-500/20 bg-neutral-500/10" },
        "Returning Series": { label: "Devam Ediyor",         cls: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" },
        "In Production":    { label: "Yapım Aşamasında",    cls: "text-sky-400 border-sky-500/20 bg-sky-500/10" },
    };
    const statusInfo = data.status ? (statusMap[data.status] ?? { label: data.status, cls: "text-white/40 border-white/10 bg-white/5" }) : null;

    return (
        <div className="relative min-h-screen">
            <ActionNotification />

            {/* ── BACKGROUND (sadece üst header bölgesi) ── */}
            <div className="absolute top-0 left-0 right-0 h-[520px] z-0 pointer-events-none overflow-hidden">
                {(backdrop || data.poster_path) && (
                    <Image
                        src={backdrop ?? `https://image.tmdb.org/t/p/original${data.poster_path}`}
                        alt=""
                        fill
                        priority
                        className="object-cover object-top"
                        style={{ filter: "brightness(0.32) saturate(1.2) blur(3px)", transform: "scale(1.06)" }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[#070c16]/60 via-[#070c16]/70 to-[#070c16]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070c16]/50 via-transparent to-[#070c16]/50" />
            </div>

            {/* ── LAYOUT ── */}
            <div className="relative z-10">

                {/* ════ TOP HEADER ════════════════════════════════════ */}
                <div className="flex-shrink-0 px-3.5 sm:px-6 lg:px-10 pt-1.5 md:pt-4 pb-2.5 md:pb-5 border-b border-white/[0.05]">

                    {/* ── Mobile only ── */}
                    <div className="md:hidden">
                        {/* Backdrop-style poster on mobile */}
                        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-2.5" style={{ aspectRatio: "16/7.5" }}>
                            {(backdrop || data.poster_path) ? (
                                <Image
                                    src={backdrop ?? `https://image.tmdb.org/t/p/w780${data.poster_path}`}
                                    alt={title} fill className="object-cover object-top" priority
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-800/50 flex items-center justify-center">
                                    {type === "movie" ? <Film className="w-10 h-10 text-white/10" /> : <Tv className="w-10 h-10 text-white/10" />}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070c16] via-transparent to-transparent" />
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                                <BackButton />
                                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${type === "movie" ? "bg-amber-400/20 border-amber-400/30 text-amber-400" : "bg-emerald-400/20 border-emerald-400/30 text-emerald-400"}`}>
                                    {type === "movie" ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                                    {type === "movie" ? "Film" : "Dizi"}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap gap-1 items-center">
                                {(data.genres || []).slice(0, 3).map((g: any) => (
                                    <span key={g.id} className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-white/5 border-white/10 text-white/60">{g.name}</span>
                                ))}
                                {statusInfo && <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${statusInfo.cls}`}>{statusInfo.label}</span>}
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black tracking-tighter leading-tight text-white">{title}</h1>
                                {(data.original_title || data.original_name) && (data.original_title || data.original_name) !== title && (
                                    <p className="text-[11px] text-white/35 italic leading-none">{data.original_title || data.original_name}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /><span className="font-black text-amber-400">{data.vote_average?.toFixed(1)}</span><span className="text-[10px] text-white/35">/ 10</span></div>
                                {voteCount && <><span className="text-white/20">·</span><span className="text-[11px] text-white/45">{voteCount} oy</span></>}
                                <div className="flex items-center gap-1"><Globe className="w-3 h-3 text-sky-400" /><RatingDisplay userRating={userRating} friendsRatings={friendsRatings} mediaTitle={title} /></div>
                                {year && <><span className="text-white/20">·</span><span className="text-[11px] text-white/55 font-bold">{year}</span></>}
                                {runtimeFmt && <><span className="text-white/20">·</span><span className="text-[11px] text-white/55 font-bold">{runtimeFmt}</span></>}
                                {data.number_of_seasons && <><span className="text-white/20">·</span><span className="text-[11px] text-white/55 font-bold">{data.number_of_seasons} Sezon</span></>}
                            </div>
                            {data.overview && (
                                <p className="text-xs text-white/65 leading-relaxed line-clamp-2 border-l-2 border-amber-400/35 pl-2.5">{data.overview}</p>
                            )}
                            <div className="grid grid-cols-2 gap-1.5">
                                <TrailerButton videos={videos?.results || []} title={title} className="w-full py-2.5" />
                                <WatchProviders providers={activeProviders} isGlobal={isGlobal} isGuest={isGuest} countryCode={userCountry} mediaTitle={title} />
                            </div>
                            <div className="flex items-center w-full">
                                <MediaActions
                                    tmdbId={data.id}
                                    type={type as "movie" | "tv"}
                                    title={title}
                                    posterPath={data.poster_path}
                                    initialInWatchlist={inWatchlist}
                                    initialStatus={watchStatus}
                                    initialRating={userRating}
                                    initialRecommendation={activeRecommendation?.sender ? {
                                        id: activeRecommendation.sender.id,
                                        name: activeRecommendation.sender.name || "Bilinmiyor"
                                    } : undefined}
                                    isAuthenticated={isAuthenticated}
                                    isGuest={isGuest}
                                    variant="minimal"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Desktop (md+): poster left, info right ── */}
                    <div className="hidden md:flex md:items-start gap-6 lg:gap-8">
                        {/* Poster */}
                        <div className="flex-shrink-0 w-[200px] lg:w-[240px] xl:w-[280px]">
                            <div className="relative w-full rounded-xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/10" style={{ aspectRatio: "2/3" }}>
                                {data.poster_path ? (
                                    <ExpandableImage src={`https://image.tmdb.org/t/p/w780${data.poster_path}`} alt={title} priority />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800/50 flex items-center justify-center">
                                        {type === "movie" ? <Film className="w-8 h-8 text-white/10" /> : <Tv className="w-8 h-8 text-white/10" />}
                                    </div>
                                )}
                            </div>
                            {/* Trailer + Watch Providers — yan yana */}
                            <div className="mt-2 flex gap-2">
                                <TrailerButton videos={videos?.results || []} title={title} className="flex-1" />
                                <WatchProviders providers={activeProviders} isGlobal={isGlobal} isGuest={isGuest} countryCode={userCountry} mediaTitle={title} />
                            </div>
                        </div>

                        {/* Info column */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2.5">

                            {/* Row 1: Back + type badge */}
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/"
                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors group"
                                >
                                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                    Geri
                                </Link>
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                    type === "movie"
                                        ? "bg-amber-400/15 border-amber-400/25 text-amber-400"
                                        : "bg-emerald-400/15 border-emerald-400/25 text-emerald-400"
                                }`}>
                                    {type === "movie" ? <Film className="w-2.5 h-2.5" /> : <Tv className="w-2.5 h-2.5" />}
                                    {type === "movie" ? "Film" : "Dizi"}
                                </span>
                            </div>

                            {/* Row 2: Genres + status */}
                            <div className="flex flex-wrap gap-1.5 items-center">
                                {(data.genres || []).slice(0, 4).map((g: any) => (
                                    <span key={g.id} className="px-2.5 py-1 rounded-full text-xs font-black border bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:border-white/20 transition-colors">
                                        {g.name}
                                    </span>
                                ))}
                                {statusInfo && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${statusInfo.cls}`}>
                                        {statusInfo.label}
                                    </span>
                                )}
                            </div>

                            {/* Row 3: Title */}
                            <div>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter leading-none text-white">
                                    {title}
                                </h1>
                                {(data.original_title || data.original_name) && (data.original_title || data.original_name) !== title && (
                                    <p className="mt-1 text-sm text-white/40 font-medium italic">
                                        {data.original_title || data.original_name}
                                    </p>
                                )}
                            </div>

                            {/* Row 4: Score + meta inline */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="text-base font-black text-amber-400">{data.vote_average?.toFixed(1)}</span>
                                    <span className="text-xs text-white/40 font-medium">/ 10</span>
                                </div>
                                {voteCount && (
                                    <>
                                        <span className="text-white/25">·</span>
                                        <span className="text-xs text-white/50 font-semibold">{voteCount} oy</span>
                                    </>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                                    <RatingDisplay userRating={userRating} friendsRatings={friendsRatings} mediaTitle={title} />
                                </div>
                                {year && <><span className="text-white/25">·</span><span className="text-xs text-white/60 font-bold">{year}</span></>}
                                {runtimeFmt && <><span className="text-white/25">·</span><span className="text-xs text-white/60 font-bold">{runtimeFmt}</span></>}
                                {data.number_of_seasons && <><span className="text-white/25">·</span><span className="text-xs text-white/60 font-bold">{data.number_of_seasons} Sezon</span></>}
                                {(directors.length > 0 || creators.length > 0) && (
                                    <>
                                        <span className="text-white/25">·</span>
                                        {directors.slice(0, 1).map((p: any) => (
                                            <span key={p.id} className="text-xs text-white/60 font-bold">{p.name}</span>
                                        ))}
                                        {creators.slice(0, 1).map((p: any) => (
                                            <span key={p.id} className="text-xs text-white/60 font-bold">{p.name}</span>
                                        ))}
                                    </>
                                )}
                            </div>

                            {/* Row 5: Overview (2 lines max) */}
                            {data.overview && (
                                <p className="text-sm text-white/70 leading-relaxed max-w-3xl line-clamp-3 border-l-2 border-amber-400/40 pl-4">
                                    {data.overview}
                                </p>
                            )}

                            {/* Row 6: Actions only */}
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <MediaActions
                                    tmdbId={data.id}
                                    type={type as "movie" | "tv"}
                                    title={title}
                                    posterPath={data.poster_path}
                                    initialInWatchlist={inWatchlist}
                                    initialStatus={watchStatus}
                                    initialRating={userRating}
                                    initialRecommendation={activeRecommendation?.sender ? {
                                        id: activeRecommendation.sender.id,
                                        name: activeRecommendation.sender.name || "Bilinmiyor"
                                    } : undefined}
                                    isAuthenticated={isAuthenticated}
                                    isGuest={isGuest}
                                    variant="minimal"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════ BOTTOM: FULL-WIDTH TABS ════════════════════════ */}
                <div className="px-6 lg:px-10 pt-4 pb-10 bg-[#070c16]">
                    <DetailTabs
                        cast={credits?.cast || []}
                        seasons={data.seasons}
                        tmdbId={data.id}
                        type={type as "movie" | "tv"}
                        title={title}
                        posterPath={data.poster_path}
                        initialComments={comments}
                        initialRecommendations={recommendationsData || []}
                        watchedEpisodes={watchedEpisodes}
                        currentUserId={session?.user?.id}
                        director={directors?.[0]?.name || creators?.[0]?.name}
                        producer={directors?.[1]?.name || creators?.[1]?.name || data.production_companies?.[0]?.name}
                    />
                </div>
            </div>
        </div>
    );
}
