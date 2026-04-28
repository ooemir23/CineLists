"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { SettingsModal } from "./settings-modal";

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

export function SettingsButton({ user }: { user: UserData }) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
                <Settings className="w-5 h-5" />
                Profili Düzenle
            </button>

            {isSettingsOpen && (
                <SettingsModal user={user} onClose={() => setIsSettingsOpen(false)} />
            )}
        </>
    );
}
