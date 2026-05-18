"use client";

// Replaced framer-motion with a CSS animation to eliminate the ~40KB
// framer-motion chunk from the page-transition critical path.
// The fade-in is handled by the `animate-in` / `fade-in` Tailwind utilities.

export default function PageTransition({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="w-full flex-1 animate-in fade-in duration-300">
            {children}
        </div>
    );
}
