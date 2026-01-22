"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

export function UserSearchInput() {
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
            router.replace(`/community?${params.toString()}`);
        });
    }, 500);

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setValue(term);
        handleSearch(term);
    };

    return (
        <div className="relative w-full mb-8">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-neutral-500 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder="Arkadaş ara (isim veya email)..."
                    className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white/10 transition-all outline-none"
                />
            </div>
            {isPending && (
                <div className="absolute -bottom-2 left-0 w-full h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress origin-left" />
                </div>
            )}
        </div>
    );
}
