"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Info, X } from "lucide-react";
import { createPortal } from "react-dom";

type HeroActionsProps = {
    movieId: number;
    trailerKey?: string; // We might pass this if we fetch it server-side, or fetch on click
};

export function HeroActions({ movieId }: HeroActionsProps) {
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const openTrailer = async () => {
        setShowTrailer(true);
        if (!trailerKey) {
            setLoading(true);
            try {
                // Determine if it's movie or tv. The HeroSection currently defaults to movie trending.
                // We'll assume movie for now as per HeroSection logic.
                const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY || 'bf8f936fe43431e6714917c0c9a172e5'}&language=en-US`);
                const data = await res.json();
                const trailer = data.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
                if (trailer) {
                    setTrailerKey(trailer.key);
                }
            } catch (error) {
                console.error("Failed to fetch trailer", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-4 mt-4">
                <Link
                    href={`/movie/${movieId}`}
                    className="group flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white text-white group-hover:text-primary transition-colors">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                    Detayları İncele
                </Link>

                <button
                    onClick={openTrailer}
                    className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95"
                >
                    <Info className="w-6 h-6" />
                    Fragman
                </button>
            </div>

            {showTrailer && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-200">
                    <button
                        onClick={() => setShowTrailer(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : trailerKey ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-neutral-400">
                                Fragman bulunamadı.
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
