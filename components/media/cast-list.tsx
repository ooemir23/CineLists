"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type CastMember = {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
};

type CastListProps = {
    cast: CastMember[];
};

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w185";

export function CastList({ cast }: CastListProps) {
    const [showAll, setShowAll] = useState(false);
    
    if (!cast || cast.length === 0) return null;

    // We want about 9 or 10 items in the first row on desktop
    const desktopLimit = 9;
    const initialItems = cast.slice(0, desktopLimit);
    const hasMore = cast.length > desktopLimit;

    const ActorCard = ({ person }: { person: CastMember }) => (
        <Link
            key={person.id}
            href={`/person/${person.id}`}
            className="flex flex-col items-center text-center group/item animate-in fade-in zoom-in-95 duration-500"
        >
            <div className="relative w-full aspect-[2/3] mb-4 overflow-hidden rounded-2xl ring-2 ring-white/10 bg-neutral-900 group-hover/item:ring-amber-400 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover/item:shadow-amber-400/20">
                {person.profile_path ? (
                    <Image
                        src={`${IMAGE_BASE_URL}${person.profile_path}`}
                        alt={person.name}
                        fill
                        className="object-cover group-hover/item:scale-110 transition-transform duration-700"
                        sizes="(max-width: 640px) 96px, 112px"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
                        <Users size={32} strokeWidth={1} className="opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-tighter mt-1 opacity-40">Yok</span>
                    </div>
                )}
            </div>
            <div className="space-y-1.5 px-2">
                <p className="text-sm font-black text-white leading-tight group-hover/item:text-amber-400 transition-colors uppercase tracking-tight line-clamp-1">
                    {person.name}
                </p>
                <p className="text-[11px] font-bold text-neutral-500 leading-tight italic line-clamp-1 opacity-80">
                    {person.character}
                </p>
            </div>
        </Link>
    );

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-x-2 gap-y-8">
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
                        <div className="relative w-full aspect-[2/3] mb-4 overflow-hidden rounded-2xl ring-2 ring-white/5 bg-white/[0.03] group-hover/more:bg-amber-400 group-hover/more:ring-amber-400 transition-all shadow-xl flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1 group-hover/more:scale-110 transition-transform text-neutral-500 group-hover:text-slate-950">
                                <ChevronDown size={32} strokeWidth={3} className="group-hover/more:animate-bounce" />
                            </div>
                        </div>
                        <div className="space-y-1.5 px-2">
                            <p className="text-sm font-black text-white group-hover/more:text-amber-400 uppercase tracking-tight">
                                DAHA FAZLA
                            </p>
                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                                +{cast.length - desktopLimit} OYUNCU
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
