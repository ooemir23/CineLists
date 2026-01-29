import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import Image from "next/image";
import Link from "next/link";
import { Film, Tv, Heart, Users, Activity as ActivityIcon, Star, Lock } from "lucide-react";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { ProfileClientWrapper } from "@/components/profile/profile-client-wrapper";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const isGuest = (session.user as any).isGuest;

    if (isGuest) {
        return (
            <div className="container mx-auto px-6 py-20 min-h-[70vh] flex items-center justify-center">
                <div className="max-w-md w-full bg-neutral-900/50 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] text-center space-y-8 shadow-2xl">
                    <div className="flex justify-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center group">
                            <Lock className="w-10 h-10 text-primary animate-bounce shadow-lg" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-white tracking-tight">Profiline Eriş</h1>
                        <p className="text-neutral-400 font-medium">Kendi profilini oluşturmak, izleme listeni yönetmek ve arkadaşlarınla etkileşime geçmek için hemen giriş yap!</p>
                    </div>
                    <div className="flex flex-col gap-4 pt-4">
                        <Link
                            href="/login"
                            className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                        >
                            Giriş Yap
                        </Link>
                        <Link
                            href="/register"
                            className="w-full bg-white/5 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/10 flex items-center justify-center gap-2"
                        >
                            Kayıt Ol
                        </Link>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Misafir modu ile içerikleri keşfetmeye devam edebilirsin.</p>
                </div>
            </div>
        );
    }

    // Fetch user stats & data
    const [user, stats, movieGenres, tvGenres] = await Promise.all([
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
                        toWatch: true,
                        watched: true,
                        followedBy: true,
                        following: true,
                    },
                },
            },
        }),
        getUserStats(session.user.id),
        tmdb.getGenres("movie"),
        tmdb.getGenres("tv"),
    ]);

    if (!user || !stats) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-white">Kullanıcı verileri yüklenemedi.</p>
            </div>
        );
    }

    // Merge and unique genres for preference selection
    const allGenres = Array.from(
        new Map([...movieGenres.genres, ...tvGenres.genres].map((g: any) => [g.id, g])).values()
    ).sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Prepare data for client component
    const userData = {
        ...user,
        username: user.username || "",
        allGenres, // Pass the list of available genres
        favoriteGenres: user.favoriteGenres || [],
        platforms: user.platforms || [],
    };

    return (
        <div className="container mx-auto px-6 py-10 min-h-screen">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
                {/* Profile Card (Client Component) */}
                <ProfileClientWrapper user={userData as any} />

                {/* Stats & Activity */}
                <div className="flex-1 space-y-10 w-full">
                    {user.showStats ? (
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
                                <div className="text-3xl font-black text-white tracking-tight">{user._count.toWatch}</div>
                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">İzlenecek</div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-600/10 to-transparent border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
                                <ActivityIcon className="w-6 h-6 text-yellow-500 mb-3" />
                                <div className="text-3xl font-black text-white tracking-tight">{user._count.watched}</div>
                                <div className="text-xs font-bold text-neutral-500 uppercase tracking-widest">İzlenen</div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/5 border-dashed rounded-[2.5rem] p-8 text-center flex flex-col items-center gap-3">
                            <Lock className="w-8 h-8 text-neutral-600" />
                            <p className="text-neutral-500 font-bold">İstatistikler gizlendi.</p>
                        </div>
                    )}


                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Activity Feed */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                                <ActivityIcon className="w-5 h-5 text-primary" />
                                Son Aktiviteler
                            </h2>
                            {user.showActivities ? (
                                <div className="space-y-4">
                                    {user.activities.length === 0 ? (
                                        <div className="bg-white/5 border border-white/5 border-dashed rounded-3xl p-10 text-center">
                                            <p className="text-neutral-500">Henüz bir aktivite yok.</p>
                                        </div>
                                    ) : (
                                        user.activities.map((activity: any) => (
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
                            ) : (
                                <div className="bg-white/5 border border-white/5 border-dashed rounded-[2.5rem] p-8 text-center flex flex-col items-center gap-3">
                                    <Lock className="w-8 h-8 text-neutral-600" />
                                    <p className="text-neutral-500 font-bold">Aktiviteler gizlendi.</p>
                                </div>
                            )}
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
                                    user.favoritePersons.map((person: any) => (
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
