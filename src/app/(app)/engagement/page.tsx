import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Engagement" };

export default function EngagementPage() {
  return <ModulePlaceholder href="/engagement" />;
}
