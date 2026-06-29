import {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  TrendingUp,
  FileCheck,
  CalendarClock,
  MessageSquare,
  Settings,
} from "lucide-react";

export const EXHIBITOR_NAV = [
  { label: "Panel",            href: "/exhibitor",              icon: LayoutDashboard },
  { label: "Dijital Kartvizit",href: "/exhibitor/card",         icon: CreditCard },
  { label: "Ürünlerim",        href: "/exhibitor/products",     icon: Package },
  { label: "Ziyaretçilerim",   href: "/exhibitor/leads",        icon: Users },
  { label: "Satış Pipeline",   href: "/exhibitor/pipeline",     icon: TrendingUp },
  { label: "ROI Raporu",       href: "/exhibitor/roi-report",   icon: FileCheck },
  { label: "Fuarlarım",        href: "/exhibitor/fairs",        icon: CalendarClock },
  { label: "Mesajlar",         href: "/exhibitor/messages",     icon: MessageSquare },
  { label: "Ayarlar",          href: "/exhibitor/settings",     icon: Settings },
];
