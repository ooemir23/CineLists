"use client";

import { useState } from "react";
import { ProfileHeader } from "./profile-header";
import { ProfileStats } from "./profile-stats";
import { ProfileActivity } from "./profile-activity";
import { FavoritePersons } from "./favorite-persons";
import { GenreTags } from "./genre-tags";
import { RecentMedia } from "./recent-media";
import { ProfileCompletion } from "./profile-completion";
import { InsightsCard } from "./insights-card";
import { SettingsModal } from "./settings-modal";
import { AchievementsBadges } from "./achievements-badges";
import { ActivityHeatmap } from "./activity-heatmap";
import { WatchCountries } from "./watch-countries";
import { PeriodStats } from "./period-stats";
import Link from "next/link";


type UserData = {
    id: string;
    name: string | null;
    username: string;
    email: string | null;
    image: string | null;
    bio: string | null;
    isPrivate: boolean;
    showActivities: boolean;
    showStats: boolean;
    favoriteGenres: string[];
    platforms: string[];
    allGenres: { id: number; name: string }[];
    favoritePersons: any[];
    activities: any[];
    _count: {
        followedBy: number;
        following: number;
        toWatch: number;
        watched: number;
    };
};

interface ProfileClientShellProps {
    user: UserData;
    stats: { movieCount: number; showCount: number; episodeCount: number };
    recentMediaItems: any[];
    allGenres: { id: number; name: string }[];
    thisMonthCount: number;
    averageRating: number;
    watchedItems?: any[];
    watchlistItems?: any[];
    customLists?: any[];
}

export function ProfileClientShell({
    user,
    stats,
    recentMediaItems,
    allGenres,
    thisMonthCount,
    averageRating,
    watchedItems = [],
    watchlistItems = [],
    customLists = [],
}: ProfileClientShellProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const totalHours = Math.round((stats.movieCount * 1.5) + (stats.episodeCount * 0.75));

    return (
        <div className="w-full min-h-screen bg-background">
            {/* Compact Header - No Cover */}
            <ProfileHeader
                name={user.name}
                username={user.username}
                bio={user.bio}
                image={user.image}
                followedBy={user._count.followedBy}
                following={user._count.following}
                watchedCount={user._count.watched}
                isPrivate={user.isPrivate}
                isOwnProfile={true}
                onSettingsClick={() => setIsSettingsOpen(true)}
            />

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
                {/* Stats - Compact */}
                <ProfileStats
                    movieCount={stats.movieCount}
                    showCount={stats.showCount}
                    watchlistCount={user._count.toWatch}
                    watchedCount={user._count.watched}
                    showStats={user.showStats}
                />

                {/* Profile Completion */}
                <ProfileCompletion
                    hasAvatar={!!user.image}
                    hasBio={!!user.bio && user.bio.length > 5}
                    hasFavoriteGenres={user.favoriteGenres.length > 0}
                    hasFavoritePersons={user.favoritePersons.length > 0}
                    hasWatchedItems={user._count.watched > 0}
                    onEditProfile={() => setIsSettingsOpen(true)}
                />

                {/* Insights */}
                <InsightsCard
                    totalHours={totalHours}
                    streakDays={0}
                    averageRating={averageRating}
                    thisMonthCount={thisMonthCount}
                    userId={user.id}
                />

                {/* Favorite Genres */}
                {user.favoriteGenres.length > 0 && (
                    <section className="space-y-3">
                        <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                            Favori Türler
                        </h2>
                        <GenreTags
                            genres={allGenres}
                            favoriteGenreIds={user.favoriteGenres}
                            maxDisplay={10}
                        />
                    </section>
                )}

                {/* Achievements */}
                <AchievementsBadges
                    achievements={[]}
                    movieCount={stats.movieCount}
                    showCount={stats.showCount}
                    watchedCount={user._count.watched}
                    averageRating={averageRating}
                />

                {/* Period Stats */}
                <PeriodStats activities={user.activities} watchedItems={watchedItems} userId={user.id} />

                {/* Watch Countries */}
                <WatchCountries watchedItems={watchedItems} />

                {/* Two Column: Activities & Persons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {/* Recent Activities */}
                    <section className="space-y-3">
                        <Link
                            href="/profile/activities"
                            className="text-sm font-bold text-white tracking-tight uppercase hover:text-primary transition-colors inline-block"
                        >
                            Son Aktiviteler
                        </Link>
                        <ProfileActivity
                            activities={user.activities}
                            showActivities={user.showActivities}
                            variant="list"
                            userId={user.id}
                        />
                    </section>

                    {/* Favorite Persons */}
                    <section className="space-y-3">
                        <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                            Favori Oyuncular
                        </h2>
                        <FavoritePersons
                            persons={user.favoritePersons}
                            maxDisplay={6}
                            variant="grid"
                        />
                    </section>
                </div>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <SettingsModal user={user as any} onClose={() => setIsSettingsOpen(false)} />
            )}
        </div>
    );
}
