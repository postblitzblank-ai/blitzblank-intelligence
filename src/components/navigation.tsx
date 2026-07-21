"use client";

import * as React from "react";
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
  Menu,
  X,
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 space-y-0.5">
      {navItems.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
  );
}

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop: feste Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-56 border-r bg-sidebar flex-col">
        <div className="px-5 py-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">
              Blitzblank Intelligence
            </span>
          </Link>
        </div>
        <NavLinks />
        <div className="px-5 py-4 text-xs text-muted-foreground">
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>{" "}
          KI-Assistent
        </div>
      </aside>

      {/* Mobil: oberer Balken mit Menü-Button */}
      <header className="flex md:hidden fixed inset-x-0 top-0 z-40 h-14 items-center justify-between border-b bg-sidebar px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Blitzblank Intelligence
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
          className="rounded-md p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobil: Ausklapp-Menü */}
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar">
            <div className="flex items-center justify-between px-5 py-5">
              <span className="text-sm font-semibold tracking-tight">
                Blitzblank Intelligence
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Menü schließen"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <div className="px-5 py-4 text-xs text-muted-foreground">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>{" "}
              KI-Assistent
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
