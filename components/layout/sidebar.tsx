"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User, LogOut, LogIn, Users, Bell, Activity, MessageSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ... in main component ...

// ... cleaned up ...

type SidebarProps = {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
};

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl hidden md:flex flex-col">
            <div className="flex h-16 items-center px-6 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-white">
                    Watch<span className="text-primary">Go</span>
                </Link>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                <Link
                    href="/"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                        pathname === "/"
                            ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <Home className={cn("w-5 h-5", pathname === "/" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                    Ana Sayfa
                </Link>
                <Link
                    href="/search"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                        pathname === "/search"
                            ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <Search className={cn("w-5 h-5", pathname === "/search" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                    Keşfet
                </Link>

                {user && (
                    <>
                        <Link
                            href="/watchlist"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                pathname === "/watchlist"
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Heart className={cn("w-5 h-5", pathname === "/watchlist" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                            İzleme Listem
                        </Link>
                        <Link
                            href="/feed"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                pathname === "/feed"
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Activity className={cn("w-5 h-5", pathname === "/feed" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                            Akış
                        </Link>
                        <Link
                            href="/notifications"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                pathname === "/notifications"
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Bell className={cn("w-5 h-5", pathname === "/notifications" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                            Bildirimler
                        </Link>
                        <Link
                            href="/community"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                pathname === "/community"
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Users className={cn("w-5 h-5", pathname === "/community" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                            Topluluk
                        </Link>
                        <Link
                            href="/messages"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                pathname.startsWith("/messages")
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <MessageSquare className={cn("w-5 h-5", pathname.startsWith("/messages") ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                            Mesajlar
                        </Link>
                        <Link
                            href="/profile"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                pathname === "/profile"
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <User className={cn("w-5 h-5", pathname === "/profile" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                            Profil
                        </Link>
                        <Link
                            href="/stats"
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                                pathname === "/stats"
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_-5px_var(--primary)]"
                                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <BarChart3 className={cn("w-5 h-5", pathname === "/stats" ? "text-primary" : "text-neutral-500 group-hover:text-white")} />
                            İstatistikler
                        </Link>
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-white/10">
                {user ? (
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 relative">
                            {user.image ? (
                                <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
                            ) : (
                                <User className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neutral-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                        </div>
                    </div>
                ) : (
                    <Link href="/login" className="flex items-center gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white">
                        <LogIn className="w-4 h-4" />
                        Giriş Yap
                    </Link>
                )}
            </div>
        </aside>
    );
}
