import { ChatHistory } from "@/components/messages/chat-history";
import { auth } from "@/auth";
import { getMessages } from "@/lib/message-actions";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChatInput } from "@/components/messages/chat-input";

export default async function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { userId: partnerId } = await params;
    const partner = await prisma.user.findUnique({ where: { id: partnerId } }); // Helper fetch

    if (!partner) redirect("/messages");

    const messages = await getMessages(partnerId);

    return (
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-2 sm:py-4 h-[calc(100dvh-3.5rem-7rem)] sm:h-[calc(100dvh-5rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-3 bg-background/80 backdrop-blur-md sticky top-0 z-10 w-full rounded-2xl px-2 py-1">
                <Link href="/messages" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-neutral-400" />
                </Link>
                <div className="w-10 h-10 rounded-full overflow-hidden relative bg-neutral-800">
                    {partner.image ? (
                        <Image src={partner.image} alt={partner.name || ""} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">👤</div>
                    )}
                </div>
                <div>
                    <h1 className="font-bold text-white">{partner.name}</h1>
                </div>
            </div>

            <ChatHistory initial={messages} partnerId={partnerId} userId={session.user.id!} />

            {/* Input Area */}
            <ChatInput partnerId={partnerId} />
        </div>
    );
}
