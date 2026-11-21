import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return <ModulePlaceholder href="/insights" />;
}
