import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage() {
  return <ModulePlaceholder href="/accounts" />;
}
