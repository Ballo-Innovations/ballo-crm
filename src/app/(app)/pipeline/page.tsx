import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return <ModulePlaceholder href="/pipeline" />;
}
