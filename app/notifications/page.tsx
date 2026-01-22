import { auth } from "@/auth";
import { getNotifications, markAllNotificationsAsRead } from "@/lib/notification-actions";
import { Bell, UserPlus, MessageSquare, Star, Check } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const notifications = await getNotifications();

    // Mark auto-read on visit specific ones? Or provide a button "Mark all read".
    // Let's provide a form/button to mark all read at the top.

    return (
        <div className="container mx-auto px-6 py-10 min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold text-white">Bildirimler</h1>
                </div>

                {notifications.some(n => !n.isRead) && (
                    <form action={markAllNotificationsAsRead}>
                        <button className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                            <Check className="w-4 h-4" />
                            Tümünü Okundu İşaretle
                        </button>
                    </form>
                )}
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-20 text-neutral-500">
                        Henüz bildiriminiz yok.
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`p-4 rounded-xl border flex gap-4 ${notification.isRead
                                    ? "bg-card border-white/5 opacity-70"
                                    : "bg-white/10 border-primary/20 shadow-lg shadow-black/20"
                                }`}
                        >
                            <div className="mt-1">
                                {notification.type === "NEW_FOLLOWER" && <UserPlus className="w-5 h-5 text-blue-400" />}
                                {notification.type === "NEW_COMMENT" && <MessageSquare className="w-5 h-5 text-green-400" />}
                                {notification.type === "MENTION" && <span className="text-lg">@</span>}
                            </div>
                            <div className="flex-1">
                                <Link
                                    href={notification.link || "#"}
                                    className={`block hover:text-primary transition-colors ${!notification.isRead && "font-bold text-white"}`}
                                >
                                    {notification.message}
                                </Link>
                                <p className="text-xs text-neutral-500 mt-1">
                                    {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: tr })}
                                </p>
                            </div>
                            {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
