"use client";

import { useState } from "react";
import { X, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Genre = {
    id: number;
    name: string;
};

type GenreListProps = {
    genres: Genre[];
    type: "movie" | "tv";
};

const GENRE_COLORS: Record<string, { bg: string, text: string, border: string }> = {
    "Aksiyon": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    "Macera": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    "Animasyon": { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    "Komedi": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
    "Suç": { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
    "Belgesel": { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
    "Dram": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
    "Aile": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
    "Fantastik": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    "Tarih": { bg: "bg-amber-700/10", text: "text-amber-600", border: "border-amber-700/20" },
    "Korku": { bg: "bg-rose-900/10", text: "text-rose-500", border: "border-rose-900/20" },
    "Müzik": { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
    "Gizem": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
    "Romantik": { bg: "bg-red-400/10", text: "text-red-300", border: "border-red-400/20" },
    "Bilim Kurgu": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    "TV Film": { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
    "Gerilim": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    "Savaş": { bg: "bg-stone-500/10", text: "text-stone-400", border: "border-stone-500/20" },
    "Vahşi Batı": { bg: "bg-orange-900/10", text: "text-orange-700", border: "border-orange-900/20" },
    "Sci-Fi & Fantasy": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    "Action & Adventure": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    "Mystery": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
    "War & Politics": { bg: "bg-blue-900/10", text: "text-blue-500", border: "border-blue-900/20" }
};

export function GenreList({ genres, type }: GenreListProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!genres || genres.length === 0) return null;

    const mainGenres = genres.slice(0, 2);
    const extraCount = genres.length - 2;

    const getGenreStyle = (name: string) => {
        return GENRE_COLORS[name] || { bg: "bg-white/5", text: "text-white", border: "border-white/5" };
    };

    return (
        <>
            {/* Minimalist Trigger Badge */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center bg-neutral-900/60 backdrop-blur-md border border-white/10 px-4 py-3 rounded-2xl hover:bg-neutral-800 hover:border-primary/30 transition-all group shadow-xl min-w-[110px] h-[80px] justify-between"
            >
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity border-b border-white/10 w-full pb-1 text-center mb-auto">
                    Türler
                </p>
                <div className="flex flex-col items-center justify-center gap-0.5 mt-auto">
                    {mainGenres.map((g) => {
                        const style = getGenreStyle(g.name);
                        return (
                            <span key={g.id} className={cn("text-[10px] font-black uppercase tracking-tighter leading-none whitespace-nowrap", style.text)}>
                                {g.name}
                            </span>
                        );
                    })}
                    {extraCount > 0 && (
                        <span className="text-[8px] font-black text-neutral-600 mt-0.5">
                            +{extraCount} DAHA
                        </span>
                    )}
                </div>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className="relative w-full max-w-md bg-neutral-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />

                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-8 border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl">
                                    <Layers className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">İçerik Türleri</h2>
                                    <p className="text-sm font-bold text-neutral-500">Kategorilere tıklayarak keşfedin</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-all hover:scale-110 active:scale-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8">
                            <div className="flex flex-wrap gap-3">
                                {genres.map((g) => {
                                    const style = getGenreStyle(g.name);
                                    return (
                                        <Link
                                            key={g.id}
                                            href={`/?type=${type}&genre=${g.id}`}
                                            className={cn(
                                                "px-5 py-3 border rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-sm",
                                                style.bg,
                                                style.text,
                                                style.border,
                                                "hover:shadow-md"
                                            )}
                                        >
                                            {g.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
