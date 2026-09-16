"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { SUPPORTED_LOCALES, Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  className?: string;
  variant?: "dropdown" | "toggle" | "minimal";
}

export function LanguageSelector({
  className,
  variant = "dropdown",
}: LanguageSelectorProps) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocaleObj =
    SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "toggle") {
    const nextLocale: Locale = locale === "tr" ? "en" : "tr";
    return (
      <button
        onClick={() => setLocale(nextLocale)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all text-xs font-bold",
          className
        )}
        title={nextLocale === "en" ? "Switch to English" : "Türkçe'ye Geç"}
      >
        <span className="text-sm leading-none">{currentLocaleObj.flag}</span>
        <span className="uppercase text-[11px] font-black tracking-wider text-amber-400">
          {currentLocaleObj.code}
        </span>
      </button>
    );
  }

  if (variant === "minimal") {
    const nextLocale: Locale = locale === "tr" ? "en" : "tr";
    return (
      <button
        onClick={() => setLocale(nextLocale)}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-amber-400/40 transition-all text-xs font-black",
          className
        )}
        title={nextLocale === "en" ? "Switch to English" : "Türkçe'ye Geç"}
      >
        <span className="text-base leading-none">{currentLocaleObj.flag}</span>
      </button>
    );
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold group",
          isOpen
            ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
            : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm leading-none">{currentLocaleObj.flag}</span>
        <span className="uppercase text-[11px] font-black tracking-wider">
          {currentLocaleObj.code}
        </span>
        <ChevronDown
          size={12}
          className={cn(
            "text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180 text-amber-400"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl bg-slate-900/95 border border-white/10 shadow-2xl backdrop-blur-xl p-1.5 z-[1002] animate-in fade-in zoom-in-95 duration-150">
          {SUPPORTED_LOCALES.map((l) => {
            const isSelected = l.code === locale;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLocale(l.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all",
                  isSelected
                    ? "bg-amber-400/15 text-amber-400 font-black"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{l.flag}</span>
                  <span>{l.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
