"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce"; // We need to install this or write our own

export function SearchInput() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get("q") || "");
    const [isPending, startTransition] = useTransition();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }

        startTransition(() => {
            router.replace(`/search?${params.toString()}`);
        });
    }, 500);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setValue(term);
        handleSearch(term);
    };

    const clear = () => {
        setValue("");
        handleSearch("");
    };

    return (
        <div className="relative w-full max-w-xl mx-auto mb-8">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-neutral-500 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder="Film, dizi, oyuncu ara..."
                    className="block w-full pl-11 pr-11 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white/10 transition-all outline-none backdrop-blur-md"
                />
                {value && (
                    <button
                        onClick={clear}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                        <X className="h-5 w-5 text-neutral-500 hover:text-white transition-colors" />
                    </button>
                )}
            </div>
            {isPending && (
                <div className="absolute top-full left-0 w-full mt-2 h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress origin-left" />
                </div>
            )}
        </div>
    );
}
