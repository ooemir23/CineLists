import { auth } from "@/auth";
import { getMessages, sendMessage } from "@/lib/message-actions";
import { prisma } from "@/lib/prisma";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChatInput } from "@/components/messages/chat-input";

export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { userId: partnerId } = await params;
    const partner = await prisma.user.findUnique({ where: { id: partnerId } }); // Helper fetch

    if (!partner) redirect("/messages");

    const messages = await getMessages(partnerId);

    return (
        <div className="container mx-auto px-6 py-4 h-[calc(100vh-2rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 mb-4 bg-background sticky top-0 z-10 w-full">
                <Link href="/messages" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-neutral-400" />
                </Link>
                <div className="w-10 h-10 rounded-full overflow-hidden relative bg-neutral-800">
                    {partner.image ? (
                        <Image src={partner.image} alt={partner.name || "User"} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">👤</div>
                    )}
                </div>
                <div>
                    <h1 className="font-bold text-white">{partner.name}</h1>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.length === 0 && (
                    <div className="text-center text-neutral-500 mt-20">
                        Sohbeti başlatın...
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === session.user?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMe
                                ? "bg-primary text-white rounded-br-none"
                                : "bg-white/10 text-white rounded-bl-none"
                                }`}>
                                <p>{msg.content}</p>
                                <span className={`text-[10px] block text-right mt-1 opacity-70 ${isMe ? "text-primary-foreground" : "text-neutral-400"}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input Area */}
            <ChatInput partnerId={partnerId} />
        </div>
    );
}
