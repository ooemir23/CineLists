import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { tmdb } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";
import { getToWatchStatus } from "@/lib/actions";
import { getWatchStatus } from "@/lib/activity-actions";
import { getWatchedEpisodes } from "@/lib/tv-actions";
import { MediaRow } from "@/components/media/media-row";
import { CastList } from "@/components/media/cast-list";
import { MediaActions } from "@/components/media/media-actions";
import { WatchProviders } from "@/components/media/watch-providers";
import { RatingDisplay } from "@/components/media/rating-display";
import SeasonList from "@/components/media/season-list";
import { CommentsSection } from "@/components/media/comments";
import { GenreList } from "@/components/media/genre-list";
import { getReceivedRecommendation } from "@/lib/recommendation-actions";
import { Star, Calendar, Clock, ArrowLeft, Play, Info, Tv } from "lucide-react";
import { ExpandableImage } from "@/components/ui/expandable-image";
import { TrailerButton } from "@/components/media/trailer-button";
import { Metadata } from "next";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { type, id } = await params;
    const data = await tmdb.getDetails(type as "movie" | "tv", id).catch(() => null);

    if (!data) return { title: "İçerik Bulunamadı" };

    const title = data.title || data.name;
    const description = data.overview || `${title} içeriği hakkında detaylar, puanlar ve yorumlar.`;
    const image = data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: image ? [{ url: image }] : [],
            type: "video.movie",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: image ? [image] : [],
        }
    };
}

type Props = {
    params: Promise<{
        type: string;
        id: string;
    }>;
};

