"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import type { MouseEventHandler } from "react";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

const sizeMap = {
  sm: {
    icon: "w-8 h-8",
    iconSize: 18,
    text: "text-lg",
  },
  md: {
    icon: "w-10 h-10",
    iconSize: 24,
    text: "text-2xl",
  },
  lg: {
    icon: "w-12 h-12",
    iconSize: 28,
    text: "text-4xl",
  },
} as const;

export function BrandLogo({ href = "/", size = "md", className = "", onClick }: BrandLogoProps) {
  const cfg = sizeMap[size];

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-black text-white group transition-transform hover:scale-105 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className={`${cfg.icon} bg-amber-400 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-[0_8px_20px_rgba(251,191,36,0.25)]`}>
        <Film size={cfg.iconSize} className="text-slate-950" />
      </div>
      <span className={`tracking-tighter italic leading-none ${cfg.text}`}>
        <span className="text-amber-400">cine</span>
        <span className="text-white">lists</span>
      </span>
    </Link>
  );
}
