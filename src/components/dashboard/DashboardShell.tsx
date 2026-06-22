"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import {
  QrCode,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardShellProps {
  role: UserRole;
  userName: string;
  navItems: NavItem[];
  children: React.ReactNode;
}

const ROLE_LABELS: Record<UserRole, string> = {
  organizer: "Organizatör",
  exhibitor: "Katılımcı Firma",
  visitor: "Ziyaretçi",
  admin: "Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  organizer: "text-brand-indigo-light",
  exhibitor: "text-brand-cyan",
  visitor: "text-brand-violet-light",
  admin: "text-brand-gold",
};

const ROLE_BG: Record<UserRole, string> = {
  organizer: "bg-brand-indigo/15",
  exhibitor: "bg-brand-cyan/15",
  visitor: "bg-brand-violet/15",
  admin: "bg-brand-gold/15",
};

export function DashboardShell({
  role,
  userName,
  navItems,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-white/8 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-indigo/20 border border-brand-indigo/30 flex items-center justify-center">
            <QrCode className="w-3.5 h-3.5 text-brand-indigo-light" />
          </div>
          <span className="font-display font-bold text-base text-white">
            BasExpo
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/8 flex-shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_BG[role]} ${ROLE_COLORS[role]} mb-2`}>
          {ROLE_LABELS[role]}
        </div>
        <p className="text-sm font-medium text-white truncate">{userName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? `${ROLE_BG[role]} ${ROLE_COLORS[role]} border border-current/20`
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/8 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-white/8 bg-brand-darker/50">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <motion.aside
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute left-0 top-0 bottom-0 w-60 bg-brand-darker border-r border-white/8"
          >
            {sidebar}
          </motion.aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-white/8 flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-white">BasExpo</span>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="w-8 h-8">
            <LogOut className="w-4 h-4" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
