import { tmdb } from "@/lib/tmdb";
import Image from "next/image";

export async function PosterBackground() {
    let posters: string[] = [];
    try {
        const data = await tmdb.getTopRated("movie", { page: "1" });
        posters = data.results
            .slice(0, 24)
            .map((m: any) => m.poster_path)
            .filter(Boolean);
    } catch (error) {
        console.error("PosterBackground fetch error:", error);
    }

    if (posters.length === 0) return <div className="absolute inset-0 bg-slate-950" />;

    return (
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none select-none">
            {/* Poster Grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 opacity-30 scale-110 blur-[2px]">
                {posters.map((path, i) => (
                    <div 
                        key={i} 
                        className="relative aspect-[2/3] rounded-lg overflow-hidden animate-in fade-in duration-1000"
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <Image
                            src={`https://image.tmdb.org/t/p/w300${path}`}
                            alt="Poster"
                            fill
                            className="object-cover"
                        />
                    </div>
                ))}
                {/* Duplicate for fill if needed */}
                {posters.map((path, i) => (
                    <div 
                        key={`dup-${i}`} 
                        className="relative aspect-[2/3] rounded-lg overflow-hidden opacity-50"
                    >
                        <Image
                            src={`https://image.tmdb.org/t/p/w300${path}`}
                            alt="Poster"
                            fill
                            className="object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950 z-10" />
            <div className="absolute inset-0 backdrop-blur-[4px] z-10" />
        </div>
    );
}
