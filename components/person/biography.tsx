"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BiographyProps {
    text: string;
}

export function Biography({ text }: BiographyProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return null;

    return (
        <div className="relative group">
            <p className={cn(
                "text-neutral-300 leading-relaxed text-lg whitespace-pre-wrap italic transition-all duration-500",
                !isExpanded && "line-clamp-3"
            )}>
                {text}
            </p>

            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "mt-2 ml-auto flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-all",
                    !isExpanded ? "relative" : "mt-4"
                )}
            >
                {isExpanded ? (
                    <>
                        Daha Az Gör <ChevronUp className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        Devamını Oku <ChevronDown className="w-4 h-4" />
                    </>
                )}
            </button>

            {!isExpanded && (
                <div className="absolute bottom-6 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none group-hover:h-16 transition-all duration-500" />
            )}
        </div>
    );
}
