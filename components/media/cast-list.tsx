"use client";

import Image from "next/image";

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
    if (!cast || cast.length === 0) return null;

    return (
        <div className="py-6">
            <h3 className="text-xl font-bold text-white mb-4 px-6 md:px-10">Oyuncular</h3>
            <div
                className="flex gap-4 overflow-x-auto px-6 md:px-10 pb-4 scrollbar-hide snap-x scroll-pl-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {cast.slice(0, 20).map((person) => (
                    <div key={person.id} className="flex-shrink-0 w-32 flex flex-col items-center text-center">
                        <div className="relative w-24 h-24 mb-3 overflow-hidden rounded-full ring-2 ring-white/10 bg-neutral-900">
                            {person.profile_path ? (
                                <Image
                                    src={`${IMAGE_BASE_URL}${person.profile_path}`}
                                    alt={person.name}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
                                    Resim Yok
                                </div>
                            )}
                        </div>
                        <p className="text-sm font-bold text-white leading-tight mb-1">{person.name}</p>
                        <p className="text-xs text-neutral-400">{person.character}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
