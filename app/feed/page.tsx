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
        <div className="bg-[#0f1424] text-neutral-100 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Akış</h1>
                            <p className="text-[11px] text-neutral-500 font-medium">Arkadaşların ne izliyor?</p>
                        </div>
                    </div>
                    <Link
                        href="/community"
                        className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-neutral-200 transition-all"
                    >
                        <Search className="w-4 h-4" />
                        Takip Et
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="flex-1 w-full space-y-3">
                        {allActivities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/5 text-center px-8 shadow-xl">
                                <div className="p-4 bg-primary/10 rounded-full mb-4">
                                    <Users className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-lg font-bold text-white mb-2">Akış Boş</h2>
                                <p className="text-neutral-400 mb-5 max-w-xs mx-auto text-xs">
                                    Yeni içerikler görmek için takip etmeye başla.
                                </p>
                                <Link
                                    href="/community"
                                    className="px-5 py-2.5 bg-primary text-background font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-xs"
                                >
                                    <Search className="w-4 h-4" />
                                    Arkadaş Bul
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allActivities.map(activity => (
                                    <ActivityPost key={activity.id} activity={activity as any} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:block w-72 shrink-0 space-y-4 sticky top-24">
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 shadow-lg">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-primary" />
                                Özet
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-400 text-xs font-medium">Takip Ettiklerin</span>
                                    <span className="bg-white/5 px-2 py-1 rounded-full text-[10px] font-bold text-white border border-white/5">
                                        {followingIds.length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-400 text-xs font-medium">Toplam Aktivite</span>
                                    <span className="bg-white/5 px-2 py-1 rounded-full text-[10px] font-bold text-white border border-white/5">
                                        {allActivities.length}
                                    </span>
                                </div>
                            </div>
                            <Link
                                href="/profile"
                                className="mt-4 block w-full text-center py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold border border-white/5 transition-all text-neutral-300 hover:text-white"
                            >
                                Profil
                            </Link>
                        </div>

                        <div className="bg-gradient-to-br from-primary/15 to-blue-500/5 border border-primary/10 rounded-2xl p-4 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-white font-bold text-sm mb-1">Daha fazla aktivite</h3>
                                <p className="text-neutral-300 text-[11px] leading-relaxed mb-3">
                                    Yeni insanları takip ederek akışını güçlendir.
                                </p>
                                <Link href="/community" className="text-primary font-bold text-[11px] flex items-center gap-1">
                                    Topluluk <Plus className="w-3 h-3" />
                                </Link>
                            </div>
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Users className="w-14 h-14" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
