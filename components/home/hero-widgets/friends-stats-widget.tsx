"use client";

import { Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FriendStats } from "@/lib/hero-personalization-actions";

interface FriendsStatsWidgetProps {
    stats: FriendStats[];
}

export function FriendsStatsWidget({ stats }: FriendsStatsWidgetProps) {
    if (stats.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 rounded-2xl p-4 border border-emerald-500/20 hover:border-emerald-500/40 transition-all h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white truncate">Arkadaşların Favorileri</h3>
                    <p className="text-[10px] text-neutral-400 font-medium">Bu hafta</p>
                </div>
            </div>

            {/* Stats List */}
            <div className="flex-1 space-y-2 min-w-0">
                {stats.slice(0, 3).map((item, idx) => (
                    <Link
                        key={idx}
                        href={`/${item.mediaType}/${item.tmdbId}`}
                        className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {/* Mini Poster */}
                        {item.posterPath && (
                            <div className="relative w-10 h-14 flex-shrink-0 rounded-md overflow-hidden">
                                <Image
                                    src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
                                    alt={item.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform"
                                />
                            </div>
                        )}

                        {/* Title & Stats */}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                {item.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                    <TrendingUp size={12} />
                                    {item.watchedByCount} Kişi
                                </div>
                            </div>
                        </div>

                        {/* Rank Badge */}
                        <div className="text-[11px] font-black text-emerald-400 bg-emerald-500/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                        </div>
                    </Link>
                ))}
            </div>

            {/* View All */}
            <Link
                href="/friends"
                className="mt-3 pt-3 border-t border-white/10 text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-1 justify-center"
            >
                <Users size={10} />
                Arkadaşlarını Gör
            </Link>
        </div>
    );
}
