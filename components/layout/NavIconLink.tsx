"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function NavIconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition
        ${isActive ? "bg-primary/20 text-primary shadow-md" : "text-white hover:bg-white/10"}
        group`}
      style={{ minWidth: 48 }}
    >
      {children &&
        React.cloneElement(children as React.ReactElement, {
          className: `w-6 h-6 md:w-7 md:h-7 ${isActive ? "text-primary" : "group-hover:text-primary text-inherit"}`,
        })}
      <span className="hidden sm:block text-xs mt-0.5 font-medium tracking-tight">
        {label}
      </span>
    </Link>
  );
}
