import { auth } from "@/auth";
import { getLeaderboard, getUserStats } from "@/lib/stats-actions";
import { BarChart3, Film, Tv, PlayCircle, Layers } from "lucide-react";
import Leaderboard from "@/components/stats/leaderboard";
import { redirect } from "next/navigation";

export default async function StatsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const [stats, leaderboard] = await Promise.all([
        getUserStats(session.user.id),
        getLeaderboard()
    ]);

    if (!stats) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-16 py-10 min-h-screen">
            <div className="flex items-center gap-3 mb-10">
                <BarChart3 className="w-10 h-10 text-primary" />
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">İstatistikler</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Main Stats Column */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20 p-8 rounded-3xl backdrop-blur-sm shadow-lg shadow-blue-500/5">
                            <div className="flex items-center gap-3 text-blue-400 mb-3">
                                <Film className="w-6 h-6" />
                                <h3 className="font-bold text-lg">İzlenen Film</h3>
                            </div>
                            <p className="text-5xl font-black text-white">{stats.movieCount}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/20 p-8 rounded-3xl backdrop-blur-sm shadow-lg shadow-purple-500/5">
                            <div className="flex items-center gap-3 text-purple-400 mb-3">
                                <Layers className="w-6 h-6" />
                                <h3 className="font-bold text-lg">Toplam Bölüm</h3>
                            </div>
                            <p className="text-5xl font-black text-white">{stats.episodeCount}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-600/20 to-green-900/10 border border-green-500/20 p-8 rounded-3xl backdrop-blur-sm shadow-lg shadow-green-500/5">
                            <div className="flex items-center gap-3 text-green-400 mb-3">
                                <Tv className="w-6 h-6" />
                                <h3 className="font-bold text-lg">Bitirilen Dizi</h3>
                            </div>
                            <p className="text-5xl font-black text-white">{stats.showCount}</p>
                        </div>
                    </div>

                    {/* Progress / Charts Placeholder */}
                    <div className="bg-white/5 border border-white/10 p-12 rounded-3xl min-h-[400px] flex items-center justify-center relative overflow-hidden group shadow-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="text-center">
                            <BarChart3 className="w-20 h-20 text-neutral-700 mx-auto mb-6" />
                            <p className="text-neutral-500 text-lg">Detaylı aktivite grafikleri yakında...</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:sticky lg:top-8 h-fit">
                    <Leaderboard data={leaderboard} currentUserId={session.user.id} />
                </div>
            </div>
        </div>
    );
}
