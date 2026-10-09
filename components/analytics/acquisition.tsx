"use client";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
export function AcquisitionCapture() {
  const pathname = usePathname(),
    params = useSearchParams(),
    started = useRef(false);
  useEffect(() => {
    if (
      started.current ||
      pathname.startsWith("/admin") ||
      navigator.doNotTrack === "1" ||
      (navigator as Navigator & { globalPrivacyControl?: boolean })
        .globalPrivacyControl
    )
      return;
    started.current = true;
    let referrer = "";
    try {
      if (document.referrer) referrer = new URL(document.referrer).origin;
    } catch {
      /* Ignore malformed URLs. */
    }
    void fetch("/api/analytics/acquisition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        source: params.get("utm_source"),
        medium: params.get("utm_medium"),
        campaign: params.get("utm_campaign"),
        referrer,
      }),
    }).catch(() => {
      /* Attribution cannot interrupt signup. */
    });
  }, [pathname, params]);
  return null;
}
