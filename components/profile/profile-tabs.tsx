"use client";

import { useState, ReactNode } from "react";
import { LayoutGrid, Bookmark, Heart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon: typeof LayoutGrid;
  content: ReactNode;
}

interface ProfileTabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function ProfileTabs({ tabs, defaultTab }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const active = tabs.find((t) => t.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center justify-center border-t border-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 sm:flex-none sm:px-8 py-3 flex items-center justify-center gap-2 transition-colors relative",
                "border-t-2 -mt-px",
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">{active?.content}</div>
    </div>
  );
}
