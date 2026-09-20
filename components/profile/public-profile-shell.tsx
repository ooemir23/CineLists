"use client";

import { ProfileUnifiedView, ProfileUserData } from "./profile-unified-view";

interface PublicProfileShellProps {
  user: ProfileUserData;
  stats: { movieCount: number; showCount: number; episodeCount: number };
  recentMediaItems: any[];
  allGenres: { id: number; name: string }[];
  thisMonthCount: number;
  averageRating: number;
  watchedItems?: any[];
  watchlistItems?: any[];
  isFollowing: boolean;
  currentUserId?: string;
  coverBackdrops?: string[];
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
  isFollowing,
  currentUserId,
  coverBackdrops = [],
}: PublicProfileShellProps) {
  return (
    <ProfileUnifiedView
      user={user}
      stats={stats}
      recentMediaItems={recentMediaItems}
      allGenres={allGenres}
      thisMonthCount={thisMonthCount}
      averageRating={averageRating}
      watchedItems={watchedItems}
      watchlistItems={watchlistItems}
      isOwnProfile={false}
      isFollowing={isFollowing}
      currentUserId={currentUserId}
      coverBackdrops={coverBackdrops}
    />
  );
}
