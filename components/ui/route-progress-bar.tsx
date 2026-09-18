"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const startProgress = () => {
    clearAllTimers();
    setIsVisible(true);
    setProgress(18);

    const t1 = setTimeout(() => setProgress(45), 120);
    const t2 = setTimeout(() => setProgress(72), 350);
    const t3 = setTimeout(() => setProgress(88), 750);
    const safety = setTimeout(() => {
      completeProgress();
    }, 9000);

    timersRef.current = [t1, t2, t3, safety];
  };

  const completeProgress = () => {
    clearAllTimers();
    setProgress(100);
    const t1 = setTimeout(() => {
      setIsVisible(false);
      const t2 = setTimeout(() => {
        setProgress(0);
      }, 200);
      timersRef.current.push(t2);
    }, 180);
    timersRef.current.push(t1);
  };

  // Route change completed
  useEffect(() => {
    completeProgress();
    return () => clearAllTimers();
  }, [pathname, searchParams]);

  // Intercept click on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore if modified click (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;

      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external, hash, mailto, tel, downloads or blank targets
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.target === "_blank" ||
        target.hasAttribute("download")
      ) {
        return;
      }

      // If clicking the current exact URL, skip
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      startProgress();
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className="h-[2.5px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "150ms" : "280ms",
        }}
      />
    </div>
  );
}
