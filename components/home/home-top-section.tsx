import { auth } from "@/auth";
import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { FriendsActivity } from "./friends-activity";
import { HeroPersonalized } from "./hero-widgets/hero-personalized";
import {
    getFavoriteActorsUpcoming,
    getWatchedShowsNextEpisodes,
    getFriendsViewingStats,
} from "@/lib/hero-personalization-actions";

export async function HomeTopSection({ personalizedResults }: { personalizedResults?: any[] }) {
    // Get user session for personalization
    const session = await auth();
    const userName = session?.user?.name || undefined;

    // Fetch personalized data in parallel
    const [favoriteActorProjects, upcomingEpisodes, friendStats] = await Promise.all([
        getFavoriteActorsUpcoming(),
        getWatchedShowsNextEpisodes(),
        getFriendsViewingStats(),
    ]);

    return (
        <section className="flex flex-col lg:flex-row lg:items-stretch gap-4 w-full">
            {/* Left Column: Hero Personalized Dashboard */}
            <div className="lg:w-[60%] xl:w-[65%] relative group">
                <HeroPersonalized
                    favoriteActorProjects={favoriteActorProjects}
                    upcomingEpisodes={upcomingEpisodes}
                    friendStats={friendStats}
                    personalizedRecommendations={personalizedResults}
                    userName={userName}
                />
            </div>

            {/* Right Column: Friends Activity (Designed for Home Page) */}
            <div className="hidden lg:flex lg:w-[40%] xl:w-[35%] flex-col self-stretch h-full gap-4">
                {/* Unified Panel */}
                <div className="bg-[#1A202C]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden flex flex-col h-[65svh] md:h-[500px]">

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
