import {
  LayoutDashboard, Sparkles, Heart, Users, CalendarClock,
  Settings, CalendarDays, Ticket, Trophy, BookOpen,
} from "lucide-react";

export const VISITOR_NAV = [
  { label: "Panel",            href: "/visitor",                icon: LayoutDashboard },
  { label: "Yaklaşan Fuarlar", href: "/visitor/upcoming-fairs", icon: CalendarDays },
  { label: "Biletlerim",       href: "/visitor/tickets",        icon: Ticket },
  { label: "AI Öneriler",      href: "/visitor/recommendations", icon: Sparkles },
  { label: "Kartvizitler",     href: "/visitor/contacts",       icon: BookOpen },
  { label: "Favorilerim",      href: "/visitor/favorites",      icon: Heart },
  { label: "Bağlantılarım",    href: "/visitor/connections",    icon: Users },
  { label: "Puanlarım",        href: "/visitor/loyalty",        icon: Trophy },
  { label: "Toplantılarım",    href: "/visitor/meetings",       icon: CalendarClock },
  { label: "Ayarlar",          href: "/visitor/settings",       icon: Settings },
];
