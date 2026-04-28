"use client";

import { Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface RecommendationsWidgetProps {
    userName?: string;
    personalized?: any[];
}

export function RecommendationsWidget({ userName, personalized }: RecommendationsWidgetProps) {
    const topRecommendations = (personalized || []).slice(0, 4);

    return (
        <div className="bg-gradient-to-br from-rose-500/10 to-rose-900/10 rounded-2xl p-4 border border-rose-500/20 hover:border-rose-500/40 transition-all h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles size={16} className="text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-white truncate">Size Özel Seçim</h3>
                    <p className="text-[10px] text-neutral-400 font-medium">
                        {userName ? `${userName} için` : "Senin için"}
                    </p>
                </div>
            </div>

            {/* Recommendations Grid */}
            {topRecommendations.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 flex-1">
                    {topRecommendations.map((item, idx) => (
                        <Link
                            key={idx}
                            href={`/${item.mediaType || "movie"}/${item.id}`}
                            className="group relative rounded-lg overflow-hidden hover:ring-2 ring-rose-400/50 transition-all"
                        >
                            {/* Poster */}
                            {item.posterPath ? (
                                <div className="relative w-full aspect-[2/3] bg-neutral-900">
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                                        alt={item.title || item.name}
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>
                            ) : (
                                <div className="w-full aspect-[2/3] bg-neutral-900 flex items-center justify-center">
                                    <Heart size={20} className="text-neutral-500" />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <h4 className="text-[11px] font-bold text-white line-clamp-1">{item.title || item.name}</h4>
                                {item.voteAverage && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Heart size={10} className="fill-rose-400 text-rose-400" />
                                        <span className="text-[9px] text-rose-400 font-bold">{item.voteAverage.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                    <div className="space-y-2">
                        <Sparkles size={20} className="mx-auto text-neutral-500" />
                        <p className="text-xs text-neutral-400">İzledikçe öneriler kişiselleşecek</p>
                    </div>
                </div>
            )}

            {/* Action */}
            {topRecommendations.length > 0 && (
                <Link
                    href="/recommendations"
                    className="mt-3 pt-3 border-t border-white/10 text-[10px] text-rose-400 font-bold hover:text-rose-300 transition-colors flex items-center gap-1 justify-center"
                >
                    <Heart size={10} />
                    Daha Fazla Öner
                </Link>
            )}
        </div>
    );
}
