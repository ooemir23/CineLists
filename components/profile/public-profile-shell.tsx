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

import { FollowButton } from "@/components/social/follow-button";
import Link from "next/link";
import { Mail } from "lucide-react";

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

interface PublicProfileShellProps {
  user: UserData;
  stats: { movieCount: number; showCount: number; episodeCount: number };
  recentMediaItems: any[];
  allGenres: { id: number; name: string }[];
  thisMonthCount: number;
  averageRating: number;
  watchedItems?: any[];
  watchlistItems?: any[];
  customLists?: any[];
  isFollowing: boolean;
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
  isFollowing: initialIsFollowing,
  currentUserId,
}: PublicProfileShellProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const totalHours = Math.round(stats.movieCount * 1.5 + stats.episodeCount * 0.75);

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header with Follow/Message Buttons */}
      <div className="border-b border-white/5 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-white">
                {user.name || user.username}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400">@{user.username}</p>
            </div>

            {currentUserId && (
              <div className="flex gap-2">
                <FollowButton
                  targetUserId={user.id}
                  initialIsFollowing={isFollowing}
                  onFollowChange={setIsFollowing}
                />
                <Link
                  href={`/messages/${user.id}`}
                  className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mesaj</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Header */}
      <ProfileHeader
        name={user.name}
        username={user.username}
        bio={user.bio}
        image={user.image}
        followedBy={user._count.followedBy}
        following={user._count.following}
        watchedCount={user._count.watched}
        isPrivate={user.isPrivate}
        isOwnProfile={false}
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

        {/* Achievements */}
        <AchievementsBadges
          achievements={[]}
          movieCount={stats.movieCount}
          showCount={stats.showCount}
          watchedCount={user._count.watched}
          averageRating={averageRating}
        />

        {/* Period Stats */}
        {user.showStats && (
          <PeriodStats activities={user.activities} watchedItems={watchedItems} userId={user.id} />
        )}

        {/* Watch Countries */}
        {user.showStats && <WatchCountries watchedItems={watchedItems} />}

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

        {/* Recent Activities - Carousel */}
        {user.showActivities && (
          <section className="space-y-3">
            <Link
              href={`/profile/${user.id}/activities`}
              className="text-sm font-bold text-white tracking-tight uppercase hover:text-primary transition-colors inline-block"
            >
              Son Aktiviteler
            </Link>
            <ProfileActivity
              activities={user.activities}
              showActivities={user.showActivities}
              variant="carousel"
              userId={user.id}
            />
          </section>
        )}

        {/* Followed Content */}
        <RecentMedia
          items={watchlistItems.map((item: any) => ({
            id: item.media.id,
            title: item.media.title,
            posterPath: item.media.posterPath,
            rating: item.media.voteAverage || 0,
            type: item.media.type,
            watchedAt: item.addedAt,
          }))}
          title="Listesi"
          emptyMessage="Listesine eklenen bir içerik yok"
          viewAllHref="/watchlist"
          maxItems={6}
        />

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
  );
}
