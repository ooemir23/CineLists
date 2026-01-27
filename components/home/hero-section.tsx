import { tmdb } from "@/lib/tmdb";
import { Star } from "lucide-react";
import { HeroActions } from "./hero-actions";

export async function HeroSection() {
    const trending = await tmdb.getTrendingMovies();
    const movie = trending.results[0];

    // Fallback if no backdrop
    const backdropUrl = movie?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : "/placeholder-hero.jpg";

    return (
        <div className="relative w-full h-[65vh] flex items-end pb-20 overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105"
                style={{ backgroundImage: `url(${backdropUrl})` }}
            >
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#101624] via-[#101624]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#101624]/90 via-[#101624]/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 flex flex-col gap-6">
                {/* Rating Badge */}
                <div className="flex items-center gap-2 bg-yellow-500/20 w-fit px-3 py-1 rounded-full border border-yellow-500/30 backdrop-blur-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-yellow-500 font-bold text-sm tracking-wide">
                        {movie.vote_average.toFixed(1)} / 10
                    </span>
                    <span className="text-yellow-500/60 mx-1">•</span>
                    <span className="text-yellow-200/80 text-xs font-medium uppercase tracking-widest">
                        Günün Trendi
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight drop-shadow-2xl max-w-4xl">
                    {movie.title}
                </h1>

                {/* Overview */}
                <p className="text-lg md:text-xl text-neutral-300 max-w-2xl line-clamp-3 leading-relaxed drop-shadow-md">
                    {movie.overview}
                </p>

                {/* Actions */}
                <HeroActions movieId={movie.id} />
            </div>
        </div>
    );
}

