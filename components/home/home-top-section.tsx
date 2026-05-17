import { auth } from "@/auth";
import { tmdb } from "@/lib/tmdb";
import { getWatchedShowsNextEpisodes } from "@/lib/hero-personalization-actions";
import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { HeroSlider } from "./hero-slider";
import { FriendsActivity } from "./friends-activity";
import { UpcomingEpisodesCarousel } from "./carousels/upcoming-episodes-carousel";

type PersonalizedResult = {
    mediaType?: "movie" | "tv";
    genreIds?: number[];
    backdrop_path?: string | null;
    [key: string]: unknown;
};

type HeroItem = {
    id: number;
    title: string;
    overview: string;
    backdrop_path: string | null;
    vote_average: number;
    media_type: "movie" | "tv";
    category: "trending" | "upcoming" | "tv" | "popular" | "personalized";
};

export async function HomeTopSection({ personalizedResults }: { personalizedResults?: PersonalizedResult[] }) {
    const session = await auth();

    const [trendingMovies, upcomingMovies, trendingTV, popularMovies, upcomingEpisodes] = await Promise.all([
        tmdb.getTrendingMovies(),
        tmdb.getUpcomingMovies(),
        tmdb.getTrendingTV(),
        tmdb.getPopular("movie"),
        getWatchedShowsNextEpisodes(),
    ]);

    const trendingMovie = trendingMovies?.results?.[0];
    const upcomingMovie = upcomingMovies?.results?.[0];
    const trendingTv = trendingTV?.results?.[0];
    const popularMovie = popularMovies?.results?.[1] || popularMovies?.results?.[0];

    const trendingItems: HeroItem[] = [
        trendingMovie
            ? {
                ...trendingMovie,
                media_type: "movie",
                category: "trending",
            }
            : null,
        upcomingMovie
            ? {
                ...upcomingMovie,
                media_type: "movie",
                category: "upcoming",
            }
            : null,
        trendingTv
            ? {
                ...trendingTv,
                title: trendingTv.name || trendingTv.title,
                media_type: "tv",
                category: "tv",
            }
            : null,
        popularMovie
            ? {
                ...popularMovie,
                media_type: "movie",
                category: "popular",
            }
            : null,
    ].filter((item): item is HeroItem => Boolean(item && item.backdrop_path));

    const personalizedItems: HeroItem[] = (personalizedResults || [])
        .slice(0, 3)
        .map((item) => ({
            ...item,
            title: (item.title as string) || (item.name as string) || "",
            overview: (item.overview as string) || "",
            backdrop_path: (item.backdrop_path as string | null) || null,
            vote_average: Number(item.vote_average || 0),
            media_type: item.mediaType || "movie",
            category: "personalized",
        }))
        .filter((item): item is HeroItem => Boolean(item.backdrop_path));

    const items = [...personalizedItems, ...trendingItems].slice(0, 6);

    return (
        <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 items-stretch lg:h-[600px]">
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 md:gap-4">
                <div className="w-full">
                    {upcomingEpisodes.length > 0 ? (
                        <div className="relative z-20 backdrop-blur-sm bg-gradient-to-br from-[#0f1a2b]/88 via-[#0f1a2b]/70 to-[#0b1220]/78 rounded-[1.75rem] md:rounded-[2.5rem] p-2.5 md:p-3 border border-white/10 shadow-lg">
                            <UpcomingEpisodesCarousel episodes={upcomingEpisodes} />
                        </div>
                    ) : !session ? (
                        <div className="relative z-20 backdrop-blur-sm bg-gradient-to-br from-[#0f1a2b]/88 via-[#0f1a2b]/70 to-[#0b1220]/78 rounded-[1.75rem] md:rounded-[2.5rem] p-3.5 md:p-4 border border-white/10 shadow-lg overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-400/10 transition-colors" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/5 blur-2xl rounded-full -ml-12 -mb-12 group-hover:bg-blue-400/10 transition-colors" />

                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
                                <div className="flex flex-col gap-1 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Kişisel Deneyimini Başlat</h3>
                                    </div>
                                    <p className="text-[11px] md:text-xs text-neutral-400 font-bold max-w-sm">
                                        İzlediğin dizileri takip etmek, sana özel öneriler almak ve arkadaşlarınla etkileşime geçmek için hemen katıl.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/login"
                                        className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider border border-white/10 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Giriş Yap
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/20"
                                    >
                                        Kayıt Ol
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="w-full flex-1 min-h-[350px] max-[380px]:min-h-[330px] sm:min-h-[410px] lg:min-h-0">
                    <HeroSlider items={items} friendPopularIds={[]} />
                </div>
            </div>

            <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col overflow-hidden">
                <div className="bg-[#1A202C]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full min-h-[520px]">
                    <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                        <Link href="/feed" className="flex items-center gap-2 group">
                            <div className="w-9 h-9 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                                <Rss className="w-4 h-4 text-primary group-hover:text-black transition-colors" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-black text-white tracking-tight uppercase group-hover:text-primary transition-colors leading-tight">Akış</h3>
                                <p className="text-[8px] text-neutral-500 font-bold tracking-widest uppercase leading-tight">Arkadaşların</p>
                            </div>
                        </Link>

                        <Link
                            href="/feed"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all hover:scale-110 flex-shrink-0"
                            title="Tümünü Gör"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative p-3">
                        <FriendsActivity compact maxItems={6} />
                    </div>
                </div>
            </div>
        </section>
    );
}
