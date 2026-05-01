"use client";

import { useState } from "react";
import { Users, Layers, Image as ImageIcon, MessageSquare, Compass, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { CastList } from "@/components/media/cast-list";
import { CommentsSection } from "@/components/media/comments";
import { ExpandableImage } from "@/components/ui/expandable-image";
import SeasonList from "@/components/media/season-list";
import Link from "next/link";

type Tab = "cast" | "seasons" | "images" | "comments" | "similar";

interface DetailTabsProps {
    cast: any[];
    seasons?: any[];
    tmdbId: number;
    type: "movie" | "tv";
    images: any[];
    title: string;
    posterPath: string | null;
    initialComments: any[];
    recommendations: any[];
    watchedEpisodes: any[];
}

const TABS: { id: Tab; label: string; icon: any; condition?: boolean }[] = [
    { id: "cast", label: "Oyuncular", icon: Users },
    { id: "seasons", label: "Sezonlar", icon: Layers },
    { id: "images", label: "Görseller", icon: ImageIcon },
    { id: "comments", label: "Yorumlar", icon: MessageSquare },
    { id: "similar", label: "Benzer", icon: Compass },
];

export function DetailTabs({
    cast,
    seasons,
    tmdbId,
    type,
    images,
    title,
    posterPath,
    initialComments,
    recommendations,
    watchedEpisodes,
}: DetailTabsProps) {
    const activeTabs = TABS.filter(t => {
        if (t.id === "seasons") return type === "tv" && seasons && seasons.length > 0;
        if (t.id === "images") return images && images.length > 0;
        if (t.id === "similar") return recommendations && recommendations.length > 0;
        return true;
    });

    const [active, setActive] = useState<Tab>(activeTabs[0]?.id ?? "cast");
    const [showAllCast, setShowAllCast] = useState(false);

    return (
        <div className="flex flex-col h-full">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/8 flex-shrink-0 overflow-x-auto no-scrollbar">
                {activeTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = active === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActive(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0",
                                isActive
                                    ? "bg-amber-400 text-slate-950 shadow-[0_4px_20px_rgba(251,191,36,0.25)]"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content - natural scroll */}
            <div className="mt-4 pb-2">
                {active === "cast" && (
                    <div>
                        <div className="flex gap-3 flex-wrap">
                            {(cast || []).slice(0, showAllCast ? 40 : 5).map((person: any) => (
                                <Link
                                    key={person.id}
                                    href={`/person/${person.id}`}
                                    className="group flex flex-col w-[90px] sm:w-[140px] flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-white/[0.04] border border-white/8 hover:border-amber-400/30 hover:bg-white/[0.07] transition-all"
                                >
                                    {/* Full photo */}
                                    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "2/3" }}>
                                        {person.profile_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w342${person.profile_path}`}
                                                alt={person.name}
                                                className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-800/80 flex flex-col items-center justify-center gap-2">
                                                <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-white/5 flex items-center justify-center text-lg sm:text-2xl font-black text-white/25">
                                                    {person.name?.[0]}
                                                </div>
                                            </div>
                                        )}
                                        {/* Bottom gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    {/* Info */}
                                    <div className="px-2 sm:px-3 py-1.5 sm:py-2.5">
                                        <p className="text-[10px] sm:text-xs font-black text-white/90 leading-tight mb-0.5 line-clamp-1 group-hover:text-amber-400 transition-colors">{person.name}</p>
                                        <p className="text-[9px] sm:text-[11px] text-white/35 font-medium leading-tight line-clamp-1">{person.character}</p>
                                    </div>
                                </Link>
                            ))}

                            {/* Daha fazla butonu */}
                            {(cast || []).length > 5 && (
                                <button
                                    onClick={() => setShowAllCast(p => !p)}
                                    className="flex-shrink-0 w-[90px] sm:w-[140px] flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-xl sm:rounded-2xl border border-dashed border-white/12 text-white/30 hover:text-white/60 hover:border-white/25 transition-all self-stretch min-h-[60px] sm:min-h-[80px]"
                                >
                                    {showAllCast ? (
                                        <>
                                            <span className="text-sm sm:text-lg">↑</span>
                                            <span className="text-[10px] sm:text-xs font-black">Daha az</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xl sm:text-2xl font-black">+{(cast || []).length - 5}</span>
                                            <span className="text-[10px] sm:text-xs font-black">oyuncu</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {active === "seasons" && (
                    <SeasonList
                        tmdbId={tmdbId}
                        seasons={seasons || []}
                        watchedEpisodes={watchedEpisodes}
                    />
                )}

                {active === "images" && (
                    <div className="grid grid-cols-2 gap-3">
                        {images.slice(0, 12).map((img: any, idx: number) => (
                            <div
                                key={idx}
                                className="rounded-xl overflow-hidden ring-1 ring-white/8 hover:ring-white/20 transition-all hover:scale-[1.02]"
                            >
                                <ExpandableImage
                                    src={`https://image.tmdb.org/t/p/w780${img.file_path}`}
                                    alt={`${title} Görsel ${idx + 1}`}
                                    aspectRatio="video"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {active === "comments" && (
                    <CommentsSection
                        mediaId={tmdbId}
                        type={type}
                        initialComments={initialComments}
                        mediaTitle={title}
                        mediaPosterPath={posterPath}
                    />
                )}

                {active === "similar" && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                        {recommendations.slice(0, 18).map((item: any) => {
                            const itemType = (item.media_type === "tv" || item.media_type === "movie") ? item.media_type : type;
                            const itemTitle = item.title || item.name || "Bilinmiyor";
                            return (
                                <Link
                                    key={item.id}
                                    href={`/${itemType}/${item.id}`}
                                    className="group flex flex-col gap-1.5"
                                >
                                    <div className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-amber-400/40 transition-all group-hover:scale-[1.03]" style={{ aspectRatio: "2/3" }}>
                                        {item.poster_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                                                alt={itemTitle}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-800/60 flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-white/10" />
                                            </div>
                                        )}
                                        {item.vote_average > 0 && (
                                            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm">
                                                <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                                <span className="text-[10px] font-black text-amber-400">{item.vote_average.toFixed(1)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-bold text-white/70 leading-tight line-clamp-2 group-hover:text-white transition-colors px-0.5">{itemTitle}</p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
