import type { LucideIcon } from "lucide-react";
import { Bell, Bookmark, Calendar, Check, Compass, MessageCircle, User, Eye, Heart, Settings } from "lucide-react";

export type NavItem = {
  key: string;
  href: string;
  label: string;
  translationKey?: string;
  icon: LucideIcon;
  iconBgClass?: string;
  iconTextClass?: string;
};

export const libraryNavItems: NavItem[] = [
  {
    key: "watching",
    href: "/watching",
    label: "İzliyorum",
    translationKey: "nav.watching",
    icon: Eye,
    iconBgClass: "bg-sky-500/10",
    iconTextClass: "text-sky-400",
  },
  {
    key: "watched",
    href: "/watched",
    label: "İzlenenler",
    translationKey: "nav.watched",
    icon: Check,
    iconBgClass: "bg-emerald-500/10",
    iconTextClass: "text-emerald-400",
  },
  {
    key: "watchlist",
    href: "/watchlist",
    label: "Takip Ettiklerim",
    translationKey: "nav.watchlist",
    icon: Bookmark,
    iconBgClass: "bg-amber-500/10",
    iconTextClass: "text-amber-400",
  },
  {
    key: "calendar",
    href: "/calendar",
    label: "Takvim",
    translationKey: "nav.calendar",
    icon: Calendar,
    iconBgClass: "bg-blue-500/10",
    iconTextClass: "text-blue-400",
  },
];

export const profileNavItems: NavItem[] = [
  {
    key: "profile",
    href: "/profile",
    label: "Profilim",
    translationKey: "nav.profile",
    icon: User,
    iconBgClass: "bg-amber-400/10",
    iconTextClass: "text-amber-400",
  },
  {
    key: "taste-match",
    href: "/taste-match",
    label: "Zevk İkizleri",
    translationKey: "nav.tasteMatch",
    icon: Heart,
    iconBgClass: "bg-pink-400/10",
    iconTextClass: "text-pink-400",
  },
  {
    key: "messages",
    href: "/messages",
    label: "Mesajlar",
    translationKey: "nav.messages",
    icon: MessageCircle,
    iconBgClass: "bg-blue-400/10",
    iconTextClass: "text-blue-400",
  },
  {
    key: "notifications",
    href: "/notifications",
    label: "Bildirimler",
    translationKey: "nav.notifications",
    icon: Bell,
    iconBgClass: "bg-rose-400/10",
    iconTextClass: "text-rose-400",
  },
  {
    key: "settings",
    href: "/settings",
    label: "Ayarlar",
    translationKey: "nav.settings",
    icon: Settings,
    iconBgClass: "bg-slate-400/10",
    iconTextClass: "text-slate-400",
  },
];

export const guestNavItems: NavItem[] = [
  {
    key: "login",
    href: "/login",
    label: "Giriş Yap",
    translationKey: "nav.login",
    icon: User,
    iconBgClass: "bg-amber-400/10",
    iconTextClass: "text-amber-400",
  },
  {
    key: "register",
    href: "/register",
    label: "Kayıt Ol",
    translationKey: "nav.register",
    icon: Compass,
    iconBgClass: "bg-amber-400/20",
    iconTextClass: "text-amber-400",
  },
];
