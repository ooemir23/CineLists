import Image from "next/image";
import { Lock } from "lucide-react";
import { FollowButton } from "@/components/social/follow-button";

interface PrivateProfileNoticeProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string | null;
    _count: { followedBy: number; following: number };
  };
  isFollowing: boolean;
  currentUserId?: string;
}

export function PrivateProfileNotice({
  user,
  isFollowing,
  currentUserId,
}: PrivateProfileNoticeProps) {
  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden ring-2 ring-white/10 mb-4">
          {user.image ? (
            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-900/20 flex items-center justify-center text-3xl">
              {user.name?.charAt(0)?.toUpperCase() || "👤"}
            </div>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white">
          {user.username ? `@${user.username}` : user.name}
        </h1>
        {user.name && user.username && (
          <p className="text-sm text-neutral-400 mt-0.5">{user.name}</p>
        )}

        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white">{user._count.followedBy}</span>
            <span className="text-sm text-neutral-400">Takipçi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-white">{user._count.following}</span>
            <span className="text-sm text-neutral-400">Takip</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 p-8 bg-white/5 rounded-2xl border border-white/10 max-w-sm w-full">
          <div className="p-4 bg-white/5 rounded-full border border-white/10">
            <Lock className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-neutral-300 font-semibold">Bu hesap gizli</p>
          <p className="text-sm text-neutral-500">
            İzlediklerini, listelerini ve istatistiklerini görmek için bu kullanıcıyı takip etmen gerekiyor.
          </p>
          {currentUserId && currentUserId !== user.id && (
            <FollowButton targetUserId={user.id} initialIsFollowing={isFollowing} />
          )}
        </div>
      </div>
    </div>
  );
}
