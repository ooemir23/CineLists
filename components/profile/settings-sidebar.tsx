"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Sparkles, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    { id: "general", label: "Genel", icon: User, href: "/settings/general" },
    { id: "privacy", label: "Gizlilik", icon: Shield, href: "/settings/privacy" },
    { id: "preferences", label: "Tercihler", icon: Sparkles, href: "/settings/preferences" },
    { id: "account", label: "Hesap", icon: Smartphone, href: "/settings/account" },
];

export function SettingsSidebar() {
    const pathname = usePathname();

    return (
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 md:pr-8 py-2 md:py-8 flex flex-row md:flex-col gap-1.5 md:gap-2 overflow-x-auto no-scrollbar shrink-0">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.href || pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={cn(
                            "flex items-center gap-2 md:gap-3 px-3.5 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl transition-all font-bold text-xs md:text-sm whitespace-nowrap shrink-0",
                            isActive
                                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
                                : "text-neutral-400 hover:text-white hover:bg-white/5 bg-white/[0.02] md:bg-transparent"
                        )}
                    >
                        <Icon size={16} className={cn("md:w-[18px] md:h-[18px]", isActive ? "text-slate-950" : "text-neutral-500")} />
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
