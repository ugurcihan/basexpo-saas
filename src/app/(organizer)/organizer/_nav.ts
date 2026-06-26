import {
  LayoutDashboard, CalendarDays, Users2,
  MessageSquare, BarChart2, UserCircle2, Settings,
} from "lucide-react";

export const ORGANIZER_NAV = [
  { label: "Panel",        href: "/organizer",              icon: LayoutDashboard },
  { label: "Fuarlar",      href: "/organizer/events",       icon: CalendarDays },
  { label: "Katılımcılar", href: "/organizer/participants", icon: Users2 },
  { label: "Mesajlar",     href: "/organizer/messages",     icon: MessageSquare },
  { label: "Raporlar",     href: "/organizer/reports",      icon: BarChart2 },
  { label: "Profilim",     href: "/organizer/profile",      icon: UserCircle2 },
  { label: "Ayarlar",      href: "/organizer/settings",     icon: Settings },
];
