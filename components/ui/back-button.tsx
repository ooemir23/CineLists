"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  fallbackUrl?: string;
  label?: string;
}

export function BackButton({ className, fallbackUrl = "/", label = "Geri" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors group active:scale-95",
        className
      )}
      aria-label={label}
    >
      <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );
}
