"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  Search,
  Radar,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/direktkunden", label: "Direktkunden", icon: Building2 },
  { href: "/nachunternehmer", label: "Nachunternehmer", icon: Handshake },
  { href: "/seo", label: "SEO", icon: Search },
  { href: "/marketing", label: "Marketing", icon: Radar },
  { href: "/analyse", label: "Analyse", icon: BarChart3 },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-56 border-r bg-sidebar flex flex-col">
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight">
            Blitzblank Intelligence
          </span>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-muted-foreground">
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>{" "}
        KI-Assistent
      </div>
    </aside>
  );
}
