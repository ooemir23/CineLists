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
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 md:pr-8 py-4 md:py-8 flex flex-col gap-2">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname === tab.href || pathname.startsWith(tab.href);
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm",
                            isActive
                                ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Icon size={18} className={cn(isActive ? "text-slate-950" : "text-neutral-500")} />
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
