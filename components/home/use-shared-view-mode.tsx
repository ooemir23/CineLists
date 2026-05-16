"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SharedViewMode = "grid" | "list" | "compact";

type SharedViewModeContextValue = {
    viewMode: SharedViewMode;
    setViewMode: (nextMode: SharedViewMode) => void;
};

const STORAGE_KEY = "cine-view-mode";
const SharedViewModeContext = createContext<SharedViewModeContextValue | null>(null);

function readStoredViewMode(defaultMode: SharedViewMode): SharedViewMode {
    if (typeof window === "undefined") return defaultMode;

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "grid" || stored === "list" || stored === "compact") {
            return stored;
        }
    } catch {
        // Ignore storage failures and keep the requested default.
    }

    return defaultMode;
}

export function HomeViewModeProvider({
    children,
    defaultMode = "grid",
}: {
    children: ReactNode;
    defaultMode?: SharedViewMode;
}) {
    const [viewMode, setViewMode] = useState<SharedViewMode>(() => readStoredViewMode(defaultMode));

    useEffect(() => {
        try {
            window.localStorage.setItem(STORAGE_KEY, viewMode);
        } catch {
            // Ignore storage failures.
        }
    }, [viewMode]);

    const value = useMemo<SharedViewModeContextValue>(
        () => ({
            viewMode,
            setViewMode,
        }),
        [viewMode]
    );

    return <SharedViewModeContext.Provider value={value}>{children}</SharedViewModeContext.Provider>;
}

export function useSharedViewMode() {
    const context = useContext(SharedViewModeContext);

    if (!context) {
        throw new Error("useSharedViewMode must be used within a HomeViewModeProvider.");
    }

    return context;
}
