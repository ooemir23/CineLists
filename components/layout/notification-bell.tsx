"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { getUnreadNotificationCount } from "@/lib/notification-actions";

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        };

        let interval: ReturnType<typeof setInterval> | null = null;

        fetchCount();

        const startPolling = () => {
            if (interval) return;
            interval = setInterval(fetchCount, 300000);
        };

        const stopPolling = () => {
            if (!interval) return;
            clearInterval(interval);
            interval = null;
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchCount();
                startPolling();
            } else {
                stopPolling();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        startPolling();

        return () => {
            stopPolling();
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return (
        <Link href="/notifications" className="relative p-2.5 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-all group">
            <Bell size={22} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-950 animate-in zoom-in-0 duration-300">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </Link>
    );
}
