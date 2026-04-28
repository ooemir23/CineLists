import { tmdb } from "@/lib/tmdb";
import Link from "next/link";
import { Activity, ArrowRight, Rss } from "lucide-react";
import { FriendsActivity } from "./friends-activity";
import { HeroSlider } from "./hero-slider";

export async function HomeTopSection({ personalizedResults }: { personalizedResults?: any[] }) {
    // Fetch diverse content for the slider
    const [trendingMovies, upcomingMovies, trendingTV, popularMovies] = await Promise.all([
        tmdb.getTrendingMovies(),
        tmdb.getUpcomingMovies(),
        tmdb.getTrendingTV(),
        tmdb.getPopular("movie")
    ]);

    const trendingMovie = trendingMovies?.results?.[0];
    const upcomingMovie = upcomingMovies?.results?.[0];
    const trendingTv = trendingTV?.results?.[0];
    const popularMovie = popularMovies?.results?.[1] || popularMovies?.results?.[0];

    // Prepare items safely; TMDB can be unavailable in local env
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

    // Personalized items mapping
    const personalizedItems = (personalizedResults || [])
        .slice(0, 3)
        .map(item => ({
            ...item,
            media_type: item.mediaType || "movie", // Handle the field name from getPersonalizedRecommendations
            category: "personalized"
        }))
        .filter(item => !!item.backdrop_path);

    // Combine: Personalized first, then trending
    const items = [...personalizedItems, ...trendingItems].slice(0, 5);

    return (
        <section className="flex flex-col lg:flex-row lg:items-stretch gap-4 w-full">
            {/* Left Column: Hero Slider */}
            <div className="lg:w-[60%] xl:w-[65%] relative group">
                <HeroSlider items={items} />
            </div>

            {/* Right Column: Friends Activity (Designed for Home Page) */}
            <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] flex-col self-stretch h-full gap-4">
                {/* Unified Panel */}
                <div className="bg-[#1A202C]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col min-h-[500px] h-full">

                    {/* Header */}
                    <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                        <Link href="/feed" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                                <Rss className="w-5 h-5 text-primary group-hover:text-black transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight uppercase group-hover:text-primary transition-colors">Akış</h3>
                                <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">Arkadaşların</p>
                            </div>
                        </Link>

                        <Link
                            href="/feed"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all hover:scale-110"
                            title="Tümünü Gör"
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Integrated Vertical Friends Feed */}
                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#1A202C]/40 to-transparent z-10 pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#1A202C] to-transparent z-10 pointer-events-none" />

                        <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
                            <FriendsActivity compact={true} maxItems={3} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
