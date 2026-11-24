import { AppShell } from "@/components/shell/app-shell";

/**
 * App shell: sidebar, rounded content panel and top bar (E0-07).
 * TODO(E0-04): gate this layout behind the Auth.js session.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
