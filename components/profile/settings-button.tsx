"use client";

import { Settings } from "lucide-react";
import Link from "next/link";

export function SettingsButton({ user: _user }: { user?: any }) {
    return (
        <Link
            href="/settings/general"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
            <Settings className="w-5 h-5" />
            Profili Düzenle
        </Link>
    );
}
