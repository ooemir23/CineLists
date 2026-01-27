import Link from "next/link";
import Image from "next/image";
import { getFriendsActivity } from "@/lib/feed-actions";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Activity, Star, Clock, User, Users } from "lucide-react";

export async function FriendsActivity() {
    const activities = await getFriendsActivity();

    return (
        <div className="py-8">
            <div className="flex items-center gap-3 px-6 md:px-10 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                    <Activity className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Arkadaşların Neler Yapıyor?
                </h2>
            </div>

            {activities.length === 0 ? (
                <div className="px-6 md:px-10">
                    <div className="w-full h-40 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 bg-white/5">
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Users className="w-6 h-6" />
                            <p>Henüz bir arkadaş aktivitesi yok.</p>
                        </div>
                        <Link
                            href="/community"
                            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-4 py-2 rounded-xl"
                        >
                            Arkadaş Bul & Takip Et
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 px-6 md:px-10 snap-x hide-scrollbar">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="snap-center shrink-0 w-[300px] bg-[#1A202C] border border-white/5 rounded-2xl p-4 transition-all hover:bg-[#1A202C]/80 hover:border-primary/20 group"
                        >
                            {/* User Header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden relative border border-white/10">
                                    {activity.user.image ? (
                                        <Image
                                            src={activity.user.image}
                                            alt={activity.user.name || "User"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                                            <User className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                        {activity.user.name || "İsimsiz Kullanıcı"}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })}
                                    </p>
                                </div>
                            </div>

                            {/* Action Content */}
                            <div className="flex gap-3">
                                <Link href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`} className="shrink-0 w-16 aspect-[2/3] relative rounded-lg overflow-hidden bg-neutral-800 shadow-lg">
                                    {activity.media.posterPath ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`}
                                            alt={activity.media.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                                            <span className="text-[10px] text-neutral-500 text-center px-1">{activity.media.title}</span>
                                        </div>
                                    )}
                                </Link>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <Link
                                        href={`/${activity.media.type === "MOVIE" ? "movie" : "tv"}/${activity.media.tmdbId}`}
                                        className="text-sm font-bold text-white hover:text-amber-400 transition-colors truncate"
                                    >
                                        {activity.media.title}
                                    </Link>

                                    <div className="mt-auto space-y-2">
                                        {activity.type === "WATCHED" && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg w-fit">
                                                <Clock className="w-3 h-3" />
                                                İzledi
                                            </div>
                                        )}

                                        {activity.type === "RATED" && activity.rating && (
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg w-fit">
                                                <Star className="w-3 h-3 fill-current" />
                                                {activity.rating} Puan Verdi
                                            </div>
                                        )}

                                        {/* Show review snippet if exists */}
                                        {activity.review && (
                                            <div className="relative pl-3 text-xs text-neutral-400 italic line-clamp-2 border-l-2 border-white/10">
                                                "{activity.review}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
