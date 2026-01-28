"use client";

import { useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

type Notification = {
    id: string;
    type: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: Date;
};

type NotificationsListProps = {
    initialNotifications: Notification[];
};

export function NotificationsList({ initialNotifications }: NotificationsListProps) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [filter, setFilter] = useState<"ALL" | "UNREAD">("ALL");

    const filteredNotifications = filter === "ALL"
        ? notifications
        : notifications.filter(n => !n.isRead);

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

    const getIcon = (type: string) => {
        switch (type) {
            case "NEW_FOLLOWER":
                return <UserPlus className="w-5 h-5 text-blue-400" />;
            case "NEW_COMMENT":
                return <MessageSquare className="w-5 h-5 text-emerald-400" />;
            case "NEW_RECOMMENDATION":
                return <Sparkles className="w-5 h-5 text-amber-400" />;
            case "MENTION":
                return <div className="w-5 h-5 flex items-center justify-center font-black text-purple-400 text-lg">@</div>;
            default:
                return <Bell className="w-5 h-5 text-neutral-400" />;
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                        <Bell className="w-8 h-8 text-primary animate-bounce-slow" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Bildirimler</h1>
                        <p className="text-neutral-500 text-sm font-medium">Son aktivitelerden haberdar ol</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white/5 p-1 rounded-xl border border-white/5 flex gap-1">
                        <button
                            onClick={() => setFilter("ALL")}
                            className={cn(
                                "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                filter === "ALL" ? "bg-primary text-background shadow-lg" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Tümü
                        </button>
                        <button
                            onClick={() => setFilter("UNREAD")}
                            className={cn(
                                "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                                filter === "UNREAD" ? "bg-primary text-background shadow-lg" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Okunmamış
                            {notifications.filter(n => !n.isRead).length > 0 && (
                                <span className={cn(
                                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
                                    filter === "UNREAD" ? "bg-background text-primary" : "bg-primary text-background"
                                )}>
                                    {notifications.filter(n => !n.isRead).length}
                                </span>
                            )}
                        </button>
                    </div>

                    {notifications.some(n => !n.isRead) && (
                        <button
                            onClick={handleMarkAllRead}
                            className="p-2.5 bg-white/5 text-neutral-400 hover:text-white border border-white/5 rounded-xl transition-all group"
                            title="Tümünü Okundu İşaretle"
                        >
                            <MailOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredNotifications.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-24 text-center bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed"
                        >
                            <div className="p-6 bg-neutral-800/50 rounded-full mb-4">
                                <Ghost className="w-12 h-12 text-neutral-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Tertemiz bir sayfa!</h3>
                            <p className="text-neutral-500 max-w-xs text-sm">
                                {filter === "UNREAD"
                                    ? "Tüm bildirimlerini okumuşsun, harika!"
                                    : "Henüz bir bildirim almadın. Arkadaşlarını takip ederek başla."}
                            </p>
                        </motion.div>
                    ) : (
                        filteredNotifications.map((notification, index) => {
                            const content = (
                                <div className="flex gap-5 items-start">
                                    <div className={cn(
                                        "p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-500",
                                        notification.isRead ? "bg-neutral-800" : "bg-white/5"
                                    )}>
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className={cn(
                                                    "text-sm leading-relaxed block transition-colors",
                                                    !notification.isRead ? "text-white font-bold" : "text-neutral-400 font-medium"
                                                )}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-[10px] text-neutral-500 flex items-center gap-1 font-bold uppercase tracking-wider">
                                                        <Clock className="w-3 h-3" />
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Yeni</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification.id);
                                                        }}
                                                        className="p-2 text-neutral-500 hover:text-primary hover:bg-white/5 rounded-xl transition-all relative z-10"
                                                        title="Okundu İşaretle"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {notification.link && (
                                                    <div className="p-2 text-neutral-500 hover:text-white transition-all">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );

                            return (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "group rounded-3xl border transition-all relative overflow-hidden",
                                        notification.isRead
                                            ? "bg-slate-900/40 border-white/5 opacity-70 grayscale-[0.5]"
                                            : "bg-white/10 border-white/10 shadow-2xl shadow-black/20 hover:border-primary/30"
                                    )}
                                >
                                    <Link
                                        href={notification.link || "#"}
                                        className="block p-5"
                                        onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                                    >
                                        {/* Unread dot */}
                                        {!notification.isRead && (
                                            <div className="absolute top-0 right-0 p-3">
                                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#fbbf24]" />
                                            </div>
                                        )}
                                        {content}
                                    </Link>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
