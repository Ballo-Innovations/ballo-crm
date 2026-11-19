import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "CIMS / Admin" };

export default function AdminPage() {
  return <ModulePlaceholder href="/admin" />;
}
