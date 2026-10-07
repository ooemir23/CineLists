"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { getMessages, markMessagesAsRead } from "@/lib/message-actions";
import { useTranslation } from "@/lib/i18n/i18n-context";
type ChatMessage = Awaited<ReturnType<typeof getMessages>>[number];
export function ChatHistory({
  initial,
  partnerId,
  userId,
}: {
  initial: ChatMessage[];
  partnerId: string;
  userId: string;
}) {
  const { dict, locale } = useTranslation();
  const [messages, setMessages] = useState(initial);
  const [hasMore, setHasMore] = useState(initial.length === 50);
  const [pending, startTransition] = useTransition();
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages((current) => {
      const refreshed = new Map(
        initial.map((message) => [message.id, message]),
      );
      return [
        ...current.filter((message) => !refreshed.has(message.id)),
        ...initial,
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() ||
          a.id.localeCompare(b.id),
      );
    });
  }, [initial]);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const visible = new Set<string>();
    const completed = new Set<string>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      if (document.visibilityState !== "visible") return;
      const ids = [...visible].filter((id) => !completed.has(id)).slice(0, 50);
      if (!ids.length) return;
      ids.forEach((id) => completed.add(id));
      void markMessagesAsRead(partnerId, ids).catch(() =>
        ids.forEach((id) => completed.delete(id)),
      );
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(flush, 150);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.messageId!;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        });
        schedule();
      },
      { root, threshold: 0.5 },
    );
    root
      .querySelectorAll("[data-message-id]")
      .forEach((node) => observer.observe(node));
    document.addEventListener("visibilitychange", schedule);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [messages, partnerId]);
  return (
    <div ref={container} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
      {hasMore && (
        <button
          disabled={pending}
          className="w-full py-2 text-sm text-amber-400"
          onClick={() =>
            startTransition(async () => {
              const older = await getMessages(partnerId, messages[0]?.id);
              setMessages((current) => [...older, ...current]);
              setHasMore(older.length === 50);
            })
          }
        >
          {pending ? dict.common.loading : dict.reviewUi.olderMessages}
        </button>
      )}
      {!messages.length && (
        <p className="text-center text-neutral-500 mt-20">
          {dict.reviewUi.startChat}
        </p>
      )}
      {messages.map((msg) => (
        <div
          key={msg.id}
          data-message-id={msg.senderId !== userId ? msg.id : undefined}
          className={`flex ${msg.senderId === userId ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] px-4 py-2 rounded-2xl break-words ${msg.senderId === userId ? "bg-primary text-white" : "bg-white/10 text-white"}`}
          >
            <p>{msg.content}</p>
            <time
              className="text-[10px] block text-right mt-1 opacity-70"
              dateTime={new Date(msg.createdAt).toISOString()}
            >
              {new Intl.DateTimeFormat(locale, {
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(msg.createdAt))}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
