"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    UserPlus,
    MessageSquare,
    Mail,
    Sparkles,
    Trophy,
    CheckCheck,
    ChevronRight,
    Loader2,
    Clock,
    X,
} from "lucide-react";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/notification-actions";

type NotificationItem = {
    id: string;
    type: string;
    message: string;
    link: string | null;
    isRead: boolean;
    image?: string | null;
    createdAt: string;
};

function formatRelativeTime(dateStr: string): string {
    try {
        const diffMs = Date.now() - new Date(dateStr).getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) return "Az önce";
        if (diffMinutes < 60) return `${diffMinutes} dk önce`;
        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} sa önce`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} gün önce`;
        return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(dateStr));
    } catch {
        return "";
    }
}

function getNotificationIcon(type: string) {
    switch (type) {
        case "NEW_FOLLOWER":
            return <UserPlus size={15} className="text-sky-400" />;
        case "NEW_COMMENT":
            return <MessageSquare size={15} className="text-emerald-400" />;
        case "NEW_RECOMMENDATION":
            return <Sparkles size={15} className="text-amber-400" />;
        case "NEW_MESSAGE":
            return <Mail size={15} className="text-blue-400" />;
        case "ACHIEVEMENT_UNLOCKED":
            return <Trophy size={15} className="text-yellow-400" />;
        default:
            return <Bell size={15} className="text-amber-400" />;
    }
}

export function PortalNotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Fetch unread count lightweight polling
    const fetchUnreadCount = async () => {
        try {
            const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(typeof data.count === "number" ? data.count : 0);
            }
        } catch {
            // Silently ignore network glitches
        }
    };

    // Initial load + live polling
    useEffect(() => {
        fetchUnreadCount();

        const interval = setInterval(fetchUnreadCount, 20000); // Poll every 20s

        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === "visible") {
                fetchUnreadCount();
            }
        };

        window.addEventListener("focus", handleVisibilityOrFocus);
        document.addEventListener("visibilitychange", handleVisibilityOrFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", handleVisibilityOrFocus);
            document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
        };
    }, []);

    // Load recent notifications when dropdown is opened
    const handleOpenDropdown = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        if (nextState) {
            setIsLoading(true);
            try {
                const res = await fetch("/api/notifications/latest", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setItems(data.items || []);
                    if (typeof data.unreadCount === "number") {
                        setUnreadCount(data.unreadCount);
                    }
                }
            } catch {
                // Silently fallback
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Close on click outside or Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleItemClick = async (item: NotificationItem) => {
        if (!item.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setItems((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
            );
            void markNotificationAsRead(item.id);
        }
        setIsOpen(false);
        if (item.link) {
            router.push(item.link);
        } else {
            router.push("/notifications");
        }
    };

    const handleMarkAllAsRead = async () => {
        setUnreadCount(0);
        setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
        await markAllNotificationsAsRead();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={handleOpenDropdown}
                aria-label="Bildirimler"
                title={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Bildirimler"}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all relative ${
                    unreadCount > 0
                        ? "text-white border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20"
                        : "text-neutral-400 hover:text-white hover:bg-white/5 border-white/5"
                }`}
            >
                <Bell className={`w-4 h-4 transition-transform ${unreadCount > 0 ? "text-amber-400 rotate-6" : ""}`} />

                {/* Animated Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-lg ring-2 ring-[#020617] animate-in zoom-in-50 duration-200">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="fixed left-3 right-3 top-[4.25rem] sm:absolute sm:left-auto sm:top-auto sm:right-0 mt-0 sm:mt-2 sm:w-96 rounded-2xl border border-white/10 bg-[#0b1120] p-0 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider text-white">
                                Bildirimler
                            </span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-black text-rose-400 border border-rose-500/30">
                                    {unreadCount} yeni
                                </span>
                            )}
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-amber-400 transition-colors"
                            >
                                <CheckCheck size={13} />
                                <span>Tümünü Oku</span>
                            </button>
                        )}
                    </div>

                    {/* Popover Content */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                                <Loader2 size={22} className="animate-spin text-amber-400 mb-2" />
                                <span className="text-xs font-medium">Bildirimler yükleniyor...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-500">
                                <Bell size={28} className="opacity-20 mb-2" />
                                <span className="text-xs font-semibold text-slate-400">Yeni bildirim bulunmuyor</span>
                                <span className="text-[11px] text-slate-600 mt-0.5">
                                    Takipçi, yorum ve önerilerin burada listelenir.
                                </span>
                            </div>
                        ) : (
                            items.map((item) => {
                                const isFollower = item.type === "NEW_FOLLOWER";
                                const avatarSrc = item.image
                                    ? item.image.startsWith("http")
                                        ? item.image
                                        : `https://image.tmdb.org/t/p/w200${item.image.startsWith("/") ? "" : "/"}${item.image}`
                                    : null;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleItemClick(item)}
                                        className={`w-full flex items-start gap-3 p-3.5 text-left transition-colors relative hover:bg-white/5 focus:outline-none ${
                                            !item.isRead ? "bg-amber-400/[0.03]" : ""
                                        }`}
                                    >
                                        {!item.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                                        )}

                                        {/* Avatar / Icon Badge */}
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                                            {avatarSrc ? (
                                                <img
                                                    src={avatarSrc}
                                                    alt="Bildirim"
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                getNotificationIcon(item.type)
                                            )}
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-xs leading-snug line-clamp-2 ${
                                                    !item.isRead ? "font-bold text-white" : "font-medium text-slate-400"
                                                }`}
                                            >
                                                {item.message}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
                                                <Clock size={11} />
                                                <span>{formatRelativeTime(item.createdAt)}</span>
                                            </div>
                                        </div>

                                        {!item.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Popover Footer */}
                    <div className="border-t border-white/10 bg-white/[0.02] p-2.5 text-center">
                        <Link
                            href="/notifications"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors py-1 px-3 rounded-lg hover:bg-amber-400/10 w-full"
                        >
                            <span>Tüm Bildirimleri Gör</span>
                            <ChevronRight size={13} />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
