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
        <div className="container mx-auto px-6 py-10 min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <Heart className="w-8 h-8 text-primary fill-current" />
                <h1 className="text-3xl font-bold text-white">İzleme Listem</h1>
            </div>

            {watchlist.length === 0 ? (
                <div className="text-center text-neutral-500 mt-20">
                    <p className="text-lg">Listeniz henüz boş.</p>
                    <p className="text-sm">Keşfetmeye başlayın ve favorilerinizi ekleyin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
