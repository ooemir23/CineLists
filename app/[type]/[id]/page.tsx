import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { tmdb } from "@/lib/tmdb";
import { getWatchlistStatus } from "@/lib/actions";
import { getWatchStatus } from "@/lib/activity-actions";
import { getWatchedEpisodes } from "@/lib/tv-actions";
import { MediaRow } from "@/components/media/media-row";
import { CastList } from "@/components/media/cast-list";
import { MediaActions } from "@/components/media/media-actions";
import SeasonList from "@/components/media/season-list";
import { Star, Calendar, Clock, Share2, MessageSquare } from "lucide-react";

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

    const [data, inWatchlist, watchStatus, watchedEpisodes] = await Promise.all([
        tmdb.getDetails(type as "movie" | "tv", id).catch(() => null),
        getWatchlistStatus(parseInt(id)),
        getWatchStatus(parseInt(id)),
        type === "tv" ? getWatchedEpisodes(parseInt(id)) : Promise.resolve([])
    ]);

    if (!data) notFound();

    const title = data.title || data.name;
    const releaseDate = data.release_date || data.first_air_date;
    const runtime = data.runtime || (data.episode_run_time ? data.episode_run_time[0] : null);
    const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero / Backdrop */}
            <div className="relative h-[60vh] md:h-[70vh] w-full">
                {backdrop ? (
                    <Image
                        src={backdrop}
                        alt={title}
                        fill
                        className="object-cover opacity-60"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-neutral-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full px-6 md:px-10 pb-10">
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                        {/* Poster for Desktop */}
                        <div className="hidden md:block w-64 aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 shrink-0">
                            {data.poster_path && (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                                    alt={title}
                                    fill
                                    className="object-cover"
                                />
                            )}
                        </div>

                        <div className="flex-1 space-y-4">
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl">
                                {title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-neutral-300">
                                <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded-md">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span>{data.vote_average.toFixed(1)}</span>
                                </div>
                                {releaseDate && (
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{new Date(releaseDate).getFullYear()}</span>
                                    </div>
                                )}
                                {runtime && (
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{runtime} dk</span>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    {data.genres?.map((g: any) => (
                                        <span key={g.id} className="px-2 py-1 bg-white/10 rounded-md text-xs backdrop-blur-md">
                                            {g.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <p className="text-neutral-300 text-lg leading-relaxed max-w-3xl line-clamp-4 md:line-clamp-none">
                                {data.overview}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-4">
                                <MediaActions
                                    tmdbId={data.id}
                                    type={type as "movie" | "tv"}
                                    title={title}
                                    posterPath={data.poster_path}
                                    initialInWatchlist={inWatchlist}
                                    initialStatus={watchStatus}
                                />
                                <button className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/5">
                                    <MessageSquare className="w-5 h-5" />
                                    Yorum Yap
                                </button>
                                <button className="px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-10 mt-10 space-y-12">
                {/* TV Seasons */}
                {type === "tv" && data.seasons && (
                    <SeasonList
                        tmdbId={data.id}
                        seasons={data.seasons}
                        watchedEpisodes={watchedEpisodes}
                    />
                )}

                <CastList cast={data.credits?.cast} />

                {data.recommendations?.results?.length > 0 && (
                    <MediaRow
                        title="Önerilenler"
                        items={data.recommendations.results}
                        type={type as "movie" | "tv"}
                    />
                )}

                {data.similar?.results?.length > 0 && (
                    <MediaRow
                        title="Benzer İçerikler"
                        items={data.similar.results}
                        type={type as "movie" | "tv"}
                    />
                )}
            </div>
        </div>
    );
}
