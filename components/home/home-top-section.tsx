import { tmdb } from "@/lib/tmdb";
import Link from "next/link";
import { Activity, ArrowRight, Rss } from "lucide-react";
import { FriendsActivity } from "./friends-activity";
import { HeroSlider } from "./hero-slider";

export async function HomeTopSection() {
    // Fetch diverse content for the slider
    const [trendingMovies, upcomingMovies, trendingTV, popularMovies] = await Promise.all([
        tmdb.getTrendingMovies(),
        tmdb.getUpcomingMovies(),
        tmdb.getTrendingTV(),
        tmdb.getPopular("movie")
    ]);

    // Prepare items with fallback to ensure we have data
    const items = [
        {
            ...trendingMovies.results[0],
            media_type: "movie",
            category: "trending"
        },
        {
            ...upcomingMovies.results[0],
            media_type: "movie",
            category: "upcoming"
        },
        {
            ...trendingTV.results[0],
            title: trendingTV.results[0].name, // Normalize TV name to title
            media_type: "tv",
            category: "tv"
        },
        // Use the 2nd popular movie to avoid duplication if it's the same as trending
        {
            ...popularMovies.results[1] || popularMovies.results[0],
            media_type: "movie",
            category: "popular"
        },
    ].filter(item => item && item.backdrop_path); // Filter out incomplete items

    return (
        <section className="flex flex-col lg:flex-row gap-4 w-full">
            {/* Left Column: Hero Slider */}
            <div className="lg:w-[60%] xl:w-[65%] relative group">
                <HeroSlider items={items} />
            </div>

            {/* Right Column: Friends Activity (Designed for Home Page) */}
            <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] flex-col h-full gap-4">
                {/* Unified Panel */}
                <div className="bg-[#1A202C]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-[500px] lg:h-full lg:max-h-[500px]">

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
                            <FriendsActivity compact={true} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
