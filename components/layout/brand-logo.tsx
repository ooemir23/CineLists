"use client";

import Link from "next/link";
import Image from "next/image";
import type { MouseEventHandler } from "react";

type BrandLogoProps = {
  href?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  showText?: boolean;
};

const sizeMap = {
  sm: {
    icon: "w-8 h-8",
    imgSize: 32,
    text: "text-lg",
  },
  md: {
    icon: "w-10 h-10",
    imgSize: 40,
    text: "text-2xl",
  },
  lg: {
    icon: "w-14 h-14",
    imgSize: 56,
    text: "text-4xl",
  },
} as const;

export function BrandLogo({
  href = "/",
  size = "md",
  className = "",
  onClick,
  showText = true,
}: BrandLogoProps) {
  const cfg = sizeMap[size];

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 font-black text-white group transition-transform hover:scale-105 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <div className={`${cfg.icon} relative flex items-center justify-center shrink-0 drop-shadow-[0_4px_16px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform duration-200`}>
        <Image
          src="/logo.png"
          alt="CineLists"
          width={cfg.imgSize}
          height={cfg.imgSize}
          priority
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <span className={`tracking-tighter italic leading-none ${cfg.text}`}>
          <span className="text-amber-400">cine</span>
          <span className="text-white">lists</span>
        </span>
      )}
    </Link>
  );
}
