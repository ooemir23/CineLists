"use client";
const subscribers = new Set<(count: number) => void>();
let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;
let delay = 60_000;
let lastAttempt = 0;
async function poll() {
  if (!subscribers.size || document.visibilityState !== "visible" || controller)
    return;
  if (Date.now() - lastAttempt < 5000) return;
  lastAttempt = Date.now();
  controller = new AbortController();
  try {
    const res = await fetch("/api/notifications/unread-count", {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Notification request failed");
    const data = await res.json();
    if (typeof data.count === "number")
      subscribers.forEach((fn) => fn(data.count));
    delay = 60_000;
  } catch {
    delay = Math.min(300_000, delay * 2);
  } finally {
    controller = undefined;
    schedule();
  }
}
function schedule() {
  clearTimeout(timer);
  if (subscribers.size && document.visibilityState === "visible")
    timer = setTimeout(poll, delay);
}
function visibility() {
  if (document.visibilityState === "visible") {
    void poll();
    schedule();
  } else {
    clearTimeout(timer);
    controller?.abort();
  }
}
export function subscribeUnreadCount(callback: (count: number) => void) {
  subscribers.add(callback);
  if (subscribers.size === 1) {
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", visibility);
    void poll();
    schedule();
  }
  return () => {
    subscribers.delete(callback);
    if (!subscribers.size) {
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", visibility);
    }
  };
}
