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

    // Guest users are not in DB, show empty watched list
    const isGuest = (session.user as any).isGuest || (session.user as any).id?.startsWith("guest_");
    if (isGuest) {
        return (
            <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 ">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-12">
                    <div className="flex items-center gap-3">
                        <Check className="w-10 h-10 text-primary" />
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">İzlenenler</h1>
                    </div>
                </div>
                <p className="text-neutral-400 text-center py-20">İzlenenleri takip etmek için giriş yapmalısın.</p>
            </div>
        );
    }

    let watched: any[] = [];
    let user: any = null;

    try {
        const [watchedData, userData] = await Promise.all([
            prisma.watched.findMany({
                where: { userId: session.user.id },
                include: { media: true },
                orderBy: { watchedAt: "desc" },
            }).catch(() => []),
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: { favoriteGenres: true },
            }).catch(() => null),
        ]);

        watched = watchedData || [];
        user = userData;
    } catch {
        watched = [];
    }

    // İstatistikler
    const movies = watched.filter(w => w.media.type === "MOVIE");
    const tvs = watched.filter(w => w.media.type === "TV");
    const totalMovieCount = movies.length;
    const totalTvCount = tvs.length;
    // Film süresi - DB'deki runtime kullanılır, yoksa 120 dk varsayılır
    const totalMovieMinutes = movies.reduce((acc, w) => acc + (w.media.runtime || 120), 0);
    const totalMovieHours = Math.round(totalMovieMinutes / 60 * 10) / 10;
    // Dizi bölümü ve saat - DB'deki runtime kullanılır, yoksa 45 dk varsayılır
    const totalTvEpisodes = tvs.reduce((acc, w) => acc + (w.media.episodeCount || 8), 0);
    const avgEpisodeMinutes = tvs.length > 0
        ? tvs.reduce((acc, w) => acc + (w.media.runtime || 45), 0) / tvs.length
        : 45;
    const totalTvHours = Math.round(totalTvEpisodes * avgEpisodeMinutes / 60 * 10) / 10;
    // Favori tür
    let favoriteGenre = "-";
    if (user?.favoriteGenres && user.favoriteGenres.length > 0) {
        // Sadece ilkini göster
        favoriteGenre = user.favoriteGenres[0];
    }

    return (
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 md:px-10 lg:px-16 py-4 sm:py-10">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 sm:mb-10">
                <div className="flex items-center gap-2.5">
                    <Check className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight">İzlenenler</h1>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm md:ml-6 mt-1 md:mt-0">
                    <span className="bg-slate-800/80 border border-white/5 text-white rounded-xl px-3 py-1.5 font-medium">Toplam Film: <b className="text-primary">{totalMovieCount}</b> ({totalMovieHours}s)</span>
                    <span className="bg-slate-800/80 border border-white/5 text-white rounded-xl px-3 py-1.5 font-medium">Toplam Dizi: <b className="text-primary">{totalTvCount}</b> ({totalTvEpisodes} bl, {Math.round(totalTvHours)}s)</span>
                    <span className="bg-slate-800/80 border border-white/5 text-white rounded-xl px-3 py-1.5 font-medium">Favori Tür: <b className="text-primary">{favoriteGenre}</b></span>
                </div>
            </div>

            {/* WatchedSearchBar client component */}
            <WatchedSearchBarWrapper watched={watched} />
        </div>
    );
}

