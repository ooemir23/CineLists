"use client";

// Replaced framer-motion stagger animation with CSS animate-in utilities.
// Each direct child receives a staggered fade-in via the [&>*:nth-child]
// selector pattern, keeping the visual effect without the JS overhead.

// Legacy variant objects kept for any consumers that import them directly.
export const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

export const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function AnimatedList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={[
                "animate-in fade-in slide-in-from-bottom-4 duration-500",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}
