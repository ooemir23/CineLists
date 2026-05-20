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
  Eye,
  Heart,
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
    key: "watching",
    href: "/watching",
    label: "İzliyorum",
    icon: Eye,
    iconBgClass: "bg-sky-500/10",
    iconTextClass: "text-sky-400",
  },
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
    label: "Takip Ettiklerim",
    icon: Bookmark,
    iconBgClass: "bg-amber-500/10",
    iconTextClass: "text-amber-400",
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
    key: "taste-match",
    href: "/taste-match",
    label: "Zevk İkizleri",
    icon: Heart,
    iconBgClass: "bg-pink-400/10",
    iconTextClass: "text-pink-400",
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
