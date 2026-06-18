"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Droplets,
  CreditCard,
  BarChart3,
  Milk,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/milkmen", label: "Milkmen", icon: Users, adminOnly: false },
  { href: "/collections", label: "Milk Collections", icon: Droplets, adminOnly: false },
  { href: "/payments", label: "Pay Milkmen", icon: CreditCard, adminOnly: false },
  { href: "/reports", label: "Reports", icon: BarChart3, adminOnly: false },
  { href: "/branches", label: "Branches", icon: GitBranch, adminOnly: true },
  { href: "/users", label: "Users", icon: Settings, adminOnly: true },
  { href: "/pricing-config", label: "Pricing Config", icon: Milk, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-background border-r border-border">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <Milk className="h-7 w-7 text-primary" />
        <span className="font-bold text-lg text-primary">DairyFarm</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4 space-y-2">
        <div className="px-3 py-2">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          {user?.branch && (
            <p className="text-xs text-primary mt-0.5">{user.branch.name}</p>
          )}
        </div>
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
