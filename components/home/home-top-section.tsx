import { tmdb } from "@/lib/tmdb";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { FriendsActivity } from "./friends-activity";
import { HeroSlider } from "./hero-slider";
import {
    getWatchedShowsNextEpisodes,
    getFriendsViewingStats,
    getFollowedHighlights,
    getPlatformHighlights,
    getTodayHighlights,
    getContinueWatchingHighlights,
    getFriendsTrendingHighlights,
} from "@/lib/hero-personalization-actions";
import { UpcomingEpisodesCarousel } from "./carousels/upcoming-episodes-carousel";

export async function HomeTopSection({ personalizedResults }: { personalizedResults?: any[] }) {
    const session = await auth();

    // Fetch diverse content for the slider - use personalized data
    const [trendingMovies, upcomingMovies, trendingTV, popularMovies, upcomingEpisodes, friendStats, followedHighlights, platformHighlights, todayHighlights, continueHighlights, friendsTrendingHighlights, userPreferences] = await Promise.all([
        tmdb.getTrendingMovies(),
        tmdb.getUpcomingMovies(),
        tmdb.getTrendingTV(),
        tmdb.getPopular("movie"),
        getWatchedShowsNextEpisodes(),
        getFriendsViewingStats(),
        getFollowedHighlights(),
        getPlatformHighlights(),
        getTodayHighlights(),
        getContinueWatchingHighlights(),
        getFriendsTrendingHighlights(),
        (async () => {
            if (!session?.user?.id) return { favoriteGenres: [], platforms: [] };
            return prisma.user.findUnique({
                where: { id: session.user.id },
                select: { favoriteGenres: true, platforms: true },
            }) || { favoriteGenres: [], platforms: [] };
        })(),
    ]);

    // Build hero slider items with personalized content
    const trendingMovie = trendingMovies?.results?.[0];
    const upcomingMovie = upcomingMovies?.results?.[0];
    const trendingTv = trendingTV?.results?.[0];
    const popularMovie = popularMovies?.results?.[1] || popularMovies?.results?.[0];

    const trendingItems = [
        trendingMovie
            ? {
                ...trendingMovie,
                media_type: "movie",
                category: "trending"
            }
            : null,
        upcomingMovie
            ? {
                ...upcomingMovie,
                media_type: "movie",
                category: "upcoming"
            }
            : null,
        trendingTv
            ? {
                ...trendingTv,
                title: trendingTv.name || trendingTv.title,
                media_type: "tv",
                category: "tv"
            }
            : null,
        popularMovie
            ? {
                ...popularMovie,
                media_type: "movie",
                category: "popular"
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => !!item && !!item.backdrop_path);

    const personalizedItems = (personalizedResults || [])
        .slice(0, 3)
        .map(item => ({
            ...item,
            media_type: item.mediaType || "movie",
            category: "personalized",
            genreIds: item.genreIds || [],
        }))
        .filter(item => !!item.backdrop_path);

    const followedItems = (followedHighlights || []).map(item => ({
        id: item.tmdbId,
        title: item.title,
        overview: item.overview,
        backdrop_path: item.backdropPath,
        vote_average: item.voteAverage,
        media_type: item.mediaType,
        category: "followed" as const,
        eventLabel: item.eventLabel,
        genreIds: item.genreIds || [],
        metaLabel: item.metaLabel,
    }));

    const platformItems = (platformHighlights || []).map(item => ({
        id: item.tmdbId,
        title: item.title,
        overview: item.overview,
        backdrop_path: item.backdropPath,
        vote_average: item.voteAverage,
        media_type: item.mediaType,
        category: "followed" as const,
        eventLabel: item.eventLabel,
        genreIds: item.genreIds || [],
        metaLabel: item.metaLabel,
    }));

    const todayItems = (todayHighlights || []).map(item => ({
        id: item.tmdbId,
        title: item.title,
        overview: item.overview,
        backdrop_path: item.backdropPath,
        vote_average: item.voteAverage,
        media_type: item.mediaType,
        category: "followed" as const,
        eventLabel: item.eventLabel,
        genreIds: item.genreIds || [],
        metaLabel: item.metaLabel,
    }));

    const continueItems = (continueHighlights || []).map(item => ({
        id: item.tmdbId,
        title: item.title,
        overview: item.overview,
        backdrop_path: item.backdropPath,
        vote_average: item.voteAverage,
        media_type: item.mediaType,
        category: "followed" as const,
        eventLabel: item.eventLabel,
        genreIds: item.genreIds || [],
        metaLabel: item.metaLabel,
    }));

    const friendsTrendingItems = (friendsTrendingHighlights || []).map(item => ({
        id: item.tmdbId,
        title: item.title,
        overview: item.overview,
        backdrop_path: item.backdropPath,
        vote_average: item.voteAverage,
        media_type: item.mediaType,
        category: "followed" as const,
        eventLabel: item.eventLabel,
        genreIds: item.genreIds || [],
        metaLabel: item.metaLabel,
    }));

    const mergedItems = [
        ...followedItems,
        ...platformItems,
        ...todayItems,
        ...continueItems,
        ...friendsTrendingItems,
        ...personalizedItems,
        ...trendingItems,
    ];

    const priorityByEvent: Record<string, number> = {
        "Yeni Bolum": 1,
        "Bolum Yakinda": 2,
        "Bugun Yayinda": 3,
        "Vizyona Girdi": 4,
        "Platformunda Yeni": 5,
        "Platformda Yayinda": 6,
        "Devam Et": 7,
        "Arkadaslarinda Yukseldi": 8,
    };

    const priorityByCategory: Record<string, number> = {
        followed: 1,
        personalized: 2,
        trending: 3,
        upcoming: 4,
        tv: 5,
        popular: 6,
    };

    const preferredGenres = (userPreferences?.favoriteGenres || [])
        .map((g: string) => Number(g))
        .filter((g) => !Number.isNaN(g));
    const preferredGenreSet = new Set(preferredGenres);

    const deduped = Array.from(
        new Map(mergedItems.map((item) => [`${item.media_type}-${item.id}`, item])).values()
    );

    const computeBehaviorScore = (item: any) => {
        const genres = item.genreIds || [];
        const matching = genres.filter((id: number) => preferredGenreSet.has(id)).length;
        const genreScore = matching > 0 ? 30 + matching * 10 : 0;
        const typeScore = item.media_type === "tv" ? 6 : 0;
        return genreScore + typeScore;
    };

    const items = deduped
        .sort((a, b) => {
            const aEvent = a.eventLabel ? priorityByEvent[a.eventLabel] ?? 99 : 99;
            const bEvent = b.eventLabel ? priorityByEvent[b.eventLabel] ?? 99 : 99;
            if (aEvent !== bEvent) return aEvent - bEvent;

            const aBehavior = computeBehaviorScore(a);
            const bBehavior = computeBehaviorScore(b);
            if (aBehavior !== bBehavior) return bBehavior - aBehavior;

            const aCategory = priorityByCategory[a.category] ?? 99;
            const bCategory = priorityByCategory[b.category] ?? 99;
            if (aCategory !== bCategory) return aCategory - bCategory;


            return (b.vote_average || 0) - (a.vote_average || 0);
        })
        .slice(0, 10);
    const friendPopularIds = friendStats.map(item => item.tmdbId);

    return (
        <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch lg:h-[600px]">
            {/* Left Column: CTA (Row 1) & Hero Slider (Row 2) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                {/* Top Section: Upcoming Episodes or Auth CTA */}
                <div className="w-full">
                    {upcomingEpisodes.length > 0 ? (
                        <div className="relative z-20 backdrop-blur-sm bg-gradient-to-br from-[#0f1a2b]/80 via-[#0f1a2b]/60 to-[#0b1220]/70 rounded-[2.5rem] p-3 border border-white/10 shadow-lg">
                            <UpcomingEpisodesCarousel episodes={upcomingEpisodes} />
                        </div>
                    ) : !session ? (
                        <div className="relative z-20 backdrop-blur-sm bg-gradient-to-br from-[#0f1a2b]/80 via-[#0f1a2b]/60 to-[#0b1220]/70 rounded-[2.5rem] p-4 border border-white/10 shadow-lg overflow-hidden group">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-amber-400/10 transition-colors" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/5 blur-2xl rounded-full -ml-12 -mb-12 group-hover:bg-blue-400/10 transition-colors" />

                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex flex-col gap-1 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Kişisel Deneyimini Başlat</h3>
                                    </div>
                                    <p className="text-xs text-neutral-400 font-bold max-w-sm">
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

                {/* Hero Slider Section */}
                <div className="w-full flex-1 min-h-[400px] lg:min-h-0">
                    <HeroSlider items={items} friendPopularIds={friendPopularIds} />
                </div>
            </div>

            {/* Right Column: Friends Activity (Hidden on mobile) */}
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col overflow-hidden">
                {/* Unified Panel - Matches total height of left column */}
                <div className="bg-[#1A202C]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-full">
                    {/* Header - Compact */}
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

                    {/* Integrated Vertical Friends Feed - Scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-[#1A202C]/60 to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-t from-[#1A202C]/60 to-transparent z-10 pointer-events-none" />

                        <div className="p-3 space-y-3">
                            <FriendsActivity compact={true} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
