import { auth } from "@/auth";
import { searchUsers, getFollowStatus, getGlobalActiveUsers } from "@/lib/social-actions";
import { UserSearchInput } from "@/components/social/user-search-input";
import { FollowButton } from "@/components/social/follow-button";
import Image from "next/image";
import Link from "next/link";
import { Users, Award, Zap, Search, Trophy, Medal } from "lucide-react";

export default async function CommunityPage(props: { searchParams: Promise<{ q?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await auth();
    const query = searchParams?.q || "";
    const currentUserId = session?.user?.id;

    let users: any[] = [];
    let topUsers: any[] = [];

    if (query) {
        users = await searchUsers(query);
    } else {
        topUsers = await getGlobalActiveUsers();
    }

    return (
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-12 min-h-[70vh] flex flex-col">
            {/* Minimal Header Section */}
            <div className={`flex flex-col items-center transition-all duration-700 ease-in-out ${!query ? "mt-1 sm:mt-4 mb-8 sm:mb-14" : "mb-6 sm:mb-10"}`}>
                <div className="relative group mb-4">
                    <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-12 h-12 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                        <Users className="w-6 h-6 text-amber-400" />
                    </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">Topluluk</h1>
                <p className="text-neutral-500 font-medium text-xs md:text-sm mb-8 text-center max-w-sm opacity-80">
                    Sinefilleri keşfet, takip et ve listelerine göz at.
                </p>
                
                <div className="w-full max-w-lg relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-500" />
                    <div className="relative">
                        <UserSearchInput />
                    </div>
                </div>
            </div>

            {/* Results or Leaderboard Section */}
            {query ? (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                        <Search className="w-4 h-4 text-amber-400" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">
                            Sonuçlar <span className="text-neutral-500 ml-1 font-bold">({users.length})</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {await Promise.all(users.map(async (user) => {
                            const isFollowing = currentUserId ? await getFollowStatus(user.id) : false;

                            return (
                                <div key={user.id} className="group bg-slate-900/40 hover:bg-slate-900/60 border border-white/5 hover:border-amber-400/30 rounded-2xl p-4 transition-all flex items-center justify-between">
                                    <Link href={`/profile/${user.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 shrink-0 border border-white/10 group-hover:border-amber-400/50 transition-colors shadow-lg">
                                            {user.image ? (
                                                <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-neutral-500">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-white truncate group-hover:text-amber-400 transition-colors">{user.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1" title="Rozetler">
                                                    <Award className="w-3 h-3 text-amber-400/70" />
                                                    <span className="text-[10px] font-black text-neutral-400">{user.achievementsCount || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title="Aktiviteler">
                                                    <Zap className="w-3 h-3 text-orange-400/70" />
                                                    <span className="text-[10px] font-black text-neutral-400">{user.activitiesCount || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-1" title="Takipçiler">
                                                    <Users className="w-3 h-3 text-blue-400/70" />
                                                    <span className="text-[10px] font-black text-neutral-400">{user.followersCount || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    {currentUserId && currentUserId !== user.id && (
                                        <div className="ml-4">
                                            <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                                        </div>
                                    )}
                                </div>
                            );
                        }))}
                    </div>

                    {users.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <p className="text-neutral-500 font-bold uppercase text-xs tracking-widest italic">Kullanıcı bulunamadı.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex items-center justify-between mb-8 opacity-60">
                    <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">En Aktif 10 Sinefil</h2>
                    <div className="h-[1px] flex-1 mx-4 bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {await Promise.all(topUsers.map(async (user, index) => {
                            const isFollowing = currentUserId ? await getFollowStatus(user.id) : false;
                            const isTop3 = index < 3;

                            return (
                                <div key={user.id} className="relative group bg-slate-900/20 hover:bg-slate-900/40 border border-white/5 hover:border-amber-400/20 rounded-2xl p-4 transition-all flex items-center justify-between">
                                    {/* Rank Badge */}
                                    <div className={`absolute -left-2 -top-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg z-10 ${
                                        index === 0 ? "bg-amber-400 text-slate-950" : 
                                        index === 1 ? "bg-slate-300 text-slate-950" : 
                                        index === 2 ? "bg-amber-700 text-white" : 
                                        "bg-slate-800 text-slate-400 border border-white/5"
                                    }`}>
                                        {index + 1}
                                    </div>

                                    <Link href={`/profile/${user.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`relative w-14 h-14 rounded-2xl overflow-hidden bg-white/5 shrink-0 border transition-all ${isTop3 ? "border-amber-400/30 ring-2 ring-amber-400/10" : "border-white/10 group-hover:border-amber-400/30"}`}>
                                            {user.image ? (
                                                <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-neutral-500">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-white truncate text-base group-hover:text-amber-400 transition-colors">{user.name}</h3>
                                                {isTop3 && <Medal className={`w-3.5 h-3.5 ${index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : "text-amber-700"}`} />}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-amber-400 leading-none">{user.achievementsCount || 0}</span>
                                                    <span className="text-[8px] font-bold text-neutral-500 uppercase mt-0.5">Rozet</span>
                                                </div>
                                                <div className="w-[1px] h-4 bg-white/10" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-orange-400 leading-none">{user.activitiesCount || 0}</span>
                                                    <span className="text-[8px] font-bold text-neutral-500 uppercase mt-0.5">Aktivite</span>
                                                </div>
                                                <div className="w-[1px] h-4 bg-white/10" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-blue-400 leading-none">{user.followersCount || 0}</span>
                                                    <span className="text-[8px] font-bold text-neutral-500 uppercase mt-0.5">Takipçi</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    {currentUserId && currentUserId !== user.id && (
                                        <div className="ml-4">
                                            <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                                        </div>
                                    )}
                                </div>
                            );
                        }))}
                    </div>
                </div>
            )}
        </div>
    );
}
