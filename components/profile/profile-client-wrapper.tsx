"use client";

import { useState } from "react";
import { Settings, LogOut, User as UserIcon } from "lucide-react";
import { handleSignOut } from "@/lib/auth-actions";
import { SettingsModal } from "./settings-modal";
import Image from "next/image";
import { cn } from "@/lib/utils";

type UserData = {
    id: string;
    name: string | null;
    username: string;
    email: string | null;
    image: string | null;
    bio: string | null;
    isPrivate: boolean;
    showActivities: boolean;
    showStats: boolean;
    favoriteGenres: string[];
    platforms: string[];
    allGenres: { id: number; name: string }[];
    _count: {
        followedBy: number;
        following: number;
    };
};

export function ProfileClientWrapper({ user }: { user: UserData }) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="w-full lg:w-80 shrink-0">
            <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl sticky top-24 overflow-hidden relative group">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="flex flex-col items-center relative">
                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden mb-6 ring-4 ring-primary/20 relative shadow-2xl transition-transform group-hover:scale-105 duration-500">
                        {user.image ? (
                            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-5xl">👤</div>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-white text-center mb-1 tracking-tight">{user.name}</h1>
                    <p className="text-neutral-500 text-sm mb-2 font-bold tracking-tight">@{user.username}</p>
                    {user.bio && (
                        <p className="text-neutral-400 text-xs text-center mb-6 font-medium leading-relaxed px-4 italic line-clamp-3">
                            "{user.bio}"
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 w-full text-center border-t border-b border-white/5 py-8">
                        <div>
                            <span className="block text-xl font-black text-white tracking-tight">{user._count.followedBy}</span>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Takipçi</span>
                        </div>
                        <div>
                            <span className="block text-xl font-black text-white tracking-tight">{user._count.following}</span>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Takip</span>
                        </div>
                    </div>

                    <div className="w-full space-y-3 mt-8">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black rounded-2xl hover:bg-neutral-200 transition-all font-black text-sm active:scale-95 shadow-xl shadow-white/5"
                        >
                            <Settings className="w-4 h-4" />
                            Profili Düzenle
                        </button>

                        <form action={handleSignOut} className="w-full">
                            <button className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all text-neutral-400 font-bold text-sm active:scale-95 group">
                                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Çıkış Yap
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {isSettingsOpen && (
                <SettingsModal user={user} onClose={() => setIsSettingsOpen(false)} />
            )}
        </div>
    );
}
