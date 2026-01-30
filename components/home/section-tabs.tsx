"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Film, Tv, LayoutGrid } from "lucide-react";

type SectionTabsProps = {
    paramName: string;
    activeValue: string;
    themeColor: "amber" | "blue";
};

export function SectionTabs({ paramName, activeValue, themeColor }: SectionTabsProps) {
    const searchParams = useSearchParams();

    const createQuery = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "all") {
            params.delete(paramName);
        } else {
            params.set(paramName, value);
        }
        return params.toString();
    };

    const tabs = [
        { id: "all", label: "Tümü", icon: LayoutGrid },
        { id: "movie", label: "Film", icon: Film },
        { id: "tv", label: "Dizi", icon: Tv },
    ];

    const activeStyles = themeColor === "amber"
        ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
        : "bg-blue-400 text-black shadow-lg shadow-blue-400/20";

    return (
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
            {tabs.map((tab) => {
                const isActive = activeValue === tab.id;
                return (
                    <Link
                        key={tab.id}
                        href={`?${createQuery(tab.id)}`}
                        scroll={false}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                            isActive
                                ? activeStyles
                                : "text-neutral-500 hover:text-white"
                        )}
                    >
                        <tab.icon size={12} className={isActive ? "text-current" : "text-neutral-500"} />
                        <span>{tab.label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
