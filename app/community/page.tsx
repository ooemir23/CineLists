import { auth } from "@/auth";
import { searchUsers, getFollowStatus } from "@/lib/social-actions";
import { UserSearchInput } from "@/components/social/user-search-input";
import { FollowButton } from "@/components/social/follow-button";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma"; // Direct prisma access for initial load if needed

export default async function CommunityPage({ searchParams }: { searchParams: { q?: string } }) {
    const session = await auth();
    const query = searchParams.q || "";

    // Verify session for follow status checks
    const currentUserId = session?.user?.id;

    let users = [];
    if (query) {
        users = await searchUsers(query);
    } else {
        // Show some recommended or recent users if no query
        const recentUsers = await prisma.user.findMany({
            take: 12,
            orderBy: { id: 'desc' }, // Just mockup ordering
            where: {
                NOT: {
                    id: currentUserId // Don't show self
                }
            },
            select: {
                id: true,
                name: true,
                image: true,
                _count: {
                    select: { followedBy: true, following: true } // Correct relation name
                }
            }
        });

        users = recentUsers.map(u => ({
            ...u,
            followersCount: (u as any)._count.followedBy // Type mapping fix
        }));
    }

    return (
        <div className="container mx-auto px-6 py-10 min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <Users className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-white">Topluluk</h1>
            </div>

            <div className="max-w-xl mx-auto mb-10">
                <UserSearchInput />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(async (user) => {
                    const isFollowing = currentUserId ? await getFollowStatus(user.id) : false;

                    return (
                        <div key={user.id} className="bg-card border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-colors">
                            <Link href={`/profile/${user.id}`} className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 relative ring-2 ring-transparent group-hover:ring-primary transition-all">
                                    {user.image ? (
                                        <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{user.name}</h3>
                                    <p className="text-xs text-neutral-400">{(user as any)._count?.followedBy || 0} Takipçi</p>
                                </div>
                            </Link>

                            {currentUserId && currentUserId !== user.id && (
                                <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
                            )}
                        </div>
                    );
                })}
            </div>

            {users.length === 0 && query && (
                <div className="text-center text-neutral-500 mt-10">
                    Kullanıcı bulunamadı.
                </div>
            )}
        </div>
    );
}
