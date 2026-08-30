"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CastMember = {
    id: number;
    name: string;
    character?: string | null;
    profile_path?: string | null;
};

type CastListProps = {
    cast: CastMember[];
};

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

export function CastList({ cast }: CastListProps) {
    const [showAll, setShowAll] = useState(false);
    
    if (!cast || cast.length === 0) return null;

    // On desktop we have 9 columns in the row (lg:grid-cols-9)
    const desktopLimit = 9;
    const hasMore = cast.length > desktopLimit;
    // When there are more items, show (desktopLimit - 1) actors so the "DAHA FAZLA" button takes the 9th slot
    const initialItems = hasMore ? cast.slice(0, desktopLimit - 1) : cast;

    const ActorCard = ({ person }: { person: CastMember }) => (
        <Link
            key={person.id}
            href={`/person/${person.id}`}
            className="flex flex-col items-center text-center group/item animate-in fade-in zoom-in-95 duration-500"
        >
            <div className="relative w-full aspect-[2/3] mb-1.5 md:mb-3 overflow-hidden rounded-xl md:rounded-2xl ring-1 md:ring-2 ring-white/10 bg-neutral-900 group-hover/item:ring-amber-400 transition-all shadow-md group-hover/item:shadow-amber-400/20">
                {person.profile_path ? (
                    <Image
                        src={`${IMAGE_BASE_URL}${person.profile_path}`}
                        alt={person.name}
                        fill
                        className="object-cover group-hover/item:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 72px, 112px"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
                        <Users size={20} className="md:w-8 md:h-8 opacity-20" />
                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter mt-0.5 opacity-40">Yok</span>
                    </div>
                )}
            </div>
            <div className="space-y-0.5 md:space-y-1.5 px-0.5 w-full">
                <p className="text-[11px] sm:text-xs md:text-sm font-black text-white leading-tight group-hover/item:text-amber-400 transition-colors uppercase tracking-tight line-clamp-1">
                    {person.name}
                </p>
                <p className="text-[9px] sm:text-[10px] md:text-[11px] font-medium text-neutral-400 leading-tight italic line-clamp-1 opacity-90">
                    {person.character}
                </p>
            </div>
        </Link>
    );

    return (
        <div className="w-full">
            <div className="grid grid-cols-3 min-[400px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-x-2 gap-y-3.5 md:gap-y-8">
                {/* Initial Row or Full Grid */}
                {(showAll ? cast : initialItems).map((person) => (
                    <ActorCard key={person.id} person={person} />
                ))}

                {/* THE "MORE" BUTTON CARD - Positioned as the last item of the first row if not expanded */}
                {hasMore && !showAll && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="flex flex-col items-center text-center group/more animate-in fade-in zoom-in-95 duration-500"
                    >
                        <div className="relative w-full aspect-[2/3] mb-1.5 md:mb-3 overflow-hidden rounded-xl md:rounded-2xl ring-1 md:ring-2 ring-white/5 bg-white/[0.03] group-hover/more:bg-amber-400 group-hover/more:ring-amber-400 transition-all shadow-md flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1 group-hover/more:scale-110 transition-transform text-neutral-500 group-hover:text-slate-950">
                                <ChevronDown size={20} strokeWidth={3} className="md:w-8 md:h-8 group-hover/more:animate-bounce" />
                            </div>
                        </div>
                        <div className="space-y-0.5 md:space-y-1.5 px-0.5">
                            <p className="text-[11px] sm:text-xs md:text-sm font-black text-white group-hover/more:text-amber-400 uppercase tracking-tight">
                                DAHA FAZLA
                            </p>
                            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                +{cast.length - initialItems.length} OYUNCU
                            </p>
                        </div>
                    </button>
                )}
            </div>

            {/* "Collapse" button at the very bottom if expanded */}
            {showAll && (
                <div className="flex justify-center mt-12">
                    <button
                        onClick={() => setShowAll(false)}
                        className="flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5"
                    >
                        LİSTEYİ DARALT
                    </button>
                </div>
            )}
        </div>
    );
}
