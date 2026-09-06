import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/stats-actions";
import { getDetailedUserStats } from "@/lib/detailed-stats-actions";
import { getUserAchievements } from "@/lib/achievement-actions";
import { BarChart3, Film, Tv, Layers, Clock, MessageSquare, Send, Star, Users, TrendingUp, Award } from "lucide-react";
import Leaderboard from "@/components/stats/leaderboard";
import { StatCard, TimeStatCard } from "@/components/stats/stats-cards";
import GenreChart from "@/components/stats/genre-chart";
import ActivityTimeline from "@/components/stats/activity-timeline";
import WeeklyPatternChart from "@/components/stats/weekly-pattern-chart";
import InsightsSection from "@/components/stats/insights-section";
import { AchievementGrid } from "@/components/achievements/achievement-grid";
import { redirect } from "next/navigation";

export default async function StatsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [detailedStats, leaderboard, achievementsData] = await Promise.all([
        getDetailedUserStats(session.user.id),
        getLeaderboard(),
        getUserAchievements(session.user.id)
    ]);

    if (!detailedStats) return null;

    const { viewingTime, contentAnalysis, socialStats, genreBreakdown, temporalStats, personalInsights } = detailedStats;

    return (
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-6 sm:mb-10">
                <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">İstatistikler</h1>
                </div>
                <p className="text-neutral-500 text-xs md:text-sm font-medium pb-1">
                    İzleme alışkanlıklarını ve detaylı analizlerini incele.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">
                {/* Main Stats Column */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-10">
                    {/* Hero - Viewing Time */}
                    <div className="bg-gradient-to-br from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 border border-violet-500/30 p-5 sm:p-8 rounded-3xl backdrop-blur-sm shadow-2xl shadow-violet-500/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="w-8 h-8 text-violet-400" />
                            <h2 className="text-2xl font-black text-white">Toplam İzleme Süresi</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-white/70 mb-2">Toplam</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">{viewingTime.estimatedHours}</span>
                                    <span className="text-2xl font-bold text-white/70">saat</span>
                                </div>
                                <p className="text-xs text-white/50 mt-1">{viewingTime.totalMinutes.toLocaleString()} dakika</p>
                            </div>
                            <div>
                                <p className="text-sm text-white/70 mb-2">Film</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-blue-300">{Math.round(viewingTime.movieMinutes / 60)}</span>
                                    <span className="text-xl font-bold text-white/70">saat</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-white/70 mb-2">Dizi</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-purple-300">{Math.round(viewingTime.tvMinutes / 60)}</span>
                                    <span className="text-xl font-bold text-white/70">saat</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-sm text-white/70">
                                Günlük ortalama: <span className="font-bold text-white">{viewingTime.averageDailyMinutes}</span> dakika
                            </p>
                        </div>
                    </div>

                    {/* Content Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            title="İzlenen Film"
                            value={contentAnalysis.movieCount}
                            icon={<Film className="w-5 h-5 text-blue-400" />}
                            gradient="bg-gradient-to-br from-blue-600/20 to-blue-900/10"
                            subtitle={contentAnalysis.averageMovieRating > 0 ? `Ort. ${contentAnalysis.averageMovieRating} ⭐` : undefined}
                        />
                        <StatCard
                            title="İzlenen Dizi"
                            value={contentAnalysis.tvShowCount}
                            icon={<Tv className="w-5 h-5 text-green-400" />}
                            gradient="bg-gradient-to-br from-green-600/20 to-green-900/10"
                            subtitle={contentAnalysis.averageTvRating > 0 ? `Ort. ${contentAnalysis.averageTvRating} ⭐` : undefined}
                        />
                        <StatCard
                            title="Toplam Bölüm"
                            value={contentAnalysis.episodeCount}
                            icon={<Layers className="w-5 h-5 text-purple-400" />}
                            gradient="bg-gradient-to-br from-purple-600/20 to-purple-900/10"
                        />
                        <StatCard
                            title="Verilen Puan"
                            value={contentAnalysis.totalRatings}
                            icon={<Star className="w-5 h-5 text-yellow-400" />}
                            gradient="bg-gradient-to-br from-yellow-600/20 to-orange-900/10"
                        />
                    </div>

                    {/* Social Stats */}
                    <div>
                        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-2">
                            <Users className="w-7 h-7 text-cyan-400" />
                            Sosyal Etkileşim
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                title="Paylaşım"
                                value={socialStats.activitiesCount}
                                icon={<TrendingUp className="w-5 h-5 text-cyan-400" />}
                                gradient="bg-gradient-to-br from-cyan-600/20 to-blue-900/10"
                            />
                            <StatCard
                                title="Gönderilen Öneri"
                                value={socialStats.recommendationsSent}
                                icon={<Send className="w-5 h-5 text-pink-400" />}
                                gradient="bg-gradient-to-br from-pink-600/20 to-rose-900/10"
                            />
                            <StatCard
                                title="Alınan Öneri"
                                value={socialStats.recommendationsReceived}
                                icon={<Send className="w-5 h-5 text-orange-400 rotate-180" />}
                                gradient="bg-gradient-to-br from-orange-600/20 to-red-900/10"
                            />
                            <StatCard
                                title="Yorum"
                                value={socialStats.commentsCount}
                                icon={<MessageSquare className="w-5 h-5 text-indigo-400" />}
                                gradient="bg-gradient-to-br from-indigo-600/20 to-purple-900/10"
                            />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <StatCard
                                title="Takipçi"
                                value={socialStats.followersCount}
                                icon={<Users className="w-5 h-5 text-emerald-400" />}
                                gradient="bg-gradient-to-br from-emerald-600/20 to-teal-900/10"
                            />
                            <StatCard
                                title="Takip Edilen"
                                value={socialStats.followingCount}
                                icon={<Users className="w-5 h-5 text-violet-400" />}
                                gradient="bg-gradient-to-br from-violet-600/20 to-purple-900/10"
                            />
                        </div>
                    </div>

                    {/* Genre Breakdown */}
                    <GenreChart genres={genreBreakdown} />

                    {/* Weekly Pattern */}
                    <WeeklyPatternChart weeklyPattern={temporalStats.weeklyPattern} />

                    {/* Monthly Activity Timeline */}
                    <ActivityTimeline monthlyActivity={temporalStats.monthlyActivity} />

                    {/* Personal Insights */}
                    <InsightsSection insights={personalInsights} />

                    {/* Achievements / Rozetler Section moved from old page */}
                    <div className="mt-16 pt-10 border-t border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <Award className="w-8 h-8 text-amber-400" />
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">Rozetlerim</h2>
                        </div>
                        {achievementsData && (
                            <>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-white">
                                            {achievementsData.totalUnlocked} / {achievementsData.totalPossible} Rozet
                                        </span>
                                        <span className="text-sm font-bold text-amber-400">
                                            %{Math.round((achievementsData.totalUnlocked / achievementsData.totalPossible) * 100)}
                                        </span>
                                    </div>
                                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${(achievementsData.totalUnlocked / achievementsData.totalPossible) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-2">
                                        {achievementsData.totalPossible - achievementsData.totalUnlocked} rozet daha kazanabilirsin!
                                    </p>
                                </div>

                                <div className="space-y-10">
                                    {Object.entries({
                                        watch: { label: "İzleme", items: achievementsData.achievements.filter((a: any) => a.category === "watch") },
                                        rate: { label: "Puanlama & İnceleme", items: achievementsData.achievements.filter((a: any) => a.category === "rate") },
                                        social: { label: "Sosyal", items: achievementsData.achievements.filter((a: any) => a.category === "social") },
                                        list: { label: "Listeler", items: achievementsData.achievements.filter((a: any) => a.category === "list") },
                                        special: { label: "Özel", items: achievementsData.achievements.filter((a: any) => a.category === "special") },
                                    }).map(([key, category]) => (
                                        <div key={key}>
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                {category.label}
                                                <span className="text-xs text-neutral-500 font-normal">
                                                    ({category.items.filter((i: any) => i.unlocked).length}/{category.items.length})
                                                </span>
                                            </h3>
                                            <AchievementGrid achievements={category.items} />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:sticky lg:top-8 h-fit space-y-6">
                    <Leaderboard data={leaderboard} currentUserId={session.user.id} />

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
                        <h3 className="text-lg font-bold text-white mb-4">Hızlı Bilgiler</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-white/70">En aktif gün</span>
                                <span className="font-bold text-white">{temporalStats.mostActiveDay}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/70">En aktif ay</span>
                                <span className="font-bold text-white">{temporalStats.mostActiveMonth}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/70">Favori tür</span>
                                <span className="font-bold text-white">{personalInsights.favoriteGenre}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
