"use client";

import { useState } from "react";
import Image from "next/image";
import {
    Bell,
    UserPlus,
    MessageSquare,
    Star,
    Check,
    Clock,
    ChevronRight,
    Trash2,
    Sparkles,
    Ghost,
    MailOpen
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/notification-actions";
// framer-motion removed — list animations replaced with CSS animate-in utilities

type Notification = {
    id: string;
    type: string;
    message: string;
    link: string | null;
    isRead: boolean;
    image?: string | null;
    createdAt: Date;
};

type NotificationsListProps = {
    initialNotifications: Notification[];
};

function NotificationMedia({ 
    type, 
    image, 
    message 
}: { 
    type: string; 
    image?: string | null; 
    message: string; 
}) {
    const [imgError, setImgError] = useState(false);

    const getIcon = () => {
        switch (type) {
            case "NEW_FOLLOWER":
                return <UserPlus className="w-5 h-5 text-blue-400" />;
            case "NEW_COMMENT":
                return <MessageSquare className="w-5 h-5 text-emerald-400" />;
            case "NEW_RECOMMENDATION":
                return <Sparkles className="w-5 h-5 text-amber-400" />;
            case "MENTION":
                return <span className="w-5 h-5 flex items-center justify-center font-black text-purple-400 text-sm">@</span>;
            default:
                return <Bell className="w-5 h-5 text-neutral-400" />;
        }
    };

    if (!image || imgError) {
        return (
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                {getIcon()}
            </div>
        );
    }

    const isAbsoluteUrl = image.startsWith("http://") || image.startsWith("https://");
    const isFollower = type === "NEW_FOLLOWER";
    const src = isAbsoluteUrl ? image : `https://image.tmdb.org/t/p/w200${image.startsWith("/") ? "" : "/"}${image}`;

    if (isFollower) {
        return (
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden ring-2 ring-blue-400/30 shrink-0 shadow-lg bg-white/5">
                <img
                    src={src}
                    alt={message}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    return (
        <div className="relative w-10 h-14 rounded-xl overflow-hidden ring-1 ring-white/10 shrink-0 shadow-xl bg-white/5">
            <img
                src={src}
                alt="İçerik afişi"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
            />
        </div>
    );
}

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

    const filteredNotifications = filter === "ALL"
        ? notifications
        : notifications.filter(n => !n.isRead);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (id: string) => {
        const res = await markNotificationAsRead(id);
        if (res.success) {
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
        }
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead();
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header / Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-400/5">
                        <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl sm:text-3xl font-bricolage font-extrabold text-white tracking-tight">
                                Bildirimler
                            </h1>
                            {unreadCount > 0 && (
                                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                                    {unreadCount} yeni
                                </span>
                            )}
                        </div>
                        <p className="text-neutral-400 text-xs sm:text-sm font-medium">
                            Son aktiviteler ve seninle ilgili tüm gelişmeler
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-1">
                        <button
                            onClick={() => setFilter("ALL")}
                            className={cn(
                                "px-4 py-2 text-xs font-black rounded-xl transition-all",
                                filter === "ALL" 
                                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20" 
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setFilter("UNREAD")}
                            className={cn(
                                "px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2",
                                filter === "UNREAD" 
                                    ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20" 
                                    : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Okunmamış
                            {unreadCount > 0 && (
                                <span className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black",
                                    filter === "UNREAD" ? "bg-slate-950 text-amber-400" : "bg-amber-400/20 text-amber-400"
                                )}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="p-2.5 bg-white/5 hover:bg-amber-400/10 text-neutral-400 hover:text-amber-400 border border-white/10 rounded-2xl transition-all group"
                            title="Tümünü Okundu İşaretle"
                        >
                            <MailOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-[#0e1626]/50 rounded-3xl border border-white/5 border-dashed animate-in fade-in duration-300 px-4">
                        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4">
                            <Ghost className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bricolage font-bold text-white mb-1.5">
                            {filter === "UNREAD" ? "Okunmamış bildirim yok!" : "Henüz bir bildirim almadın"}
                        </h3>
                        <p className="text-neutral-400 max-w-sm text-xs sm:text-sm leading-relaxed mb-6">
                            {filter === "UNREAD"
                                ? "Tüm bildirimlerini kontrol ettin, harika gidiyorsun!"
                                : "Topluluk sayfasından diğer sinefilleri takip ederek son aktivitelerden haberdar olabilirsin."}
                        </p>
                        {filter === "ALL" && (
                            <Link
                                href="/community"
                                className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/10 uppercase tracking-wider"
                            >
                                Topluluğu Keşfet
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredNotifications.map((notification, index) => {
                        return (
                            <div
                                key={notification.id}
                                className={cn(
                                    "group rounded-2xl border transition-all relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    notification.isRead
                                        ? "bg-white/[0.02] border-white/5 opacity-75 hover:opacity-100 hover:bg-white/[0.04]"
                                        : "bg-[#0e1626]/80 border-white/10 hover:border-amber-400/30 shadow-lg shadow-black/20"
                                )}
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                <Link
                                    href={notification.link || "#"}
                                    className="flex items-center gap-4 p-4 sm:p-5"
                                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                >
                                    {/* Media: Avatar / Poster / Fallback Icon */}
                                    <NotificationMedia 
                                        type={notification.type} 
                                        image={notification.image} 
                                        message={notification.message} 
                                    />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-xs sm:text-sm leading-relaxed transition-colors line-clamp-2",
                                            !notification.isRead ? "text-white font-bold" : "text-neutral-400 font-medium"
                                        )}>
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                                            </span>
                                            {!notification.isRead && (
                                                <span className="text-[9px] bg-amber-400/15 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                    Yeni
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!notification.isRead && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleMarkAsRead(notification.id);
                                                }}
                                                className="p-2 text-neutral-500 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-all"
                                                title="Okundu İşaretle"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        {notification.link && (
                                            <div className="p-1.5 text-neutral-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Unread indicator bar */}
                                    {!notification.isRead && (
                                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-400" />
                                    )}
                                </Link>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
