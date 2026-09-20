"use client";

import { ProfileUnifiedView, ProfileUserData } from "./profile-unified-view";

interface ProfileClientShellProps {
  user: ProfileUserData;
  stats: { movieCount: number; showCount: number; episodeCount: number };
  recentMediaItems: any[];
  allGenres: { id: number; name: string }[];
  thisMonthCount: number;
  averageRating: number;
  watchedItems?: any[];
  watchlistItems?: any[];
  coverBackdrops?: string[];
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
  coverBackdrops = [],
}: ProfileClientShellProps) {
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
      isOwnProfile={true}
      coverBackdrops={coverBackdrops}
    />
  );
}
