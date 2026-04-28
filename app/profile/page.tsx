import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";
import { getUserStats } from "@/lib/stats-actions";
import { redirect } from "next/navigation";
import { Activity as ActivityIcon, Settings } from "lucide-react";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { FavoritePersons } from "@/components/profile/favorite-persons";
import { GenreTags } from "@/components/profile/genre-tags";
import { SettingsButton } from "@/components/profile/settings-button";

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const isGuest = (session.user as any).isGuest;

    if (isGuest) {
        redirect("/login");
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
            <div className="flex items-center justify-center ">
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
        <div className="w-full min-h-screen bg-neutral-950">
            {/* Profile Header */}
            <ProfileHeader
                name={user.name}
                username={user.username}
                bio={user.bio}
                image={user.image}
                coverImage={null}
                followedBy={user._count.followedBy}
                following={user._count.following}
                isPrivate={user.isPrivate}
                isOwnProfile={true}
            />

            {/* Main Content */}
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
                    {/* Top Section: Stats & Quick Actions */}
                    <div className="space-y-4 sm:space-y-6 md:space-y-8">
                        {/* Stats */}
                        <ProfileStats
                            movieCount={stats.movieCount}
                            showCount={stats.showCount}
                            watchlistCount={user._count.toWatch}
                            watchedCount={user._count.watched}
                            showStats={user.showStats}
                            isCompact={true}
                        />

                        {/* Genre Tags */}
                        {user.favoriteGenres.length > 0 && (
                            <GenreTags
                                genres={allGenres}
                                favoriteGenreIds={user.favoriteGenres}
                                maxDisplay={8}
                            />
                        )}
                    </div>

                    {/* Two Column Layout: Activities & Persons */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
                        {/* Activities Section */}
                        <section className="space-y-3 sm:space-y-4">
                            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                                <ActivityIcon className="w-5 h-5 text-primary" />
                                Son Aktiviteler
                            </h2>
                            <ProfileActivity
                                activities={user.activities}
                                showActivities={user.showActivities}
                                variant="list"
                            />
                        </section>

                        {/* Favorite Persons Section */}
                        <section className="space-y-3 sm:space-y-4">
                            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 tracking-tight">
                                <span className="text-primary">❤️</span>
                                Favori Oyuncular
                            </h2>
                            <FavoritePersons
                                persons={user.favoritePersons}
                                maxDisplay={8}
                                variant="grid"
                            />
                        </section>
                    </div>

                    {/* Settings Button */}
                    <div className="flex justify-center pt-2 sm:pt-4">
                        <SettingsButton user={userData as any} />
                    </div>
                </div>
            </div>
        </div>
    );
}