export default async function DetailsPage(props: Props) {
    const params = await props.params;
    const { type, id } = params;
    const session = await auth();
    const isGuest = (session?.user as any)?.isGuest;

    if (type !== "movie" && type !== "tv") {
        notFound();
    }

    const [
        data,
        inWatchlist,
        watchStatus,
        watchedEpisodes,
        providersData,
        userRating,
        friendsRatings,
        activeRecommendation,
        dbMedia
    ] = await Promise.all([
        tmdb.getDetails(type as "movie" | "tv", id).catch(() => null),
        getToWatchStatus(parseInt(id)),
        getWatchStatus(parseInt(id)),
        type === "tv" ? getWatchedEpisodes(parseInt(id)) : Promise.resolve([]),
        tmdb.getWatchProviders(type as "movie" | "tv", id).catch(() => null),
        (async () => {
            const { getUserRating } = await import("@/lib/rating-actions");
            return getUserRating(parseInt(id), type as "movie" | "tv");
        })(),
        (async () => {
            const { getFriendsRatings } = await import("@/lib/rating-actions");
            return getFriendsRatings(parseInt(id), type as "movie" | "tv");
        })(),
        getReceivedRecommendation(parseInt(id)),
        prisma.mediaItem.findUnique({
            where: { tmdbId: parseInt(id) },
            include: {
                activities: {
                    where: { type: "REVIEWED" },
                    include: { user: true },
                    orderBy: { createdAt: "desc" }
                }
            }
        })
    ]) as [any, boolean, any, any, any, number | null, any[], any, any];

    if (!data) notFound();

    const comments = dbMedia?.activities.map((a: any) => ({
        id: a.id,
        content: a.review || "",
        createdAt: a.createdAt,
        user: { name: a.user.name, image: a.user.image }
    })) || [];

    let trProviders = providersData?.results?.TR || null;
    let isGlobal = false;

    if (!trProviders || (!trProviders.flatrate && !trProviders.buy)) {
        const otherCountries = Object.entries(providersData?.results || {}).find(
            ([key, value]: [string, any]) => value.flatrate || value.buy
        );
        if (otherCountries) {
            trProviders = otherCountries[1];
            isGlobal = true;
        }
    }

    const title = data.title || data.name;
    const releaseDate = data.release_date || data.first_air_date;
    const runtime = data.runtime || (data.episode_run_time && data.episode_run_time.length > 0 ? data.episode_run_time[0] : null);
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : "";

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-20">
            {/* Nav */}
            <div className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
                <Link href="/" className="pointer-events-auto p-2 bg-black/60 backdrop-blur-md rounded-full hover:bg-white/10 transition-colors border border-white/5">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
            </div>

            {/* Hero Section (TMDB Style) */}
            <div className="relative w-full overflow-hidden border-b border-white/5 min-h-[80vh] md:min-h-[600px] flex items-center py-12 md:py-20">
                {/* Backdrop Background */}
                {backdrop && (
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={backdrop}
                            alt=""
                            fill
                            className="object-cover object-top opacity-50"
                            priority
                        />
                        {/* TMDB-like Gradient Overlay - Balanced for visibility and readability */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(to right, rgba(10, 10, 10, 1) 20%, rgba(10, 10, 10, 0.7) 50%, rgba(10, 10, 10, 0.4) 100%)`
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                    </div>
                )}

                {/* Content Container */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full">
                    <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-center md:items-start text-center md:text-left">

                        {/* Poster Column */}
                        <div className="shrink-0 w-52 md:w-72 lg:w-80">
                            <div className="shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10 group/poster relative aspect-[2/3]">
                                {data.poster_path ? (
                                    <ExpandableImage
                                        src={`https://image.tmdb.org/t/p/w780${data.poster_path}`}
                                        alt={title}
                                        priority={true}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">Poster</div>
                                )}
                            </div>

                            <TrailerButton
                                videos={data.videos?.results || []}
                                title={title}
                            />
                        </div>

                        {/* Info Column */}
                        <div className="flex-1 space-y-8 pt-2">
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[1.1]">
                                    {title} <span className="text-neutral-500 font-light ml-2">({year})</span>
                                </h1>
                                {(data.original_title || data.original_name) && (data.original_title || data.original_name) !== title && (
                                    <p className="text-neutral-400 text-xl font-medium tracking-tight italic">
                                        {data.original_title || data.original_name}
                                    </p>
                                )}
                            </div>

                            {/* Meta Data Row */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-sm font-bold text-neutral-300">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-1.5">
                                        <Star size={16} className="text-amber-400 fill-amber-400" />
                                        <span className="text-lg text-white font-black">{data.vote_average.toFixed(1)}</span>
                                    </div>
                                    <div className="w-[1px] h-4 bg-white/20 mx-1" />
                                    <RatingDisplay
                                        userRating={userRating}
                                        friendsRatings={friendsRatings}
                                        mediaTitle={title}
                                    />
                                </div>

                                {runtime && (
                                    <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-neutral-500" />
                                        {Math.floor(runtime / 60) > 0
                                            ? `${Math.floor(runtime / 60)} sa ${runtime % 60} dk`
                                            : `${runtime} dk`}
                                    </span>
                                )}
                            </div>

                            {/* Feature Row (Platforms & Genres) */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <WatchProviders
                                    providers={trProviders}
                                    isGlobal={isGlobal}
                                    isGuest={isGuest}
                                />
                                <div className="hidden md:block w-1.5 h-1.5 bg-neutral-700 rounded-full" />
                                <GenreList genres={data.genres} type={type as "movie" | "tv"} />
                            </div>

                            {/* Actions Row */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
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
                                    isGuest={isGuest}
                                />
                            </div>

                            {/* Overview */}
                            <div className="max-w-3xl space-y-3">
                                <h3 className="text-lg font-black text-amber-500 uppercase tracking-widest italic opacity-80 underline decoration-amber-500/20 underline-offset-8 decoration-2">Özet</h3>
                                <p className="text-neutral-200 leading-relaxed text-lg font-medium drop-shadow-sm">
                                    {data.overview || "Özet bulunmuyor."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra Details Body */}
            <div className="max-w-7xl mx-auto px-6 md:px-10 mt-12 space-y-16">

                {/* Providers (Compact) */}

                {/* Seasons */}
                <SeasonList
                    tmdbId={data.id}
                    seasons={data.seasons}
                    watchedEpisodes={watchedEpisodes}
                />

                {/* Cast */}
                <section>
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <h3 className="text-2xl font-bold text-white">Oyuncular</h3>
                        <Link href={`/cast/${type}/${id}`} className="text-sm text-primary hover:text-primary/80 transition-colors">
                            Tümünü Gör
                        </Link>
                    </div>
                    {/* Assuming CastList handles its own scroll container, but we removed the header inside it */}
                    <div className="-mx-6 md:-mx-10 px-6 md:px-10">
                        <CastList cast={data.credits?.cast} />
                    </div>
                </section>

                {/* Additional Images Gallery */}
                {data.images?.backdrops?.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-2xl font-bold text-white">Görseller</h3>
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{data.images.backdrops.length} Resim</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 md:-mx-10 px-6 md:px-10 no-scrollbar custom-scrollbar">
                            {data.images.backdrops.slice(0, 10).map((img: any, idx: number) => (
                                <div key={idx} className="flex-none w-64 md:w-80 rounded-xl overflow-hidden shadow-lg hover:shadow-primary/10 transition-shadow">
                                    <ExpandableImage
                                        src={`https://image.tmdb.org/t/p/w780${img.file_path}`}
                                        alt={`${title} Görsel ${idx + 1}`}
                                        aspectRatio="video"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews & Ratings */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12" id="comments">
                    <div className="lg:col-span-3">
                        <CommentsSection
                            mediaId={data.id}
                            type={type as "movie" | "tv"}
                            initialComments={comments}
                            mediaTitle={title}
                            mediaPosterPath={data.poster_path}
                        />
                    </div>
                </div>

                {/* Recommendations */}
                {data.recommendations?.results?.length > 0 && (
                    <div className="pt-12 border-t border-white/5">
                        <MediaRow
                            title="Önerilenler"
                            items={data.recommendations.results}
                            type={type as "movie" | "tv"}
                        />
                    </div>
                )}
            </div>
        </div >
    );
}
