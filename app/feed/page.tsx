import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Activity, Users, Plus, Search, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { ActivityPost } from "@/components/feed/activity-post";

async function getGroupedFeedActivities(userId: string, followingIds: string[]) {
    // Include both user's own activities and friends' activities
    const feedUserIds = [...followingIds, userId];

    const activities = await prisma.activity.findMany({
        where: {
            userId: { in: feedUserIds },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                },
            },
            media: true,
            episode: {
                select: {
                    id: true,
                    seasonNumber: true,
                    episodeNumber: true,
                    title: true,
                }
            },
            recommendedBy: {
                select: {
                    id: true,
                    name: true,
                }
            },
            _count: {
                select: { comments: true }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 100, // Fetch more to group properly
    });

    // Group consecutive episode watches
    const groupedActivities: any[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];

        if (processed.has(activity.id)) continue;

        // If this is not a TV episode watch, add it as-is
        if (!activity.episode || activity.type !== "WATCHED") {
            groupedActivities.push(activity);
            processed.add(activity.id);
            continue;
        }

        // Find consecutive episodes from same user, same show, same season
        const relatedEpisodes = [activity];
        processed.add(activity.id);

        // Look for episodes within 5 minutes of this one
        const timeWindow = 5 * 60 * 1000; // 5 minutes
        const activityTime = new Date(activity.createdAt).getTime();

        for (let j = i + 1; j < activities.length; j++) {
            const nextActivity = activities[j];

            if (processed.has(nextActivity.id)) continue;

            const nextTime = new Date(nextActivity.createdAt).getTime();
            const timeDiff = Math.abs(activityTime - nextTime);

            // Check if it's the same user, same media, same season, and within time window
            if (
                nextActivity.userId === activity.userId &&
                nextActivity.mediaId === activity.mediaId &&
                nextActivity.episode?.seasonNumber === activity.episode.seasonNumber &&
                nextActivity.type === "WATCHED" &&
                timeDiff <= timeWindow
            ) {
                relatedEpisodes.push(nextActivity);
                processed.add(nextActivity.id);
            }
        }

        // If we found multiple episodes, create a grouped activity
        if (relatedEpisodes.length > 1) {
            const episodeNumbers = relatedEpisodes
                .map(a => a.episode!.episodeNumber)
                .sort((a, b) => a - b);

            const minEpisode = Math.min(...episodeNumbers);
            const maxEpisode = Math.max(...episodeNumbers);

            groupedActivities.push({
                ...activity,
                episodeRange: {
                    seasonNumber: activity.episode.seasonNumber,
                    fromEpisode: minEpisode,
                    toEpisode: maxEpisode,
                    count: relatedEpisodes.length
                }
            });
        } else {
            // Single episode
            groupedActivities.push(activity);
        }
    }

    return groupedActivities.slice(0, 30);
}

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

    // Get grouped activities (includes user's own + friends')
    const allActivities = await getGroupedFeedActivities(session.user.id, followingIds);

    return (
        <div className=" bg-[#101624] text-neutral-100 pb-20">
            <div className="max-w-7xl mx-auto px-2 md:px-10 py-8 md:py-10">
                {/* Minimal Header */}
                <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-6 md:mb-10 pl-2 md:pl-0">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Aktivite Akışı</h1>
                    </div>
                    <p className="text-neutral-500 text-xs md:text-sm font-medium pb-1 md:pb-1.5">
                        Arkadaşlarının neler izlediğini keşfet.
                    </p>
                </div>
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Main Feed Column */}
                    <div className="flex-1 w-full space-y-4 md:space-y-12 mb-20 max-w-2xl mx-auto lg:mx-0">
                        {allActivities.length === 0 ? (
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
                            <div className="space-y-4 md:space-y-12">
                                {allActivities.map(activity => (
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
                                        {allActivities.length}
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
