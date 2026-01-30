"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TrailerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    videoKey: string;
    title: string;
};

export function TrailerModal({ isOpen, onClose, videoKey, title }: TrailerModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-6xl aspect-video bg-black rounded-[2rem] shadow-2xl overflow-hidden border border-white/10"
                    >
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
