import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { Film, Tv, Heart, Users, MessageSquare } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FollowButton } from "@/components/social/follow-button";
import { getFollowStatus } from "@/lib/social-actions";
import { MediaCard } from "@/components/media/media-card";

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id: userId } = await params;

    // If viewing own profile via id, technically valid, but maybe redirect or just show as is.
    const isOwnProfile = session?.user?.id === userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: {
                    toWatch: true,
                    watched: true,
                    followedBy: true,
                    following: true,
                },
            },
            watched: {
                take: 5,
                orderBy: { watchedAt: "desc" },
                include: { media: true }
            }
        },
    });


    if (!user) return notFound();

    const isFollowing = session?.user?.id ? await getFollowStatus(userId) : false;

    return (
        <div className="container mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Card */}
                <div className="w-full md:w-1/3 bg-card border border-white/10 rounded-2xl p-6 shadow-xl sticky top-24">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-primary/20 relative">
                            {user.image ? (
                                <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-4xl">👤</div>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-white">{user.name}</h1>

                        <div className="flex gap-4 mt-6 w-full justify-center text-center">
                            <div>
                                <span className="block text-xl font-bold text-white">{(user as any)._count.followedBy}</span>
                                <span className="text-xs text-neutral-500">Takipçi</span>
                            </div>
                            <div>
                                <span className="block text-xl font-bold text-white">{(user as any)._count.following}</span>
                                <span className="text-xs text-neutral-500">Takip</span>
                            </div>
                        </div>

                        {!isOwnProfile && session?.user && (
                            <div className="mt-8 w-full flex flex-col gap-3 justify-center">
                                <div className="flex justify-center">
                                    <FollowButton targetUserId={userId} initialIsFollowing={isFollowing} />
                                </div>
                                <Link href={`/messages/${userId}`} className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/5 rounded-lg text-sm font-bold text-white transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                    Mesaj Gönder
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats & Activity */}
                <div className="flex-1 space-y-8 w-full">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <Film className="w-6 h-6 text-primary mb-2" />
                            <div className="text-2xl font-bold text-white">{(user as any)._count.watched}</div>
                            <div className="text-xs text-neutral-400">İzlenenler</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <Heart className="w-6 h-6 text-pink-500 mb-2" />
                            <div className="text-2xl font-bold text-white">{(user as any)._count.toWatch}</div>
                            <div className="text-xs text-neutral-400">İzlenecekler</div>
                        </div>
                        {/* More stats could go here */}
                    </div>

                    {/* Recently Watched Preview */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Son İzledikleri</h2>
                        </div>
                        {user.watched.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {user.watched.map((item) => (
                                    <MediaCard
                                        key={item.id}
                                        id={item.media.tmdbId}
                                        title={item.media.title}
                                        posterPath={item.media.posterPath}
                                        voteAverage={0}
                                        type={item.media.type === "MOVIE" ? "movie" : "tv"}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-neutral-500 text-sm">
                                Bu kullanıcı henüz bir şey izlemedi.
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
