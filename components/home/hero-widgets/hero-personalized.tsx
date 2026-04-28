import { FavoriteActorsWidget } from "./favorite-actors-widget";
import { UpcomingEpisodesWidget } from "./upcoming-episodes-widget";
import { FriendsStatsWidget } from "./friends-stats-widget";
import { RecommendationsWidget } from "./recommendations-widget";
import type { UpcomingActorProject, UpcomingEpisode, FriendStats } from "@/lib/hero-personalization-actions";

interface HeroPersonalizedProps {
    favoriteActorProjects: UpcomingActorProject[];
    upcomingEpisodes: UpcomingEpisode[];
    friendStats: FriendStats[];
    personalizedRecommendations?: any[];
    userName?: string;
}

export async function HeroPersonalized({
    favoriteActorProjects,
    upcomingEpisodes,
    friendStats,
    personalizedRecommendations,
    userName
}: HeroPersonalizedProps) {
    // Check if we have any personalized data
    const hasPersonalizedData = 
        favoriteActorProjects.length > 0 || 
        upcomingEpisodes.length > 0 || 
        friendStats.length > 0 || 
        (personalizedRecommendations && personalizedRecommendations.length > 0);

    if (!hasPersonalizedData) {
        // Fallback to a simple greeting/onboarding message
        return (
            <div className="w-full h-[65svh] md:h-[500px] rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-[#1A202C]/60 to-[#0b1220]/60 flex items-center justify-center p-8 text-center backdrop-blur-sm">
                <div className="max-w-md space-y-4">
                    <h2 className="text-3xl md:text-4xl font-black text-white">Kişiye Özel Dashboard</h2>
                    <p className="text-sm text-neutral-300 font-medium">
                        Film ve dizileri izledikçe, sevdiğin oyuncular ve arkadaşlarının önerilerine göre kişiselleştirilmiş öneriler alacaksın.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-4">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-xs text-neutral-400">Verileri yüklemek için bizi izle...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            {/* Main Grid - Desktop: 2x2, Mobile: 1 column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[65svh] md:h-[500px]">
                {/* Top Left / Full - Recommendations or Favorites */}
                {(personalizedRecommendations && personalizedRecommendations.length > 0) || favoriteActorProjects.length > 0 ? (
                    <RecommendationsWidget
                        userName={userName}
                        personalized={personalizedRecommendations}
                    />
                ) : null}

                {/* Favorite Actors */}
                {favoriteActorProjects.length > 0 && (
                    <FavoriteActorsWidget projects={favoriteActorProjects} />
                )}

                {/* Upcoming Episodes */}
                {upcomingEpisodes.length > 0 && (
                    <UpcomingEpisodesWidget episodes={upcomingEpisodes} />
                )}

                {/* Friends Stats */}
                {friendStats.length > 0 && (
                    <FriendsStatsWidget stats={friendStats} />
                )}
            </div>
        </div>
    );
}
