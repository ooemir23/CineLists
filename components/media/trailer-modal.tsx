"use client";

// Replaced framer-motion modal animations with CSS transitions.
// The backdrop and panel use Tailwind's animate-in/fade-in/zoom-in utilities.

import { X } from "lucide-react";

type TrailerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    videoKey: string;
    title: string;
};

export function TrailerModal({ isOpen, onClose, videoKey, title }: TrailerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
            />

            <div className="relative w-full max-w-6xl aspect-video bg-black rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white transition-all border border-white/10 backdrop-blur-md hover:scale-110 active:scale-90"
                >
                    <X size={24} />
                </button>

                <iframe
                    src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
                    title={`${title} Fragram`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>
        </div>
    );
}
