"use client";

import { sendMessage } from "@/lib/message-actions";
import { Send, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ChatInput({ partnerId }: { partnerId: string }) {
    const [content, setContent] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        const msg = content;
        setContent(""); // Optimistic clear

        startTransition(async () => {
            const result = await sendMessage(partnerId, msg);
            if (result.error) {
                // Handle error (toast or restore content)
                console.error(result.error);
                setContent(msg); // Restore if failed
            }
        });
    };

    return (
        <form onSubmit={handleSend} className="flex gap-2">
            <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Mesaj yazın..."
                disabled={isPending}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white/10 transition-all outline-none"
            />
            <button
                type="submit"
                disabled={isPending || !content.trim()}
                className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
        </form>
    );
}
