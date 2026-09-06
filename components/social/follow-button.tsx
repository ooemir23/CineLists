"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFollow } from "@/lib/social-actions";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      const result = await toggleFollow(targetUserId);
      
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      const newState = Boolean(result?.isFollowing);
      setIsFollowing(newState);
      onFollowChange?.(newState);
      toast.success(newState ? "Takip edildi" : "Takip bırakıldı");
    } catch (error: any) {
      console.error("Follow error:", error);
      toast.error(error?.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollowClick}
      disabled={isLoading}
      className={cn(
        "px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50",
        isFollowing
          ? "bg-white/10 hover:bg-white/15 text-white border border-white/20"
          : "bg-primary text-black hover:bg-primary/90"
      )}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Takip Ediliyor</span>
          <span className="sm:hidden">Ediliyor</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Takip Et</span>
        </>
      )}
    </button>
  );
}
