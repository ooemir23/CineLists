"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type RatingInputProps = {
    onRate: (rating: number) => void;
    initialRating?: number;
};

export function RatingInput({ onRate, initialRating = 0 }: RatingInputProps) {
    const [rating, setRating] = useState(initialRating);
    const [hoverRating, setHoverRating] = useState(0);

    const handleClick = (value: number) => {
        setRating(value);
        onRate(value);
    };

    return (
        <div className="flex flex-col gap-3 p-4 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl min-w-[300px]">
            <p className="text-sm font-semibold text-white">Bu içeriğe kaç puan verirsin?</p>

            <div className="flex items-center justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                    <button
                        key={value}
                        onClick={() => handleClick(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="group relative transition-transform hover:scale-110 active:scale-95"
                    >
                        <Star
                            className={cn(
                                "w-5 h-5 transition-all",
                                value <= (hoverRating || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-none text-neutral-600 group-hover:text-neutral-400"
                            )}
                        />
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1 rounded">
                            {value}
                        </span>
                    </button>
                ))}
            </div>

            {rating > 0 && (
                <p className="text-xs text-neutral-400 text-center mt-2">
                    Puanın: <span className="text-yellow-400 font-bold">{rating}/10</span>
                </p>
            )}
        </div>
    );
}
