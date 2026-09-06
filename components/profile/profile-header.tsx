"use client";

import Image from "next/image";
import { Mail, Share2, UserPlus, MoreHorizontal, Settings, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  name: string | null;
  username: string;
  bio: string | null;
  image: string | null;
  followedBy: number;
  following: number;
  watchedCount?: number;
  isPrivate?: boolean;
  isOwnProfile?: boolean;
  isVerified?: boolean;
  joinedAt?: Date | null;
  onSettingsClick?: () => void;
}

export function ProfileHeader({
  name,
  username,
  bio,
  image,
  followedBy,
  following,
  watchedCount = 0,
  isPrivate = false,
  isOwnProfile = false,
  isVerified = false,
  joinedAt: _joinedAt,
  onSettingsClick,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const stats = [
    { label: "Gönderi", value: watchedCount },
    { label: "Takipçi", value: followedBy },
    { label: "Takip", value: following },
  ];

  return (
    <div className="w-full bg-background border-b border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-8">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden ring-2 ring-white/10 group">
              {image && !imageError ? (
                <Image
                  src={image}
                  alt={name || "User"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  priority
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, 128px"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-900/20 flex items-center justify-center text-3xl sm:text-4xl">
                  {name?.charAt(0)?.toUpperCase() || "👤"}
                </div>
              )}
            </div>
          </div>

          {/* Profile Info & Actions */}
          <div className="flex-1 min-w-0">
            {/* Top: Username + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                  {username || "kullanici"}
                </h1>
                {isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-primary fill-primary flex-shrink-0" />
                )}
                {isPrivate && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-400 font-bold uppercase tracking-wide">
                    Gizli
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={onSettingsClick}
                      className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Profili Düzenle
                    </button>
                    <button className="p-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-all active:scale-95">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsFollowing(!isFollowing)}
                      className={cn(
                        "px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all active:scale-95 flex items-center gap-1.5",
                        isFollowing
                          ? "bg-white/10 hover:bg-white/15 text-white"
                          : "bg-primary text-black hover:bg-primary/90"
                      )}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {isFollowing ? "Takip Ediliyor" : "Takip Et"}
                    </button>
                    <button className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold rounded-lg transition-all active:scale-95 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      Mesaj
                    </button>
                    <button className="p-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg transition-all active:scale-95">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Row - Instagram Style */}
            <div className="hidden sm:flex items-center gap-6 mb-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-neutral-400">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Name & Bio */}
            <div className="space-y-0.5">
              {name && (
                <h2 className="text-sm font-semibold text-white">{name}</h2>
              )}
              {bio && (
                <p className="text-sm text-neutral-300 leading-relaxed line-clamp-3 max-w-2xl">
                  {bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Stats - Bottom Row */}
        <div className="flex sm:hidden items-center justify-around mt-4 pt-4 border-t border-white/5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="text-base font-bold text-white">{stat.value}</span>
              <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
