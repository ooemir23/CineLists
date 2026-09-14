"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function Pageview() {
  const path = usePathname();
  const last = useRef("");
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
  return null;
}
