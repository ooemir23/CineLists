"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function Pageview() {
  const path = usePathname();
  const last = useRef("");
  const lastActivityTime = useRef<number>(Date.now());
  const activeSecondsAccumulator = useRef<number>(0);

  // 1. Route Change Pageview Tracking
  useEffect(() => {
    if (
      last.current === path ||
      path.startsWith("/admin") ||
      navigator.doNotTrack === "1"
    )
      return;
    last.current = path;
    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {
      /* Analytics must never interrupt navigation. */
    });
  }, [path]);

  // 2. Real-time Heartbeat & Active Time Spent Tracking (Every 45s)
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // Track real user presence events
    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("scroll", handleUserActivity, { passive: true });
    window.addEventListener("click", handleUserActivity, { passive: true });

    const sendHeartbeat = (seconds: number) => {
      if (document.visibilityState === "hidden" && Date.now() - lastActivityTime.current > 60000) {
        return; // Skip if tab was hidden and idle for more than 1 min
      }

      void fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seconds }),
        keepalive: true,
      }).catch(() => {});
    };

    // Send an initial presence ping shortly after mount
    const initialTimer = setTimeout(() => {
      sendHeartbeat(30);
    }, 5000);

    // Periodic heartbeat every 45 seconds while user is active
    const interval = setInterval(() => {
      const isIdle = Date.now() - lastActivityTime.current > 120000; // 2 minutes idle
      if (!isIdle && document.visibilityState === "visible") {
        sendHeartbeat(45);
      }
    }, 45000);

    // Send final presence beacon when tab is closed or hidden
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const elapsed = Math.min(60, Math.round((Date.now() - lastActivityTime.current) / 1000));
        if (elapsed > 10) {
          sendHeartbeat(elapsed);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
