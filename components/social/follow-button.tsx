"use client";

import { useTransition, useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toggleFollow } from "@/lib/social-actions";
import { cn } from "@/lib/utils";

type FollowButtonProps = {
    targetUserId: string;
    initialIsFollowing: boolean;
};

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        setIsFollowing((prev) => !prev); // Optimistic update

        startTransition(async () => {
            const result = await toggleFollow(targetUserId);
            if (result.error) {
                setIsFollowing(initialIsFollowing); // Revert on error
                // Optionally show toast
            }
        });
    };

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all active:scale-95",
                isFollowing
                    ? "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                    : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
            )}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
                <UserCheck className="w-4 h-4" />
            ) : (
                <UserPlus className="w-4 h-4" />
            )}
            {isFollowing ? "Takip Ediliyor" : "Takip Et"}
        </button>
    );
}
