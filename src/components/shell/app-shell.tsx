"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronLeft, LayoutDashboard, Menu, Plus, Search, X } from "lucide-react";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CommandPalette } from "@/components/shell/command-palette";
import { NAV_ICONS } from "@/components/shell/nav-icons";
import { primaryNav, siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const COLLAPSE_KEY = "ballo:sidebar-collapsed";

/**
 * App shell per docs/03-design/01-design-system.md "Layout":
 * white sidebar with pill nav (collapsible to an icon rail), one rounded grey content
 * panel that scrolls inside itself, and a top bar pinned inside the panel.
 * On phones the sidebar becomes a slide-in drawer with a scrim.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = () => setSearchOpen(true);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage unavailable: keep the default */
    }
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  }

  return (
    <div className="bg-shell text-ink flex h-dvh overflow-hidden">
      <a
        href="#main"
        className="bg-ink text-shell sr-only z-50 rounded-full px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* scrim (phone only) */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/30 transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-label="Main navigation"
        className={cn(
          "bg-shell ease-ballo z-40 flex shrink-0 flex-col gap-1 overflow-hidden px-[18px] py-6 transition-[width,transform] duration-300",
          "fixed inset-y-0 left-0 w-[280px] md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "md:w-[84px]" : "md:w-[248px]",
        )}
      >
        <div
          className={cn(
            "mx-1 mb-8 flex items-center justify-between gap-2",
            collapsed && "md:mb-5 md:flex-col md:gap-3",
          )}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-2xl font-bold whitespace-nowrap"
          >
            <span className="bg-ink text-shell grid size-9 shrink-0 place-items-center rounded-full text-base">
              b
            </span>
            <span className={cn(collapsed && "md:hidden")}>{siteConfig.name}</span>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "bg-soft hover:bg-line hidden size-8 shrink-0 place-items-center rounded-full transition-colors md:grid",
            )}
          >
            <ChevronLeft
              className={cn("size-4 transition-transform duration-300", collapsed && "rotate-180")}
            />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="bg-soft grid size-9 place-items-center rounded-full md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {primaryNav.map((item) => {
            const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3.5 rounded-full p-1.5 text-[15px] font-medium whitespace-nowrap transition-colors duration-150",
                  active ? "bg-ink text-shell" : "hover:bg-soft",
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    active ? "bg-shell text-ink" : "bg-soft",
                  )}
                >
                  <Icon className="size-[17px]" strokeWidth={2} />
                </span>
                <span className={cn(collapsed && "md:hidden")}>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center gap-3 px-1.5 py-2.5">
          <span className="bg-soft grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold">
            GM
          </span>
          <span className={cn("min-w-0 leading-tight", collapsed && "md:hidden")}>
            <span className="block truncate text-sm font-semibold">George M.</span>
            <span className="text-mute block truncate text-xs">Sales lead</span>
          </span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col p-2 md:py-4 md:pr-4 md:pl-0">
        <div className="bg-main md:rounded-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
          <header className="flex flex-wrap items-center gap-3 px-3 pt-3 pb-1 md:flex-nowrap md:px-7 md:pt-5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="bg-card grid size-11 place-items-center rounded-full md:hidden"
            >
              <Menu className="size-[18px]" />
            </button>
            <span className="text-lg font-bold md:hidden">{siteConfig.name}</span>

            <button
              type="button"
              onClick={openSearch}
              className="bg-card text-mute order-last flex h-11 w-full items-center gap-2.5 rounded-2xl px-3.5 text-left text-[15px] md:order-none md:max-w-[520px] md:flex-1"
            >
              <Search className="size-[17px]" />
              <span className="flex-1 truncate">Search accounts, leads, opportunities…</span>
              <kbd className="border-line bg-soft hidden rounded-md border px-1.5 py-0.5 font-sans text-xs md:inline">
                ⌘K
              </kbd>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={openSearch}
                className="bg-ink text-shell hidden h-11 items-center gap-2 rounded-full pr-5 pl-1.5 text-sm font-semibold transition-transform active:scale-[0.97] sm:flex"
              >
                <span className="bg-shell text-ink grid size-[34px] place-items-center rounded-full">
                  <Plus className="size-4" />
                </span>
                Quick add
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="bg-card hover:bg-soft relative grid size-11 place-items-center rounded-full transition-colors"
              >
                <Bell className="size-[17px]" />
                <span className="bg-ink border-card absolute top-2.5 right-3 size-2 rounded-full border-2" />
              </button>
              <div className="bg-card grid size-11 place-items-center rounded-full">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main
            id="main"
            tabIndex={-1}
            className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-3 pt-4 pb-5 outline-none md:px-7 md:pt-[22px] md:pb-7"
          >
            {children}
          </main>
        </div>
      </div>
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
