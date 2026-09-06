"use client";

import { useEffect } from "react";
import { BarChart3, RotateCcw } from "lucide-react";

export default function StatsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Stats page error:", error);
    }, [error]);

    return (
        <div className="max-w-[1600px] mx-auto px-4 py-16 flex flex-col items-center justify-center text-center min-h-[500px]">
            <div className="p-4 rounded-2xl bg-amber-400/10 text-amber-400 mb-4">
                <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">İstatistikler Yüklenemedi</h2>
            <p className="text-neutral-400 text-sm max-w-md mb-6">
                İstatistik verilerini yüklerken bir sorun oluştu. Lütfen tekrar deneyin.
            </p>
            <button
                onClick={() => reset()}
                className="flex items-center gap-2 bg-primary text-black font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
            >
                <RotateCcw className="w-4 h-4" />
                Tekrar Dene
            </button>
        </div>
    );
}
