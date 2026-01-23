import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MediaCard } from "@/components/media/media-card";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

export default async function WatchlistPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const watchlist = await prisma.watchlistItem.findMany({
        where: { userId: session.user.id },
        include: {
            media: true,
        },
        orderBy: { addedAt: "desc" },
    });

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
            <div className="flex items-center gap-3 mb-12">
                <Heart className="w-10 h-10 text-primary fill-current" />
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">İzleme Listem</h1>
            </div>

            {watchlist.length === 0 ? (
                <div className="text-center text-neutral-500 mt-20">
                    <p className="text-xl font-bold">Listeniz henüz boş.</p>
                    <p className="text-neutral-400">Keşfetmeye başlayın ve favorilerinizi ekleyin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {watchlist.map((item) => (
                        <MediaCard
                            key={item.id}
                            id={item.media.tmdbId}
                            title={item.media.title}
                            posterPath={item.media.posterPath}
                            voteAverage={0} // We don't store vote average in DB, simple card
                            type={item.media.type === "MOVIE" ? "movie" : "tv"}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
