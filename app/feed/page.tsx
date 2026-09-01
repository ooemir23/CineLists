import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FeedClient } from "@/components/feed/feed-client";

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

    try {
        // Get IDs of users I follow
        const following = await prisma.follow.findMany({
            where: { followerId: session.user.id },
            select: { followingId: true },
        });

        const followingIds = following.map(f => f.followingId);

        // Fetch feed activities, suggested users, trending reviews and user stats in parallel
        const [
            allActivities,
            suggestedUsers,
            trendingReviews,
            currentUser
        ] = await Promise.all([
            getGroupedFeedActivities(session.user.id, followingIds),
            prisma.user.findMany({
                where: {
                    id: { notIn: [...followingIds, session.user.id] },
                    isPrivate: false,
                },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    _count: {
                        select: {
                            watched: true,
                            followedBy: true,
                        }
                    }
                },
                orderBy: {
                    watched: { _count: "desc" }
                },
                take: 4,
            }).catch(() => []),
            prisma.activity.findMany({
                where: {
                    OR: [
                        { type: "REVIEWED" },
                        { review: { not: null } }
                    ],
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            image: true,
                        }
                    },
                    media: true
                },
                orderBy: {
                    createdAt: "desc"
                },
                take: 3
            }).catch(() => []),
            prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    bio: true,
                    _count: {
                        select: {
                            watched: true,
                            toWatch: true,
                            following: true,
                            followedBy: true,
                        }
                    }
                }
            }).catch(() => null)
        ]);

        return (
            <FeedClient 
                initialActivities={allActivities} 
                sessionUserId={session.user.id} 
                followingCount={followingIds.length}
                suggestedUsers={suggestedUsers}
                trendingReviews={trendingReviews}
                currentUser={currentUser}
            />
        );
    } catch (error) {
        console.warn("[Feed] Database unavailable:", error);
        return (
            <FeedClient 
                initialActivities={[]} 
                sessionUserId={session.user.id} 
                followingCount={0}
                suggestedUsers={[]}
                trendingReviews={[]}
                currentUser={null}
            />
        );
    }
}
