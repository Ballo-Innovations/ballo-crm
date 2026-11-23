import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Intelligence" };

export default function IntelligencePage() {
  return <ModulePlaceholder href="/intelligence" />;
}
