"use client";

import { Star, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { UpcomingActorProject } from "@/lib/hero-personalization-actions";

interface FavoriteActorsWidgetProps {
    projects: UpcomingActorProject[];
}

export function FavoriteActorsWidget({ projects }: FavoriteActorsWidgetProps) {
    if (projects.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 rounded-2xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white truncate">Favori Oyuncuların Projeleri</h3>
                    <p className="text-[10px] text-neutral-400 font-medium">Yakında vizyonda</p>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 gap-2 flex-1">
                {projects.slice(0, 4).map((project) => (
                    <Link
                        key={`${project.actorName}-${project.id}`}
                        href={`/${project.mediaType}/${project.id}`}
                        className="group relative rounded-lg overflow-hidden hover:ring-2 ring-purple-400/50 transition-all"
                    >
                        {/* Poster Image */}
                        {project.posterPath ? (
                            <div className="relative w-full aspect-[2/3] bg-neutral-900">
                                <Image
                                    src={`https://image.tmdb.org/t/p/w342${project.posterPath}`}
                                    alt={project.title}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            </div>
                        ) : (
                            <div className="w-full aspect-[2/3] bg-neutral-900 flex items-center justify-center">
                                <Star size={20} className="text-neutral-500" />
                            </div>
                        )}

                        {/* Overlay Info */}
                        <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-white line-clamp-1">{project.title}</h4>
                                <div className="flex items-center gap-1">
                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                    <span className="text-[9px] text-amber-400 font-bold">{project.voteAverage.toFixed(1)}</span>
                                </div>
                                {project.releaseDate && (
                                    <p className="text-[9px] text-neutral-300">{new Date(project.releaseDate).getFullYear()}</p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Actor Names at bottom */}
            <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-neutral-400 font-medium space-y-1">
                {Array.from(new Set(projects.map(p => p.actorName)))
                    .slice(0, 2)
                    .map((actor, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                            <span className="truncate">{actor}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}
