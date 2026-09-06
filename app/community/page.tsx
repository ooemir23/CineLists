import { auth } from "@/auth";
import { searchUsers, getFollowStatus, getGlobalActiveUsers, getCommunityStats } from "@/lib/social-actions";
import { UserSearchInput } from "@/components/social/user-search-input";
import { FollowButton } from "@/components/social/follow-button";
import Image from "next/image";
import Link from "next/link";
import { Users, Award, Zap, Search, Trophy, Medal, Film, Heart, ChevronRight, X } from "lucide-react";

export default async function CommunityPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const query = searchParams?.q || "";
    const currentUserId = session?.user?.id;

    let users: any[] = [];
    let topUsers: any[] = [];
    let stats = { totalUsers: 0, totalWatched: 0, totalActivities: 0 };

    try {
        const [statsData, queryResult, topUsersResult] = await Promise.all([
            getCommunityStats(),
            query ? searchUsers(query) : Promise.resolve([]),
            !query ? getGlobalActiveUsers() : Promise.resolve([]),
        ]);

        stats = statsData;
        users = queryResult;
        topUsers = topUsersResult;
    } catch (e) {
        console.warn("[CommunityPage] Fetch failed:", e);
    }

    const displayUsers = query ? users : topUsers;

    const getAvatarGradient = (name: string) => {
        const gradients = [
            "linear-gradient(135deg,#f59e0b,#d97706)",
            "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            "linear-gradient(135deg,#10b981,#047857)",
            "linear-gradient(135deg,#ec4899,#be185d)",
            "linear-gradient(135deg,#8b5cf6,#6d28d9)",
        ];
        let sum = 0;
        const displayName = name || "User";
        for (let i = 0; i < displayName.length; i++) sum += displayName.charCodeAt(i);
        return gradients[sum % gradients.length];
    };

    return (
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-8 space-y-6 sm:space-y-8">
            {/* ═════════ HEADER BAR (CONSISTENT WITH STATS & WATCHLIST) ═════════ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-400/5">
                        <Users className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bricolage font-extrabold text-white tracking-tight">
                                Topluluk
                            </h1>
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-400/20 uppercase tracking-wider">
                                Sinefiller
                            </span>
                        </div>
                        <p className="text-xs md:text-sm text-neutral-400 font-medium mt-0.5">
                            Sinefilleri keşfet, listelerine göz at ve sinema zevkini paylaş.
                        </p>
                    </div>
                </div>

                {/* Search Bar - Responsive */}
                <div className="w-full md:w-80 lg:w-96">
                    <UserSearchInput />
                </div>
            </div>

            {/* ═════════ QUICK STATS / HIGHLIGHTS STRIP ═════════ */}
            {!query && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block truncate">Sinefiller</span>
                            <span className="text-lg md:text-xl font-bricolage font-extrabold text-white">{stats.totalUsers}</span>
                        </div>
                    </div>

                    <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shrink-0">
                            <Film className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block truncate">İzleme Kaydı</span>
                            <span className="text-lg md:text-xl font-bricolage font-extrabold text-white">{stats.totalWatched}</span>
                        </div>
                    </div>

                    <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block truncate">Etkileşim</span>
                            <span className="text-lg md:text-xl font-bricolage font-extrabold text-white">{stats.totalActivities}</span>
                        </div>
                    </div>

                    <Link 
                        href="/taste-match"
                        className="bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 border border-pink-500/20 hover:border-pink-500/40 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-3 group transition-all"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 shadow-lg shadow-pink-500/10">
                                <Heart className="w-5 h-5 fill-pink-500/30" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-pink-300 uppercase tracking-wider block truncate">Zevk İkizleri</span>
                                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1 truncate">
                                    AI Eşleşmeni Gör
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                </div>
            )}

            {/* ═════════ SECTION HEADER ═════════ */}
            <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2.5">
                    {query ? (
                        <>
                            <Search className="w-4 h-4 text-amber-400" />
                            <h2 className="text-sm md:text-base font-bricolage font-extrabold text-white tracking-tight">
                                Arama Sonuçları: <span className="text-amber-400 font-bold">"{query}"</span>
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-[10px] font-mono font-bold">
                                {displayUsers.length} sonuç
                            </span>
                        </>
                    ) : (
                        <>
                            <Trophy className="w-4 h-4 text-amber-400" />
                            <h2 className="text-sm md:text-base font-bricolage font-extrabold text-white tracking-tight">
                                En Aktif Sinefiller
                            </h2>
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-mono font-bold">
                                Liderlik Sıralaması
                            </span>
                        </>
                    )}
                </div>

                {query && (
                    <Link
                        href="/community"
                        className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Aramayı Temizle</span>
                    </Link>
                )}
            </div>

            {/* ═════════ USER CARDS GRID (1600PX RESPONSIVE) ═════════ */}
            {displayUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#0b1120] rounded-3xl border border-white/5 text-center px-6 shadow-xl">
                    <div className="p-4 bg-amber-400/10 rounded-2xl mb-4 border border-amber-400/20 shadow-lg shadow-amber-400/5">
                        <Users className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="font-bricolage font-bold text-lg text-white mb-1">
                        {query ? "Kullanıcı Bulunamadı" : "Henüz Topluluk Üyesi Yok"}
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-sm mb-5">
                        {query
                            ? `"${query}" aramasıyla eşleşen bir sinefil bulunamadı. Farklı bir isim veya kullanıcı adı deneyebilirsiniz.`
                            : "Topluluğa yeni üyeler katıldıkça burada listelenecek."}
                    </p>
                    {query && (
                        <Link
                            href="/community"
                            className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-400/10 hover:bg-amber-300 transition-all active:scale-95"
                        >
                            Tüm Listeyi Göster
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                    {await Promise.all(displayUsers.map(async (user, index) => {
                        const isFollowing = currentUserId ? await getFollowStatus(user.id) : false;
                        const isTop3 = !query && index < 3;
                        const profileUrl = `/profile/${user.username || user.id}`;

                        return (
                            <div 
                                key={user.id}
                                className="group relative bg-[#0b1120] border border-white/10 hover:border-amber-400/30 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-400/5 hover:-translate-y-0.5 flex flex-col justify-between"
                            >
                                {/* Rank Ribbon / Badge for Top 3 */}
                                {!query && (
                                    <div className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-mono font-black shadow-xl z-10 border ${
                                        index === 0 ? "bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 border-amber-200 shadow-amber-400/20" :
                                        index === 1 ? "bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-950 border-white shadow-slate-300/20" :
                                        index === 2 ? "bg-gradient-to-tr from-amber-700 to-amber-600 text-white border-amber-500 shadow-amber-700/20" :
                                        "bg-slate-800 text-slate-400 border-white/10"
                                    }`}>
                                        {index + 1}
                                    </div>
                                )}

                                <div>
                                    {/* Top Row: Avatar & Follow Button */}
                                    <div className="flex items-start justify-between gap-3 mb-3.5">
                                        <Link href={profileUrl} className="relative group/avatar">
                                            <div className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white/5 shrink-0 border transition-all ${
                                                isTop3 ? "border-amber-400/40 ring-2 ring-amber-400/15" : "border-white/10 group-hover:border-amber-400/40"
                                            }`}>
                                                {user.image ? (
                                                    <Image 
                                                        src={user.image} 
                                                        alt={user.name || user.username || "Kullanıcı"} 
                                                        fill 
                                                        sizes="56px"
                                                        className="object-cover" 
                                                    />
                                                ) : (
                                                    <div 
                                                        className="w-full h-full flex items-center justify-center text-white font-bricolage font-extrabold text-base uppercase"
                                                        style={{ background: getAvatarGradient(user.name || user.username || "") }}
                                                    >
                                                        {(user.name || user.username || "U").charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        {currentUserId && currentUserId !== user.id && (
                                            <div className="shrink-0">
                                                <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                                            </div>
                                        )}
                                    </div>

                                    {/* User Details */}
                                    <div className="min-w-0 mb-3.5">
                                        <div className="flex items-center gap-1.5">
                                            <Link 
                                                href={profileUrl} 
                                                className="font-bricolage font-extrabold text-white text-base truncate hover:text-amber-400 transition-colors"
                                            >
                                                {user.name || user.username}
                                            </Link>
                                            {isTop3 && (
                                                <Medal className={`w-3.5 h-3.5 shrink-0 ${
                                                    index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : "text-amber-600"
                                                }`} />
                                            )}
                                        </div>
                                        <p className="font-mono text-[11px] text-neutral-400 font-bold truncate mt-0.5">
                                            @{user.username || "sinefil"}
                                        </p>
                                        {user.bio && (
                                            <p className="text-[11px] text-neutral-400 line-clamp-1 mt-1.5 italic opacity-85">
                                                "{user.bio}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Row: Stats Strip & Profile Link */}
                                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-auto">
                                    <div className="flex items-center gap-2.5 sm:gap-3 text-neutral-400">
                                        <div className="flex items-center gap-1" title="İzlenenler">
                                            <Film className="w-3 h-3 text-amber-400/80" />
                                            <span className="font-mono text-[10px] font-black text-white">{user.watchedCount || 0}</span>
                                        </div>
                                        <div className="w-[1px] h-3 bg-white/10" />
                                        <div className="flex items-center gap-1" title="Rozetler">
                                            <Award className="w-3 h-3 text-amber-400/80" />
                                            <span className="font-mono text-[10px] font-black text-white">{user.achievementsCount || 0}</span>
                                        </div>
                                        <div className="w-[1px] h-3 bg-white/10" />
                                        <div className="flex items-center gap-1" title="Aktiviteler">
                                            <Zap className="w-3 h-3 text-orange-400/80" />
                                            <span className="font-mono text-[10px] font-black text-white">{user.activitiesCount || 0}</span>
                                        </div>
                                        <div className="w-[1px] h-3 bg-white/10" />
                                        <div className="flex items-center gap-1" title="Takipçiler">
                                            <Users className="w-3 h-3 text-blue-400/80" />
                                            <span className="font-mono text-[10px] font-black text-white">{user.followersCount || 0}</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={profileUrl}
                                        className="text-neutral-500 group-hover:text-amber-400 transition-colors p-1 rounded-lg hover:bg-white/5"
                                        title="Profili İncele"
                                    >
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        );
                    }))}
                </div>
            )}
        </div>
    );
}
