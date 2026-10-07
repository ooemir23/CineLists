export interface UpcomingEpisode {
  showId: number;
  showTitle: string;
  nextEpisodeDate: string | null;
  nextEpisodeTitle?: string | null;
  nextEpisodeSeason?: number | null;
  nextEpisodeNumber?: number | null;
  platforms: string[];
  platformLogos?: { name: string; logoPath: string | null }[];
  posterPath: string | null;
  voteAverage: number;
  statusType?: "watching" | "plan_to_watch";
  addedAt?: Date;
  mediaType: "movie" | "tv";
  showStatus?: string;
  isTheatrical?: boolean;
  daysLeft?: number;
  daysLeftText?: string;
  favoritePeople?: string[];
  releaseKind?: "episode" | "premiere" | "theatrical";
}
