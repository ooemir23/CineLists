"use client";

import Image from "next/image";
import { Trophy, Medal, Film, Tv } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
// framer-motion removed — list item animations replaced with CSS animate-in utilities

type LeaderboardProps = {
    data: {
        user: { id: string; name: string | null; image: string | null };
        movies: number;
        episodes: number;
        score: number;
    }[];
    currentUserId?: string;
};

export default function Leaderboard({ data, currentUserId }: LeaderboardProps) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-white">Liderlik Tablosu</h2>
            </div>

            <div className="space-y-4">
                {data.map((item, index) => (
                    <div
                        key={item.user.id}
                        className={cn(
                            "flex items-center gap-4 p-3 rounded-xl transition-all animate-in fade-in slide-in-from-left-4 duration-300",
                            item.user.id === currentUserId ? "bg-primary/20 ring-1 ring-primary/50" : "hover:bg-white/5"
                        )}
                        style={{ animationDelay: `${index * 80}ms` }}
                    >
                        <div className="w-8 flex justify-center font-bold text-lg text-neutral-500">
                            {index === 0 ? <span className="text-2xl">🥇</span> :
                                index === 1 ? <span className="text-2xl">🥈</span> :
                                    index === 2 ? <span className="text-2xl">🥉</span> :
                                        index + 1}
                        </div>

                        <Link href={`/profile/${item.user.id}`} className="shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 relative">
                                {item.user.image ? (
                                    <Image src={item.user.image} alt={item.user.name || "User"} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">👤</div>
                                )}
                            </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                                <Link href={`/profile/${item.user.id}`} className="font-bold text-white truncate hover:text-primary transition-colors">
                                    {item.user.name}
                                </Link>
                                <span className="font-mono font-bold text-yellow-500">{item.score} Puan</span>
                            </div>
                            <div className="flex gap-4 text-xs text-neutral-400 mt-1">
                                <span className="flex items-center gap-1"><Film className="w-3 h-3" /> {item.movies} Film</span>
                                <span className="flex items-center gap-1"><Tv className="w-3 h-3" /> {item.episodes} Bölüm</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-center text-neutral-600 mt-4">* 1 Film = 3 Puan, 1 Bölüm = 1 Puan</p>
        </div>
    );
}
