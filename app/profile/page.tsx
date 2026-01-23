import { auth } from "@/auth";
import { handleSignOut } from "@/lib/auth-actions";
import { prisma } from "@/lib/prisma";
import { getUserStats } from "@/lib/stats-actions";
import Image from "next/image";
import Link from "next/link";
import { LogOut, Film, Tv, Heart, Users, Activity as ActivityIcon, Star } from "lucide-react";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // Fetch user stats & data
    const [user, stats] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                favoritePersons: true,
                activities: {
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    include: { media: true }
                },
                _count: {
                    select: {
                        watchlistItems: true,
                        followedBy: true,
                        following: true,
                    },
                },
            },
        }),
        getUserStats(session.user.id)
    ]);

    if (!user || !stats) return null;

    return (
        <div className="container mx-auto px-6 py-10 min-h-screen">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Profile Card */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-card border border-white/10 rounded-3xl p-8 shadow-2xl sticky top-24">
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full overflow-hidden mb-6 ring-4 ring-primary/20 relative shadow-inner">
                                {user.image ? (
                                    <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-5xl">👤</div>
                                )}
                            </div>
                            <h1 className="text-2xl font-black text-white text-center mb-1 tracking-tight">{user.name}</h1>
                            <p className="text-neutral-500 text-sm mb-6 font-medium">{user.email}</p>

                            <div className="grid grid-cols-2 gap-4 w-full text-center border-t border-b border-white/5 py-6">
                                <div>
                                    <span className="block text-xl font-black text-white tracking-tight">{user._count.followedBy}</span>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Takipçi</span>
                                </div>
                                <div>
                                    <span className="block text-xl font-black text-white tracking-tight">{user._count.following}</span>
                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Takip</span>
                                </div>
                            </div>

                            <form action={handleSignOut} className="w-full mt-8">
                                <button className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all text-neutral-400 font-bold text-sm">
                                    <LogOut className="w-4 h-4" />
                                    Çıkış Yap
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Stats & Activity */}
                <div className="flex-1 space-y-10 w-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                            <Film className="w-6 h-6 text-blue-400 mb-3" />
                            <div className="text-3xl font-black text-white tracking-tight">{stats.movieCount}</div>
                            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Film</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/10 to-transparent border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                            <Tv className="w-6 h-6 text-purple-400 mb-3" />
                            <div className="text-3xl font-black text-white tracking-tight">{stats.showCount}</div>
                            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Dizi</div>
                        </div>
                        <div className="bg-gradient-to-br from-pink-600/10 to-transparent border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                            <Heart className="w-6 h-6 text-pink-500 mb-3" />
                            <div className="text-3xl font-black text-white tracking-tight">{user._count.watchlistItems}</div>
                            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">İzlenecek</div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-600/10 to-transparent border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                            <Star className="w-6 h-6 text-yellow-500 mb-3" />
                            <div className="text-3xl font-black text-white tracking-tight">{stats.episodeCount}</div>
                            <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bölüm</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Activity Feed */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                                <ActivityIcon className="w-5 h-5 text-primary" />
                                Son Aktiviteler
                            </h2>
                            <div className="space-y-4">
                                {user.activities.length === 0 ? (
                                    <div className="bg-white/5 border border-white/5 border-dashed rounded-3xl p-10 text-center">
                                        <p className="text-neutral-500">Henüz bir aktivite yok.</p>
                                    </div>
                                ) : (
                                    user.activities.map((activity) => (
                                        <div key={activity.id} className="flex gap-4 p-4 bg-card border border-white/5 rounded-2xl group hover:border-primary/20 transition-all">
                                            <div className="relative w-12 h-18 rounded-lg overflow-hidden shrink-0 shadow-lg">
                                                {activity.media.posterPath ? (
                                                    <Image src={`https://image.tmdb.org/t/p/w200${activity.media.posterPath}`} alt={activity.media.title} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-neutral-800" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className="text-xs text-neutral-500 mb-1">
                                                    {formatDistanceToNow(activity.createdAt, { addSuffix: true, locale: tr })}
                                                </p>
                                                <p className="font-bold text-white group-hover:text-primary transition-colors truncate">
                                                    {activity.media.title}
                                                </p>
                                                <p className="text-xs text-neutral-400">
                                                    {activity.type === "WATCHED" ? "İzledi" : "Puanladı"}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Favorite Persons */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                                <Heart className="w-5 h-5 text-primary fill-current" />
                                Favori Kişiler
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                {user.favoritePersons.length === 0 ? (
                                    <div className="col-span-2 bg-white/5 border border-white/5 border-dashed rounded-3xl p-10 text-center">
                                        <p className="text-neutral-500">Henüz favori kişi yok.</p>
                                    </div>
                                ) : (
                                    user.favoritePersons.map((person) => (
                                        <Link key={person.id} href={`/person/${person.tmdbId}`} className="flex items-center gap-3 p-3 bg-card border border-white/5 rounded-2xl hover:bg-white/5 transition-all group">
                                            <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-transparent group-hover:ring-primary transition-all">
                                                {person.profilePath ? (
                                                    <Image src={`https://image.tmdb.org/t/p/w200${person.profilePath}`} alt={person.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">👤</div>
                                                )}
                                            </div>
                                            <span className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">{person.name}</span>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
