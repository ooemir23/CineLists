"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import EpisodeItem from "./episode-item";
import { cn } from "@/lib/utils";

type Season = {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
};

type SeasonListProps = {
    tmdbId: number;
    seasons: Season[];
    watchedEpisodes: { s: number; e: number }[]; // Array of {s: season, e: episode}
};

export default function SeasonList({ tmdbId, seasons, watchedEpisodes }: SeasonListProps) {
    // Sort seasons (specials usually 0, put them last or first? TMDB returns sorted usually).
    // Filter out empty seasons if needed.
    const validSeasons = seasons.filter(s => s.episode_count > 0 && s.season_number > 0);

    // Auto-expand first season or the one with unwatched episodes?
    // Start with first season expanded.
    const [expandedSeason, setExpandedSeason] = useState<number | null>(validSeasons[0]?.season_number || null);

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Sezonlar</h2>
            {validSeasons.map((season) => (
                <div key={season.id} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                    <button
                        onClick={() => setExpandedSeason(expandedSeason === season.season_number ? null : season.season_number)}
                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="text-left">
                            <h3 className="font-bold text-white text-lg">{season.name}</h3>
                            <p className="text-sm text-neutral-400">{season.episode_count} Bölüm</p>
                        </div>
                        {expandedSeason === season.season_number ? <ChevronUp /> : <ChevronDown />}
                    </button>

                    {expandedSeason === season.season_number && (
                        <div className="border-t border-white/10">
                            <SeasonEpisodes
                                tmdbId={tmdbId}
                                seasonNumber={season.season_number}
                                watchedEpisodes={watchedEpisodes.filter(w => w.s === season.season_number).map(w => w.e)}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// Sub-component to fetch and display episodes
import { useEffect, useState as useEState } from 'react';
import { Loader2 } from "lucide-react";
import { tmdb } from "@/lib/tmdb"; // Wait, tmdb lib is server-side mostly due to API key security? 
// Actually tmdb.ts uses env var, which is not exposed to client unless NEXT_PUBLIC.
// We should use a server action to fetch episodes or existing wrapper if compatible.
// But standard fetch in Client Comp needs API route or Server Action.
// Let's create a Server Action or Route. 
// OR simpler: Render episodes on server? 
// If we render all episodes for all seasons, page becomes huge.
// Better: Fetch on expand.
// Since we are in a client component, we need to call an API.
// Let's update `lib/tmdb.ts` to be server-only (which it is) and create a server action wrapper in `lib/actions.ts` or similar.
// Or just creating a new file `components/media/season-episodes.tsx` that is a SERVER COMPONENT?
// No, Suspense can't be triggered by click easily without navigation.
// Let's use a Server Action to fetch season details.

// We will implement `fetchSeason` in a server action file.
import { fetchSeasonEpisodes } from "@/lib/client-actions"; // We'll create this.

function SeasonEpisodes({ tmdbId, seasonNumber, watchedEpisodes }: { tmdbId: number, seasonNumber: number, watchedEpisodes: number[] }) {
    const [episodes, setEpisodes] = useEState<any[]>([]);
    const [loading, setLoading] = useEState(true);

    useEffect(() => {
        fetchSeasonEpisodes(tmdbId, seasonNumber).then(data => {
            setEpisodes(data.episodes || []);
            setLoading(false);
        });
    }, [tmdbId, seasonNumber]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="divide-y divide-white/5">
            {episodes.map((episode: any) => (
                <EpisodeItem
                    key={episode.id}
                    tmdbId={tmdbId}
                    seasonNumber={seasonNumber}
                    episode={episode}
                    isWatched={watchedEpisodes.includes(episode.episode_number)}
                />
            ))}
        </div>
    );
}
