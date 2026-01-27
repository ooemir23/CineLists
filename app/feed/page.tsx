import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Activity, Users, Plus, Star, Search, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { ActivityPost } from "@/components/feed/activity-post";

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

    // Also include my own activities
    const feedUserIds = [...followingIds, session.user.id];

    const activities = await prisma.activity.findMany({
        where: {
            userId: { in: feedUserIds }
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                }
            },
            media: true,
            _count: {
                select: { comments: true }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 30,
    });

    return (
        <div className="min-h-screen bg-[#101624] text-neutral-100 pb-20">
            {/* Header / Intro */}
            <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-[#101624] to-[#101624]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

                {/* Floating Glows */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 blur-[100px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full animate-pulse delay-700" />

                <div className="relative z-10 text-center space-y-4 px-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border border-primary/30 text-primary text-xs font-bold uppercase tracking-widest animate-fade-in">
                        <Sparkles className="w-3 h-3" />
                        Aktivite Akışı
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
                        Neler İzleniyor<span className="text-primary">?</span>
                    </h1>
                    <p className="text-neutral-400 max-w-lg mx-auto text-sm md:text-base font-medium">
                        Arkadaşlarının ne izlediğini, ne kadar puan verdiğini ve neler düşündüğünü burada keşfet.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-10 relative z-20">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Main Feed Column */}
                    <div className="flex-1 w-full space-y-12 mb-20 max-w-2xl mx-auto lg:mx-0">
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 text-center px-10 shadow-2xl">
                                <div className="p-6 bg-primary/10 rounded-full mb-6">
                                    <Users className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-3">Henüz Bir Şey Yok</h2>
                                <p className="text-neutral-400 mb-8 max-w-xs mx-auto text-sm">
                                    Takip ettiğin kişilerin aktivitelerini burada görebilirsin. Kimseyi takip etmiyor musun?
                                </p>
                                <Link
                                    href="/community"
                                    className="px-8 py-4 bg-primary text-background font-black rounded-2xl hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/20 flex items-center gap-2"
                                >
                                    <Search className="w-5 h-5" />
                                    Arkadaşlarını Bul
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {activities.map(activity => (
                                    <ActivityPost key={activity.id} activity={activity as any} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Recommendations (Hidden on Mobile) */}
                    <div className="hidden lg:block w-80 shrink-0 space-y-8 sticky top-24">
                        {/* Summary Widget */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 shadow-xl">
                            <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Senin Aktiviten
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <span className="text-neutral-400 text-sm font-medium group-hover:text-white transition-colors">Takip Ettiklerin</span>
                                    <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-white border border-white/5">
                                        {followingIds.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <span className="text-neutral-400 text-sm font-medium group-hover:text-white transition-colors">Toplam Aktivite</span>
                                    <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-white border border-white/5">
                                        {activities.length}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/profile"
                                className="mt-8 block w-full text-center py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold border border-white/5 transition-all text-neutral-300 hover:text-white"
                            >
                                Profiline Git
                            </Link>
                        </div>

                        {/* Social Tip */}
                        <div className="bg-gradient-to-br from-primary/20 to-blue-500/10 border border-primary/10 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-white font-bold mb-2">Daha fazla aktivite?</h3>
                                <p className="text-neutral-300 text-xs leading-relaxed mb-4">
                                    Keşfet sayfasından yeni insanlar bulup takip ederek akışını zenginleştirebilirsin.
                                </p>
                                <Link href="/community" className="text-primary font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Topluluğa Göz At <Plus className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Users className="w-16 h-16" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
