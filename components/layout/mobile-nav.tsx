"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Ana Sayfa", href: "/", icon: Home },
    { label: "Keşfet", href: "/search", icon: Search },
    { label: "Listem", href: "/watchlist", icon: Heart },
    { label: "Profil", href: "/profile", icon: User },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-black/90 backdrop-blur-xl md:hidden safe-area-bottom">
            <nav className="flex items-center justify-around h-20 px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px] min-h-[56px] rounded-xl active:scale-95 no-tap-highlight",
                                isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-neutral-500 active:bg-white/5"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive && "fill-current")} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
