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
import { Star, Calendar, Clock, Share2, MessageSquare, ArrowLeft, Play, Info, Tv } from "lucide-react";

type Props = {
    params: Promise<{
        type: string;
        id: string;
    }>;
};

export default async function DetailsPage(props: Props) {
    const params = await props.params;
    const { type, id } = params;

    if (type !== "movie" && type !== "tv") {
        notFound();
    }

    const [data, inWatchlist, watchStatus, watchedEpisodes, providersData, userRating, friendsRatings, dbMedia] = await Promise.all([
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
    ]);

    if (!data) notFound();

    const comments = dbMedia?.activities.map(a => ({
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

            {/* Top Banner (Backdrop) - Reduced Height, strictly background */}
            <div className="relative w-full h-[40vh] md:h-[50vh] bg-neutral-900 border-b border-white/5">
                {backdrop ? (
                    <>
                        <Image
                            src={backdrop}
                            alt=""
                            fill
                            className="object-cover opacity-30"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-700">
                        <p>Resim Yok</p>
                    </div>
                )}
            </div>

            {/* Main Content Container - Overlapping the banner slightly or just below */}
            <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-20 md:-mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">

                    {/* Poster Column */}
                    <div className="shrink-0 w-40 md:w-64 lg:w-80 mx-auto md:mx-0">
                        <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-neutral-800">
                            {data.poster_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w780${data.poster_path}`}
                                    alt={title}
                                    width={780}
                                    height={1170}
                                    className="object-cover w-full h-full"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-500">Poster</div>
                            )}
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 pt-4 md:pt-12 text-center md:text-left space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
                                {title}
                            </h1>
                            {(data.original_title || data.original_name) && (data.original_title || data.original_name) !== title && (
                                <p className="text-neutral-400 text-lg font-medium">
                                    {data.original_title || data.original_name}
                                </p>
                            )}
                        </div>

                        {/* Meta Data Row */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-neutral-300">
                            {year && (
                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md">
                                    {year}
                                </span>
                            )}
                            {runtime && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-neutral-500" />
                                    {Math.floor(runtime / 60) > 0
                                        ? `${Math.floor(runtime / 60)} sa ${runtime % 60} dk`
                                        : `${runtime} dk`}
                                </span>
                            )}
                            <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 px-3 py-1.5 rounded-xl shadow-lg group">
                                <span className="flex items-center justify-center w-5 h-5 bg-blue-500/10 rounded-md">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-blue-400">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line x1="2" y1="12" x2="22" y2="12"></line>
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                    </svg>
                                </span>
                                <span className="font-black text-white">{data.vote_average.toFixed(1)}</span>
                            </div>

                            <RatingDisplay
                                userRating={userRating}
                                friendsRatings={friendsRatings}
                                mediaTitle={title}
                            />

                            <RatingDisplay
                                userRating={userRating}
                                friendsRatings={friendsRatings}
                                mediaTitle={title}
                            />
                        </div>

                        {/* Feature Row (Platforms & Genres) */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <WatchProviders
                                providers={trProviders}
                                isGlobal={isGlobal}
                            />
                            <GenreList genres={data.genres} type={type as "movie" | "tv"} />
                        </div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 py-2">
                            <MediaActions
                                tmdbId={data.id}
                                type={type as "movie" | "tv"}
                                title={title}
                                posterPath={data.poster_path}
                                initialInWatchlist={inWatchlist}
                                initialStatus={watchStatus}
                                initialRating={userRating}
                            />

                            <Link
                                href="#comments"
                                className="flex items-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors text-sm font-bold border border-white/5"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Yorum
                            </Link>

                            <button className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors border border-white/5 text-neutral-400 hover:text-white">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Overview */}
                        <div className="max-w-3xl mx-auto md:mx-0">
                            <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-2">Özet</h3>
                            <p className="text-neutral-300 leading-relaxed text-base">
                                {data.overview || "Özet bulunmuyor."}
                            </p>
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
        </div>
    );
}
