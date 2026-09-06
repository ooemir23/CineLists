"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { addPersonComment } from "@/lib/comment-actions";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        id: string;
        name: string | null;
        image: string | null;
    };
};

interface PersonCommentsProps {
    personId: number;
    initialComments: Comment[];
}

export function PersonComments({ personId, initialComments }: PersonCommentsProps) {
    const [comments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        startTransition(async () => {
            const result = await addPersonComment(personId, newComment);
            if (result.success) {
                setNewComment("");
                // Optimistically add comment (will be replaced on revalidation)
                window.location.reload();
            }
        });
    };

    return (
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Yorumlar
                <span className="text-sm font-normal text-neutral-500">({comments.length})</span>
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Bu kişi hakkında ne düşünüyorsunuz?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[100px]"
                    disabled={isPending}
                />
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={isPending || !newComment.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Gönderiliyor...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Yorum Yap
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Henüz yorum yapılmamış</p>
                        <p className="text-sm">İlk yorumu siz yapın!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div
                            key={comment.id}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 hover:bg-white/[0.07] transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                                    {comment.user.image ? (
                                        <Image
                                            src={comment.user.image}
                                            alt={comment.user.name || "User"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg">
                                            👤
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-white">{comment.user.name || "Anonim"}</p>
                                    <p className="text-xs text-neutral-500">
                                        {formatDistanceToNow(new Date(comment.createdAt), {
                                            addSuffix: true,
                                            locale: tr,
                                        })}
                                    </p>
                                </div>
                            </div>
                            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
                                {comment.content}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
