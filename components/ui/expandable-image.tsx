"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableImageProps {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: "poster" | "video" | "square" | "portrait";
    quality?: number;
    priority?: boolean;
    showZoomIcon?: boolean;
}

export function ExpandableImage({
    src,
    alt,
    className,
    aspectRatio = "poster",
    quality = 90,
    priority = false,
    showZoomIcon = true
}: ExpandableImageProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(prev => !prev);
    }, []);

    // Prevent scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <>
            <div
                className={cn(
                    "group relative cursor-zoom-in overflow-hidden transition-all duration-500",
                    aspectRatio === "poster" && "aspect-[2/3]",
                    aspectRatio === "video" && "aspect-video",
                    aspectRatio === "square" && "aspect-square",
                    aspectRatio === "portrait" && "aspect-[3/4]",
                    className
                )}
                onClick={toggleOpen}
            >
                <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    quality={quality}
                    priority={priority}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {showZoomIcon && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 scale-50 group-hover:scale-100 transition-transform duration-500">
                            <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto"
                    onClick={toggleOpen}
                >
                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
                        onClick={toggleOpen}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div
                        className="relative w-full h-full p-4 md:p-12 flex items-center justify-center"
                    >
                        <div className="relative max-w-full max-h-full animate-in zoom-in-95 duration-500 shadow-2xl">
                            <Image
                                src={src.replace("/w780/", "/original/").replace("/w500/", "/original/")}
                                alt={alt}
                                width={1200}
                                height={1800}
                                className="object-contain max-w-full max-h-[90vh] rounded-lg"
                                quality={100}
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
                                <p className="text-white text-sm font-black tracking-tight">{alt}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
