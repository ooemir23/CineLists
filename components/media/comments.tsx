"use client";

import { useState } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Comment = {
    id: string;
    content: string;
    createdAt: Date;
    user: {
        name: string | null;
        image: string | null;
    };
};

type CommentsSectionProps = {
    mediaId: number;
    type: "movie" | "tv";
    initialComments?: Comment[];
    mediaTitle?: string;
    mediaPosterPath?: string | null;
};

export function CommentsSection({
    mediaId,
    type,
    initialComments = []
}: CommentsSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        // Simulate or call real addComment action
        // For now, let's keep it as an UI placeholder until we verify the server action

        // Example: const result = await addComment(mediaId, type, newComment);

        setIsSubmitting(false);
        setNewComment("");
    };

    return (
        <section id="comments" className="space-y-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Yorumlar ({comments.length})
            </h2>

            {/* Comment Input */}
            <form onSubmit={handleSubmit} className="relative group">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Bir yorum paylaş..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-16 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all min-h-[100px] resize-none"
                />
                <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="absolute bottom-4 right-4 p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                        <p className="text-neutral-500">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-neutral-800 flex items-center justify-center">
                                {comment.user.image ? (
                                    <img src={comment.user.image} alt={comment.user.name || "User"} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-neutral-500" />
                                )}
                            </div>
                            <div className="space-y-1 flex-1 text-left">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-white leading-tight">{comment.user.name || "Anonim"}</span>
                                    <span className="text-[10px] text-neutral-500">
                                        {new Date(comment.createdAt).toLocaleDateString("tr-TR")}
                                    </span>
                                </div>
                                <p className="text-neutral-300 text-sm leading-relaxed">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
