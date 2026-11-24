import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return <ModulePlaceholder href="/leads" />;
}
