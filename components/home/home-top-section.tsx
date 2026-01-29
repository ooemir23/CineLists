import { tmdb } from "@/lib/tmdb";
import Link from "next/link";
import { Activity } from "lucide-react";
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
        <section className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Left Column: Hero Slider */}
            <div className="lg:w-[60%] xl:w-[65%] relative group">
                <HeroSlider items={items} />
            </div>

            {/* Right Column: Friends Activity (Designed for Home Page) */}
            <div className="lg:w-[40%] xl:w-[35%] flex flex-col gap-6">
                <div className="flex items-center justify-center px-2">
                    <Link href="/feed" className="flex items-center gap-3 group/title cursor-pointer transition-transform hover:scale-105">
                        <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 group-hover/title:bg-primary group-hover/title:text-black transition-colors">
                            <Activity className="w-6 h-6 text-primary group-hover/title:text-black transition-colors" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight uppercase group-hover/title:text-primary transition-colors">Akış</h3>
                            <p className="text-xs text-neutral-500 font-bold tracking-tight group-hover/title:text-neutral-400">Arkadaşların neler izliyor?</p>
                        </div>
                    </Link>
                </div>

                {/* Integrated Vertical Friends Feed */}
                <div className="flex-1 bg-white/5 rounded-[40px] border border-white/10 p-6 backdrop-blur-sm overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#101624]/80 pointer-events-none z-10" />

                    <div className="space-y-6 max-h-[400px] md:max-h-[700px] lg:max-h-[380px] xl:max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                        <FriendsActivity compact={true} />
                    </div>
                </div>
            </div>
        </section>
    );
}
