import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { Activity, Star, Eye, Plus, Film, Tv } from "lucide-react";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default async function FeedPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    // Get IDs of users I follow
    const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    // Also include my own activities? Usually yes.
    const feedUserIds = [...followingIds, session.user.id];

    const activities = await prisma.activity.findMany({
        where: {
            userId: { in: feedUserIds }
        },
        include: {
            user: true,
            media: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return (
        <div className="container mx-auto px-6 py-10 min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <Activity className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-white">Aktivite Akışı</h1>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                {activities.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-neutral-400 mb-4">Henüz bir aktivite yok.</p>
                        <Link href="/community" className="text-primary hover:underline">
                            Arkadaş takip etmeye başla
                        </Link>
                    </div>
                ) : (
                    activities.map(activity => (
                        <div key={activity.id} className="bg-card border border-white/10 p-5 rounded-2xl flex gap-4">
                            {/* User Avatar */}
                            <Link href={`/profile/${activity.userId}`} className="shrink-0">
                                <div className="w-12 h-12 rounded-full overflow-hidden relative ring-2 ring-transparent hover:ring-primary transition-all">
                                    {activity.user.image ? (
                                        <Image src={activity.user.image} alt={activity.user.name || "User"} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">👤</div>
                                    )}
                                </div>
                            </Link>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <Link href={`/profile/${activity.userId}`} className="font-bold text-white hover:text-primary transition-colors">
                                        {activity.user.name}
                                    </Link>
                                    <span className="text-neutral-400 text-sm">
                                        {activity.type === "WATCHED" && "izledi"}
                                        {activity.type === "RATED" && "puanladı"}
                                        {activity.type === "REVIEWED" && "inceledi"}
                                        {activity.type === "ADDED_TO_LIST" && "listesine ekledi"}
                                    </span>
                                    <span className="text-neutral-600 text-xs ml-auto">
                                        {formatDistanceToNow(activity.createdAt, { addSuffix: true, locale: tr })}
                                    </span>
                                </div>

                                {/* Media Card Preview */}
                                <div className="flex gap-4 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors group/media mt-2">
                                    <Link href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`} className="shrink-0 relative w-16 h-24 rounded-lg overflow-hidden shadow-lg">
                                        {activity.media.posterPath ? (
                                            <Image src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`} alt={activity.media.title} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-neutral-800" />
                                        )}
                                    </Link>

                                    <div className="flex flex-col justify-center">
                                        <Link href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`} className="font-bold text-white group-hover/media:text-primary transition-colors line-clamp-1">
                                            {activity.media.title}
                                        </Link>
                                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                                            {activity.media.type === "MOVIE" ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                                            <span>{activity.media.type === "MOVIE" ? "Film" : "Dizi"}</span>
                                        </div>

                                        {activity.rating && (
                                            <div className="flex items-center gap-1 text-yellow-400 mt-2 font-bold text-sm">
                                                <Star className="w-3 h-3 fill-current" />
                                                {activity.rating}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
