"use client";

import Image from "next/image";
import { Heart, Users, Mail, Share2, UserPlus, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  name: string | null;
  username: string;
  bio: string | null;
  image: string | null;
  coverImage?: string | null;
  followedBy: number;
  following: number;
  isPrivate?: boolean;
  isOwnProfile?: boolean;
}

export function ProfileHeader({
  name,
  username,
  bio,
  image,
  coverImage,
  followedBy,
  following,
  isPrivate = false,
  isOwnProfile = false,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950 border-b border-white/5 overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-32 sm:h-40 md:h-56 lg:h-72 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-purple-900/20">
        {coverImage && !imageError ? (
          <Image
            src={coverImage}
            alt="Cover"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-900/20 to-neutral-900/50 backdrop-blur-sm" />
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />

        {/* Action Buttons (Top Right) */}
        {!isOwnProfile && (
          <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 flex gap-2 z-10">
            <button className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all active:scale-95">
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </button>
            <button className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all active:scale-95">
              <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="relative px-3 sm:px-6 md:px-8 lg:px-12 pb-6 md:pb-8">
        {/* Profile Image - Negative Margin for Overlay */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 md:gap-8">
          <div className="flex-shrink-0 -mt-16 sm:-mt-20 md:-mt-24">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden ring-4 ring-neutral-950 shadow-2xl group">
              {image && !imageError ? (
                <Image
                  src={image}
                  alt={name || "User"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-900/30 flex items-center justify-center text-5xl sm:text-5xl md:text-6xl">
                  👤
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 flex flex-col justify-end gap-3 sm:gap-4 pb-0 sm:pb-2">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight truncate">
                {name || "Kullanıcı"}
              </h1>
              <p className="text-neutral-400 text-sm sm:text-base font-bold truncate">@{username}</p>

              {bio && (
                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-2">
                  {bio}
                </p>
              )}
            </div>

            {/* Follow Stats - Inline */}
            <div className="flex gap-6 sm:gap-8 pt-2">
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                  {followedBy}
                </span>
                <span className="text-[9px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Takipçi
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                  {following}
                </span>
                <span className="text-[9px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  Takip Edilen
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto flex-row sm:flex-col sm:flex-shrink-0">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-black text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 whitespace-nowrap">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mesaj</span>
              </button>
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 font-black text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all active:scale-95 shadow-lg whitespace-nowrap",
                  isFollowing
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                    : "bg-white text-black hover:bg-neutral-200 shadow-white/10"
                )}
              >
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{isFollowing ? "Takip Ediliyor" : "Takip Et"}</span>
                <span className="sm:hidden">{isFollowing ? "Ediliyor" : "Takip"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
