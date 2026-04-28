"use client";

import { useState } from "react";
import { ProfileHeader } from "./profile-header";
import { ProfileStats } from "./profile-stats";
import { ProfileActivity } from "./profile-activity";
import { FavoritePersons } from "./favorite-persons";
import { GenreTags } from "./genre-tags";
import { RecentMedia } from "./recent-media";
import { AchievementsBadges } from "./achievements-badges";
import { ActivityHeatmap } from "./activity-heatmap";
import { WatchCountries } from "./watch-countries";
import { PeriodStats } from "./period-stats";
import { CustomListsPreview } from "./custom-lists-preview";

interface PublicProfileShellProps {
  user: any;
  stats: { movieCount: number; showCount: number; episodeCount: number };
  recentMediaItems: any[];
  allGenres: { id: number; name: string }[];
  thisMonthCount: number;
  averageRating: number;
  watchedItems?: any[];
  watchlistItems?: any[];
  customLists?: any[];
  currentUserId?: string;
}

export function PublicProfileShell({
  user,
  stats,
  recentMediaItems,
  allGenres,
  thisMonthCount,
  averageRating,
  watchedItems = [],
  watchlistItems = [],
  customLists = [],
  currentUserId,
}: PublicProfileShellProps) {
  const totalHours = Math.round(stats.movieCount * 1.5 + stats.episodeCount * 0.75);

  return (
    <div className="w-full min-h-screen bg-neutral-950">
      {/* Public Profile Header - with Follow & Message buttons */}
      <ProfileHeader
        name={user.name}
        username={user.username}
        bio={user.bio}
        image={user.image}
        followedBy={user._count.followedBy}
        following={user._count.following}
        watchedCount={user._count.watched}
        isPrivate={user.isPrivate}
        isOwnProfile={false} // Always false for public profiles
      />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* Stats - Compact */}
        {user.showStats ? (
          <ProfileStats
            movieCount={stats.movieCount}
            showCount={stats.showCount}
            watchlistCount={user._count.toWatch}
            watchedCount={user._count.watched}
            showStats={true}
          />
        ) : (
          <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-xl p-4 text-center flex items-center justify-center gap-2">
            <p className="text-xs text-neutral-500 font-medium">İstatistikler gizlendi</p>
          </div>
        )}

        {/* Achievements */}
        <AchievementsBadges
          achievements={[]}
          movieCount={stats.movieCount}
          showCount={stats.showCount}
          watchedCount={user._count.watched}
          averageRating={averageRating}
        />

        {/* Activity Heatmap */}
        {user.showActivities && <ActivityHeatmap activities={user.activities} />}

        {/* Period Stats */}
        {user.showStats && (
          <PeriodStats activities={user.activities} watchedItems={watchedItems} />
        )}

        {/* Random Suggestion */}
        {user.showStats && watchlistItems.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-white tracking-tight uppercase">
              Watchlist'i Gözle
            </h2>
            <div className="text-xs text-neutral-500 font-medium">
              {watchlistItems.length} içerik
            </div>
          </section>
        )}

        {/* Watch Countries */}
        {user.showStats && <WatchCountries watchedItems={watchedItems} />}

        {/* Custom Lists */}
        <CustomListsPreview lists={customLists} />

        {/* Recent Watched - Poster Grid */}
        {user.showActivities && recentMediaItems.length > 0 && (
          <RecentMedia
            items={recentMediaItems}
            title="Son İzlenenler"
            viewAllHref={`/${user.username}/watched`}
            maxItems={6}
          />
        )}

        {/* Favorite Genres */}
        {user.favoriteGenres.length > 0 && user.showStats && (
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

        {/* Two Column: Activities & Persons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Recent Activities */}
          {user.showActivities && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                Son Aktiviteler
              </h2>
              <ProfileActivity
                activities={user.activities}
                showActivities={true}
                variant="list"
              />
            </section>
          )}

          {/* Favorite Persons */}
          {user.favoritePersons.length > 0 && user.showStats && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">
                Favori Oyuncular
              </h2>
              <FavoritePersons persons={user.favoritePersons} maxDisplay={6} variant="grid" />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
