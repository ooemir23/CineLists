import { auth } from "@/auth";
import { getConversations } from "@/lib/message-actions";
import { MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { getDictionary, getServerLocale } from "@/lib/i18n/server";

export default async function MessagesPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const locale = await getServerLocale();
    const dict = getDictionary(locale);

    const conversations = await getConversations();

    return (
        <div className="container mx-auto px-6 py-10 ">
            <div className="flex items-center gap-3 mb-8">
                <MessageSquare className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold text-white">{dict.nav.messages}</h1>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
                {conversations.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-neutral-500 mb-4">{dict.reviewUi.noMessages}</p>
                        <Link href="/community" className="text-primary hover:underline">
                            {dict.reviewUi.messageFriend}
                        </Link>
                    </div>
                ) : (
                    conversations.map(({ partner, lastMessage }) => (
                        <Link
                            key={partner.id}
                            href={`/messages/${partner.id}`}
                            className="block bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden relative bg-neutral-800">
                                    {partner.image ? (
                                        <Image src={partner.image} alt={partner.name || dict.nav.member} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">👤</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-x-2 gap-y-1 justify-between items-baseline mb-1">
                                        <h3 className="font-bold text-white truncate min-w-0">{partner.name}</h3>
                                        <span className="text-xs text-neutral-500 shrink-0">
                                            {formatDistanceToNow(lastMessage.createdAt, { addSuffix: true, locale: locale === "tr" ? tr : enUS })}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${!lastMessage.isRead && lastMessage.receiverId === session?.user?.id ? "font-bold text-white" : "text-neutral-400"}`}>
                                        {lastMessage.senderId === session?.user?.id && `${dict.reviewUi.youPrefix} `}
                                        {lastMessage.content}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
