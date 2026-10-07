"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function Pageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const last = useRef("");
  const lastActivityTime = useRef<number>(0);

  // Map homepage section query params to identifiable paths
  let currentPath = pathname;
  if (pathname === "/") {
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    if (type === "movie") currentPath = "/in-theatres";
    else if (type === "tv") currentPath = "/tv-shows";
    else if (category === "top_rated") currentPath = "/top-rated";
  }

  // 1. Route Change Pageview Tracking
  useEffect(() => {
    if (
      last.current === currentPath ||
      currentPath.startsWith("/admin") ||
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl === true
    )
      return;
    last.current = currentPath;
    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: currentPath }),
      keepalive: true,
    }).catch(() => {
      /* Analytics must never interrupt navigation. */
    });
  }, [currentPath]);

  // 2. Real-time Heartbeat & Active Time Spent Tracking (Every 45s)
  useEffect(() => {
    if (
      currentPath.startsWith("/admin") ||
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl === true
    )
      return;
    lastActivityTime.current = Date.now();
    const handleUserActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // Track real user presence events
    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("scroll", handleUserActivity, { passive: true });
    window.addEventListener("click", handleUserActivity, { passive: true });

    const sendHeartbeat = (seconds: number) => {
      if (document.visibilityState !== "visible") {
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
      sendHeartbeat(0);
    }, 5000);

    // Periodic heartbeat every 45 seconds while user is active
    const interval = setInterval(() => {
      const isIdle = Date.now() - lastActivityTime.current > 120000; // 2 minutes idle
      if (!isIdle && document.visibilityState === "visible") {
        sendHeartbeat(45);
      }
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
    };
  }, [currentPath]);

  return null;
}
