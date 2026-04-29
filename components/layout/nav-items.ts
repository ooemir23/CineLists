import type { LucideIcon } from "lucide-react";
import {
  Award,
  Bell,
  Bookmark,
  Check,
  Compass,
  MessageCircle,
  User,
  Users,
} from "lucide-react";

export type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  iconBgClass?: string;
  iconTextClass?: string;
};

export const libraryNavItems: NavItem[] = [
  {
    key: "watched",
    href: "/watched",
    label: "İzlenenler",
    icon: Check,
    iconBgClass: "bg-emerald-500/10",
    iconTextClass: "text-emerald-400",
  },
  {
    key: "watchlist",
    href: "/watchlist",
    label: "Listem",
    icon: Bookmark,
    iconBgClass: "bg-amber-500/10",
    iconTextClass: "text-amber-400",
  },

  {
    key: "achievements",
    href: "/achievements",
    label: "Rozetler",
    icon: Award,
    iconBgClass: "bg-yellow-500/10",
    iconTextClass: "text-yellow-400",
  },
];

export const profileNavItems: NavItem[] = [
  {
    key: "profile",
    href: "/profile",
    label: "Profilim",
    icon: User,
    iconBgClass: "bg-amber-400/10",
    iconTextClass: "text-amber-400",
  },
  {
    key: "messages",
    href: "/messages",
    label: "Mesajlar",
    icon: MessageCircle,
    iconBgClass: "bg-blue-400/10",
    iconTextClass: "text-blue-400",
  },
  {
    key: "notifications",
    href: "/notifications",
    label: "Bildirimler",
    icon: Bell,
    iconBgClass: "bg-rose-400/10",
    iconTextClass: "text-rose-400",
  },
  {
    key: "community",
    href: "/community",
    label: "Topluluk",
    icon: Users,
    iconBgClass: "bg-indigo-400/10",
    iconTextClass: "text-indigo-400",
  },
];

export const guestNavItems: NavItem[] = [
  {
    key: "login",
    href: "/login",
    label: "Giriş Yap",
    icon: User,
    iconBgClass: "bg-amber-400/10",
    iconTextClass: "text-amber-400",
  },
  {
    key: "register",
    href: "/register",
    label: "Kayıt Ol",
    icon: Compass,
    iconBgClass: "bg-amber-400/20",
    iconTextClass: "text-amber-400",
  },
];
