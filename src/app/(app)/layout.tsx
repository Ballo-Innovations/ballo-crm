import Link from "next/link";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { primaryNav, siteConfig } from "@/lib/site";

/**
 * Scaffold shell so every module route is reachable.
 * TODO(E0-07): replace with the real app shell (collapsible sidebar, topbar, search).
 * TODO(E0-04): gate this layout behind the Auth.js session.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="bg-sidebar border-sidebar-border shrink-0 border-b md:w-60 md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="font-semibold">
            {siteConfig.name}
          </Link>
          <ThemeToggle />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-sidebar-accent rounded-md px-3 py-2 text-sm whitespace-nowrap"
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
