import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/media/media-card";
import { redirect } from "next/navigation";

import { Check } from "lucide-react";

import WatchedSearchBarWrapper from "@/components/watched/watched-search-wrapper";

export default async function WatchedPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }
    const watched = await prisma.watched.findMany({
        where: { userId: session.user.id },
        include: { media: true },
        orderBy: { watchedAt: "desc" },
    });
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { favoriteGenres: true },
    });

    // İstatistikler
    const movies = watched.filter(w => w.media.type === "MOVIE");
    const tvs = watched.filter(w => w.media.type === "TV");
    const totalMovieCount = movies.length;
    const totalTvCount = tvs.length;
    // Film süresi (örnek: her film 2 saat)
    const totalMovieHours = totalMovieCount * 2;
    // Dizi bölümü ve saat (örnek: her dizi 8 bölüm, 45dk)
    const totalTvEpisodes = tvs.reduce((acc, w) => acc + (w.media.episodeCount || 8), 0);
    const totalTvHours = tvs.reduce((acc, w) => acc + ((w.media.episodeCount || 8) * 0.75), 0); // 0.75 saat = 45dk
    // Favori tür
    let favoriteGenre = "-";
    if (user?.favoriteGenres && user.favoriteGenres.length > 0) {
        // Sadece ilkini göster
        favoriteGenre = user.favoriteGenres[0];
    }

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-12">
                <div className="flex items-center gap-3">
                    <Check className="w-10 h-10 text-primary" />
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">İzlenenler</h1>
                </div>
                <div className="flex flex-wrap gap-4 text-sm md:ml-8 mt-2 md:mt-0">
                    <span className="bg-slate-800 text-white rounded-lg px-3 py-1">Toplam Film: <b>{totalMovieCount}</b> ({totalMovieHours} saat)</span>
                    <span className="bg-slate-800 text-white rounded-lg px-3 py-1">Toplam Dizi: <b>{totalTvCount}</b> ({totalTvEpisodes} bölüm, {Math.round(totalTvHours)} saat)</span>
                    <span className="bg-slate-800 text-white rounded-lg px-3 py-1">Favori Tür: <b>{favoriteGenre}</b></span>
                </div>
            </div>

            {/* WatchedSearchBar client component */}
            <WatchedSearchBarWrapper watched={watched} />
        </div>
    );
}

