"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Compass,
  Home,
  ListFilter,
  LogOut,
  User,
  ShieldCheck,
  Flame,
  Award,
} from "lucide-react";
import { handleSignOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";
import {
  guestNavItems,
  libraryNavItems,
  profileNavItems,
} from "@/components/layout/nav-items";

interface MobileDockProps {
  isAdmin?: boolean;
  user?: {
    name?: string | null;
    image?: string | null;
  };
}

export function MobileDock({ user, isAdmin = false }: MobileDockProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const { t } = useTranslation();

  const getActiveTab = () => {
    if (pathname.startsWith("/feed")) return "feed";
    if (pathname.startsWith("/search") || pathname.startsWith("/explore")) return "explore";
    if (
      pathname.startsWith("/watchlist") ||
      pathname.startsWith("/watching") ||
      pathname.startsWith("/watched")
    ) {
      return "library";
    }
    if (
      pathname.startsWith("/profile") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/messages")
    ) {
      return "profile";
    }
    if (pathname === "/") return "home";
    return "";
  };

  const activeTab = getActiveTab();
  const closeMenus = () => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
  };

  return (
    <>
      {(menuOpen || profileMenuOpen) && (
        <div
          className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 sm:hidden"
          onClick={closeMenus}
          aria-hidden="true"
        />
      )}

      <nav className="fixed inset-x-3 bottom-2.5 z-[150] flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/85 px-2 py-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl ring-1 ring-white/5 sm:hidden pb-[calc(0.35rem+env(safe-area-inset-bottom))]">
        <div className="relative mx-auto flex w-full max-w-sm items-center justify-around">
          {/* 1. Ana Sayfa */}
          <Link
            href="/"
            className={cn(
              "flex min-h-[46px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-90",
              activeTab === "home" && !menuOpen && !profileMenuOpen
                ? "text-amber-400 font-bold"
                : "text-neutral-400 hover:text-white"
            )}
            onClick={closeMenus}
          >
            <Home size={19} strokeWidth={activeTab === "home" ? 2.5 : 2} />
            <span className="font-hanken text-[9px] font-bold tracking-tight">
              {t("nav.home", "Ana Sayfa")}
            </span>
            {activeTab === "home" && !menuOpen && !profileMenuOpen && (
              <span className="w-1 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </Link>

          {/* 2. Keşfet */}
          <Link
            href="/search"
            className={cn(
              "flex min-h-[46px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-90",
              activeTab === "explore" && !menuOpen && !profileMenuOpen
                ? "text-amber-400 font-bold"
                : "text-neutral-400 hover:text-white"
            )}
            onClick={closeMenus}
          >
            <Compass size={19} strokeWidth={activeTab === "explore" ? 2.5 : 2} />
            <span className="font-hanken text-[9px] font-bold tracking-tight">
              {t("nav.explore", "Keşfet")}
            </span>
            {activeTab === "explore" && !menuOpen && !profileMenuOpen && (
              <span className="w-1 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </Link>

          {/* 3. Listelerim (Pop-up sheet) */}
          <div className="relative">
            <button
              className={cn(
                "flex min-h-[46px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-90",
                menuOpen || activeTab === "library"
                  ? "text-amber-400 font-bold"
                  : "text-neutral-400 hover:text-white"
              )}
              onClick={() => {
                setMenuOpen((value) => !value);
                setProfileMenuOpen(false);
              }}
              aria-label="Listelerim"
            >
              <ListFilter size={19} strokeWidth={menuOpen || activeTab === "library" ? 2.5 : 2} />
              <span className="font-hanken text-[9px] font-bold tracking-tight">
                {t("nav.watchlist", "Listelerim")}
              </span>
              {(menuOpen || activeTab === "library") && (
                <span className="w-1 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              )}
            </button>

            {/* Listeler Popover Menu */}
            {menuOpen && (
              <div className="absolute bottom-[calc(100%+0.75rem)] left-1/2 -translate-x-1/2 z-50 flex w-56 flex-col overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-950/95 py-2 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-3 zoom-in-95 duration-150 ring-1 ring-white/10">
                <div className="px-3.5 py-1.5 mb-1 flex items-center justify-between border-b border-white/5">
                  <span className="font-hanken text-[10px] font-black text-amber-400 uppercase tracking-widest">
                    {t("nav.watchlist", "Listelerim")}
                  </span>
                </div>
                {libraryNavItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-xs text-white transition hover:bg-white/5 active:scale-[0.98]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
                        item.iconBgClass,
                        item.iconTextClass
                      )}
                    >
                      <item.icon size={16} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold tracking-tight">
                      {t(item.translationKey || "", item.label)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 4. Sosyal / Akış */}
          <Link
            href="/feed"
            className={cn(
              "flex min-h-[46px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-90",
              activeTab === "feed" && !menuOpen && !profileMenuOpen
                ? "text-amber-400 font-bold"
                : "text-neutral-400 hover:text-white"
            )}
            onClick={closeMenus}
          >
            <Flame size={19} strokeWidth={activeTab === "feed" ? 2.5 : 2} />
            <span className="font-hanken text-[9px] font-bold tracking-tight">
              {t("nav.feed", "Akış")}
            </span>
            {activeTab === "feed" && !menuOpen && !profileMenuOpen && (
              <span className="w-1 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </Link>

          {/* 5. Profil / Hesap */}
          <div className="relative">
            <button
              className={cn(
                "flex min-h-[46px] min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl transition-all active:scale-90",
                profileMenuOpen || activeTab === "profile"
                  ? "text-amber-400 font-bold"
                  : "text-neutral-400 hover:text-white"
              )}
              onClick={() => {
                setProfileMenuOpen((value) => !value);
                setMenuOpen(false);
              }}
              aria-label={t("nav.profile", "Profil")}
            >
              {user?.image ? (
                <div
                  className={cn(
                    "h-5 w-5 overflow-hidden rounded-full border transition-colors relative",
                    profileMenuOpen || activeTab === "profile"
                      ? "border-amber-400 ring-2 ring-amber-400/20"
                      : "border-white/20"
                  )}
                >
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                </div>
              ) : (
                <User size={19} strokeWidth={profileMenuOpen || activeTab === "profile" ? 2.5 : 2} />
              )}
              <span className="font-hanken text-[9px] font-bold tracking-tight">
                {user ? t("nav.profile", "Profil") : t("nav.login", "Giriş")}
              </span>
              {(profileMenuOpen || activeTab === "profile") && (
                <span className="w-1 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              )}
            </button>

            {/* Profile Popover Menu */}
            {profileMenuOpen && (
              <div className="absolute bottom-[calc(100%+0.75rem)] right-0 z-50 flex w-60 flex-col overflow-hidden rounded-2xl border border-amber-400/25 bg-slate-950/95 py-2 shadow-2xl backdrop-blur-3xl animate-in slide-in-from-bottom-3 zoom-in-95 duration-150 ring-1 ring-white/10">
                {user ? (
                  <>
                    <div className="px-3.5 py-1.5 mb-1 flex items-center justify-between border-b border-white/5">
                      <span className="font-hanken text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        {t("nav.account", "Hesabım")}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-bold truncate max-w-[110px]">
                        {user.name || "Kullanıcı"}
                      </span>
                    </div>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={closeMenus}
                        className="flex items-center gap-3 px-3.5 py-2 text-xs font-bold text-amber-400 hover:bg-amber-400/10 transition-colors"
                      >
                        <ShieldCheck size={16} />
                        <span>{t("nav.admin", "Yönetim Paneli")}</span>
                      </Link>
                    )}

                    {profileNavItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="flex items-center gap-3 px-3.5 py-2 text-xs text-white transition hover:bg-white/5 active:scale-[0.98]"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
                            item.iconBgClass,
                            item.iconTextClass
                          )}
                        >
                          <item.icon size={15} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold tracking-tight">
                          {t(item.translationKey || "", item.label)}
                        </span>
                      </Link>
                    ))}

                    <div className="mx-3 my-1.5 h-px bg-white/5" />

                    <form action={handleSignOut}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 px-3.5 py-2 text-xs text-rose-400 transition hover:bg-rose-500/10 active:scale-[0.98]"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                          <LogOut size={15} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold uppercase tracking-wider text-[11px]">
                          {t("nav.logout", "Çıkış Yap")}
                        </span>
                      </button>
                    </form>
                  </>
                ) : (
                  guestNavItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 text-xs transition hover:bg-white/5 active:scale-95",
                        item.key === "register" ? "text-amber-400 font-bold" : "text-white font-medium"
                      )}
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg shrink-0",
                          item.iconBgClass,
                          item.iconTextClass
                        )}
                      >
                        <item.icon size={15} strokeWidth={2.5} />
                      </div>
                      <span>{t(item.translationKey || "", item.label)}</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
