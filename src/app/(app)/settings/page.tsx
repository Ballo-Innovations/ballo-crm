import type { Metadata } from "next";
import { forbidden } from "next/navigation";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const metadata: Metadata = { title: "Settings" };

/** Settings holds users, the audit log and API keys: admins only (security doc, TC-02). */
export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user || !can(user, "admin.manage")) forbidden();
  return <ModulePlaceholder href="/settings" />;
}
