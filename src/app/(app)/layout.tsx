import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell/app-shell";
import { getSessionUser } from "@/lib/auth";

/**
 * App shell: sidebar, rounded content panel and top bar (E0-07), signed-in users only (E0-04).
 * The middleware already redirects; this check keeps the pages safe if it is ever bypassed.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <AppShell user={{ name: user.name, role: user.role }}>{children}</AppShell>;
}
